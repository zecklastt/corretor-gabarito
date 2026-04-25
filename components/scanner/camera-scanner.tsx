"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Camera, Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { useExamStore } from "@/store/exam-store"
import { useScannerStore } from "@/store/scanner-store"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { buildScanApiUrl } from "@/lib/api-config"
import type { Option } from "@/lib/types"
import type { PendingGradeContext } from "@/lib/turmas"

const A4_RATIO = 297 / 210
const OVERLAY_WIDTH_RATIO = 0.9
const OVERLAY_MAX_WIDTH = 512
const CAPTURE_INSET_RATIO = 0.02
const DETECTION_CANVAS_WIDTH = 420
const DETECTION_DARK_THRESHOLD = 80
const DETECTION_MIN_CENTER_LUMA = 105
const DETECTION_STABLE_HITS = 15
const AUTO_CAPTURE_COOLDOWN_MS = 2500

const SQUARE_MIN_SIDE = 5
const SQUARE_MAX_SIDE = 45
const SQUARE_MAX_ASPECT = 2.0
const SQUARE_MIN_FILL = 0.6
const SQUARE_SIZE_TOLERANCE = 3.0

interface DetectedSquare {
  x: number
  y: number
  area: number
}

function findDarkSquares(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): DetectedSquare[] {
  const total = width * height
  const binary = new Uint8Array(total)
  for (let i = 0; i < total; i++) {
    const idx = i * 4
    const luma = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114
    binary[i] = luma < DETECTION_DARK_THRESHOLD ? 1 : 0
  }

  const visited = new Uint8Array(total)
  const candidates: DetectedSquare[] = []

  for (let startY = 0; startY < height; startY++) {
    for (let startX = 0; startX < width; startX++) {
      const startIdx = startY * width + startX
      if (binary[startIdx] === 0 || visited[startIdx]) continue

      let minX = startX, maxX = startX, minY = startY, maxY = startY
      let area = 0
      const stack: number[] = [startIdx]

      while (stack.length > 0) {
        const ci = stack.pop()!
        if (visited[ci]) continue
        visited[ci] = 1

        const cx = ci % width
        const cy = (ci - cx) / width
        area++
        if (cx < minX) minX = cx
        if (cx > maxX) maxX = cx
        if (cy < minY) minY = cy
        if (cy > maxY) maxY = cy

        if (area > SQUARE_MAX_SIDE * SQUARE_MAX_SIDE * 2) break

        if (cx > 0 && binary[ci - 1] && !visited[ci - 1]) stack.push(ci - 1)
        if (cx < width - 1 && binary[ci + 1] && !visited[ci + 1]) stack.push(ci + 1)
        if (cy > 0 && binary[ci - width] && !visited[ci - width]) stack.push(ci - width)
        if (cy < height - 1 && binary[ci + width] && !visited[ci + width]) stack.push(ci + width)
      }

      const bw = maxX - minX + 1
      const bh = maxY - minY + 1
      const side = Math.max(bw, bh)
      const aspect = side / Math.max(1, Math.min(bw, bh))
      const fill = area / (bw * bh)

      if (
        side >= SQUARE_MIN_SIDE &&
        side <= SQUARE_MAX_SIDE &&
        aspect <= SQUARE_MAX_ASPECT &&
        fill >= SQUARE_MIN_FILL
      ) {
        candidates.push({
          x: (minX + maxX) / 2 / width,
          y: (minY + maxY) / 2 / height,
          area,
        })
      }
    }
  }

  if (candidates.length < 4) return candidates

  candidates.sort((a, b) => b.area - a.area)

  let bestGroup: DetectedSquare[] = []
  const limit = Math.min(candidates.length, 20)
  for (let i = 0; i < limit; i++) {
    const refArea = candidates[i].area
    const group = candidates.filter((c) => {
      const ratio = Math.max(c.area, refArea) / Math.max(1, Math.min(c.area, refArea))
      return ratio <= SQUARE_SIZE_TOLERANCE
    })
    if (group.length > bestGroup.length) {
      bestGroup = group
    }
  }

  if (bestGroup.length <= 4) return bestGroup
  return bestGroup.slice(0, 4)
}

interface CameraScannerProps {
  onClose: () => void
  onScanComplete: () => void
  pendingGradeContext?: PendingGradeContext | null
}

export function CameraScanner({ onClose, onScanComplete, pendingGradeContext }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoCaptureCooldownRef = useRef(0)
  const stableHitsRef = useRef(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectStatus, setDetectStatus] = useState<"idle" | "detecting" | "found">("idle")
  const [isGuideAligned, setIsGuideAligned] = useState(false)
  const [detectedSquares, setDetectedSquares] = useState<{x: number, y: number}[]>([])
  const [scannedCount, setScannedCount] = useState(0)
  const { toast } = useToast()

  const { getActiveExam, getExamSubmissions } = useExamStore()
  const { setScanResult } = useScannerStore()
  const activeExam = getActiveExam()

  useEffect(() => {
    if (activeExam) {
      const submissions = getExamSubmissions(activeExam.id)
      setScannedCount(submissions.length)
    }
  }, [activeExam, getExamSubmissions])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Camera access error:", error)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  const getGuideCropArea = (
    video: HTMLVideoElement,
    preview: HTMLDivElement,
    insetRatio = CAPTURE_INSET_RATIO,
  ) => {
    const containerWidth = preview.clientWidth
    const containerHeight = preview.clientHeight

    if (!containerWidth || !containerHeight || !video.videoWidth || !video.videoHeight) {
      return null
    }

    const overlayWidth = Math.min(containerWidth * OVERLAY_WIDTH_RATIO, OVERLAY_MAX_WIDTH)
    const overlayHeight = overlayWidth * A4_RATIO

    const overlayLeft = (containerWidth - overlayWidth) / 2
    const overlayTop = (containerHeight - overlayHeight) / 2

    const scale = Math.max(containerWidth / video.videoWidth, containerHeight / video.videoHeight)
    const renderedVideoWidth = video.videoWidth * scale
    const renderedVideoHeight = video.videoHeight * scale
    const renderedVideoLeft = (containerWidth - renderedVideoWidth) / 2
    const renderedVideoTop = (containerHeight - renderedVideoHeight) / 2

    let sx = (overlayLeft - renderedVideoLeft) / scale
    let sy = (overlayTop - renderedVideoTop) / scale
    let sw = overlayWidth / scale
    let sh = overlayHeight / scale

    const insetX = sw * insetRatio
    const insetY = sh * insetRatio
    sx += insetX
    sy += insetY
    sw -= insetX * 2
    sh -= insetY * 2

    sx = Math.max(0, sx)
    sy = Math.max(0, sy)
    sw = Math.min(sw, video.videoWidth - sx)
    sh = Math.min(sh, video.videoHeight - sy)

    if (sw <= 0 || sh <= 0) {
      return null
    }

    return { sx, sy, sw, sh }
  }

  const getRegionStats = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number,
    regionWidth: number,
    regionHeight: number,
  ) => {
    const startX = Math.max(0, Math.min(width - 1, x))
    const startY = Math.max(0, Math.min(height - 1, y))
    const endX = Math.max(startX + 1, Math.min(width, startX + regionWidth))
    const endY = Math.max(startY + 1, Math.min(height, startY + regionHeight))

    let sumLuma = 0
    let darkPixels = 0
    let pixelCount = 0

    for (let py = startY; py < endY; py++) {
      for (let px = startX; px < endX; px++) {
        const idx = (py * width + px) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const luma = r * 0.299 + g * 0.587 + b * 0.114
        sumLuma += luma
        if (luma < DETECTION_DARK_THRESHOLD) {
          darkPixels++
        }
        pixelCount++
      }
    }

    if (!pixelCount) {
      return { meanLuma: 255, darkRatio: 0 }
    }

    return {
      meanLuma: sumLuma / pixelCount,
      darkRatio: darkPixels / pixelCount,
    }
  }

  const detectReferenceMarkers = (): { squares: {x: number, y: number}[], centerOk: boolean } | null => {
    if (!videoRef.current || !previewRef.current || isProcessing || detectStatus !== "idle") {
      return null
    }

    const video = videoRef.current
    const preview = previewRef.current
    const crop = getGuideCropArea(video, preview, 0)

    if (!crop) {
      return null
    }

    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement("canvas")
    }

    const canvas = analysisCanvasRef.current
    const context = canvas.getContext("2d", { willReadFrequently: true })

    if (!context) {
      return null
    }

    const width = DETECTION_CANVAS_WIDTH
    const height = Math.round(width * A4_RATIO)

    canvas.width = width
    canvas.height = height

    context.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height)

    const imageData = context.getImageData(0, 0, width, height)
    const data = imageData.data

    const centerW = Math.round(width * 0.25)
    const centerH = Math.round(height * 0.2)
    const center = getRegionStats(
      data,
      width,
      height,
      Math.round((width - centerW) / 2),
      Math.round((height - centerH) / 2),
      centerW,
      centerH,
    )
    const centerOk = center.meanLuma >= DETECTION_MIN_CENTER_LUMA

    const squares = findDarkSquares(data, width, height)

    return { squares, centerOk }
  }

  useEffect(() => {
    if (!activeExam) return

    const intervalId = window.setInterval(() => {
      const result = detectReferenceMarkers()

      if (!result) {
        setDetectedSquares([])
        setIsGuideAligned(false)
        stableHitsRef.current = 0
        return
      }

      setDetectedSquares(result.squares)
      const allAligned = result.squares.length >= 4 && result.centerOk
      setIsGuideAligned(allAligned)

      if (!allAligned || isProcessing || detectStatus !== "idle") {
        stableHitsRef.current = 0
        return
      }

      stableHitsRef.current += 1

      const canAutoCapture = Date.now() - autoCaptureCooldownRef.current > AUTO_CAPTURE_COOLDOWN_MS
      if (stableHitsRef.current >= DETECTION_STABLE_HITS && canAutoCapture) {
        autoCaptureCooldownRef.current = Date.now()
        stableHitsRef.current = 0
        captureImage()
      }
    }, 350)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [activeExam, isProcessing, detectStatus])

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !previewRef.current || !activeExam) return

    const video = videoRef.current
    const preview = previewRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return
    if (!video.videoWidth || !video.videoHeight) {
      toast({
        title: "Câmera ainda inicializando",
        description: "Aguarde 1 segundo e tente capturar novamente.",
        variant: "destructive",
      })
      return
    }

    const crop = getGuideCropArea(video, preview)
    if (!crop) return

    const { sx, sy, sw, sh } = crop

    const outputWidth = Math.max(1200, Math.round(sw))
    const outputHeight = Math.round(outputWidth * A4_RATIO)

    canvas.width = outputWidth
    canvas.height = outputHeight
    context.drawImage(video, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight)

    const imageData = canvas.toDataURL("image/jpeg", 0.95)
    processCapture(imageData)
  }

  const processCapture = async (imageData: string) => {
    if (!activeExam) return

    setIsProcessing(true)
    setDetectStatus("detecting")

    try {
      if (!imageData.startsWith("data:image")) {
        throw new Error("Formato de imagem inválido")
      }

      const idTipoCurso = activeExam.id_tipo_curso ?? (activeExam.course ? Number(activeExam.course) : undefined)
      const tipoProva = activeExam.tipo_prova ?? (activeExam.type ? String(activeExam.type) : undefined)

      if (!idTipoCurso || !tipoProva) {
        throw new Error(
          `Dados da prova incompletos. 
          id_tipo_curso: ${idTipoCurso || "não definido"}, 
          tipo_prova: ${tipoProva || "não definido"}. 
          Recrie a prova ou atualize os dados.`,
        )
      }

      // Converter data URL para blob
      const response = await fetch(imageData)
      const blob = await response.blob()

      // Criar FormData para enviar a imagem
      const formData = new FormData()
      formData.append("img", blob, "scan.jpg")
      formData.append("id_tipo_curso", String(idTipoCurso))
      formData.append("tipo_prova", String(tipoProva))

      const apiResponse = await fetch(buildScanApiUrl("/processar"), {
        method: "POST",
        body: formData,
      })

      if (!apiResponse.ok) {
        throw new Error(`Erro da API: ${apiResponse.statusText}`)
      }

      const result = await apiResponse.json()
      console.log("Resultado bruto do processar:", result)

      // Extrair o array de detalhes - pode estar em result ou result.detalhes ou ser o próprio array
      let resultArray = Array.isArray(result) ? result : result.detalhes || result.details || []
      
      console.log("Array processado:", resultArray)

      if (!Array.isArray(resultArray)) {
        throw new Error("Resposta da API em formato inválido: não é um array")
      }

      // Processar o array de detalhes para extrair as respostas
      const answers: Record<number, Option | null> = {}
      let correctCount = 0

      resultArray.forEach((detail: any) => {
        const questao = detail.questao
        const resposta_lida = detail.resposta_lida

        // Converter resposta_lida para Option (A, B, C, D) ou null se BRANCO
        if (resposta_lida === "BRANCO") {
          answers[questao] = null
        } else if (["A", "B", "C", "D"].includes(resposta_lida)) {
          answers[questao] = resposta_lida as Option
        }

        if (detail.acertou) {
          correctCount++
        }
      })

      const score = correctCount

      // Usar os dados da resposta da API
      setScanResult({
        answers,
        score,
        warnings: [],
        details: resultArray,
        matricula: pendingGradeContext?.studentMatricula || result.matricula,
        studentId: pendingGradeContext?.studentMatricula || result.matricula,
        studentEnrollmentId: pendingGradeContext?.studentEnrollmentId,
        studentName: pendingGradeContext?.studentName || result.aluno?.nome_aluno,
        city: result.aluno?.cidade_aluno,
        instructor: result.aluno?.nome_instrutor,
        aluno: result.aluno,
      })

      setDetectStatus("found")
      setIsGuideAligned(false)

      {
        toast({
          title: "Prova processada!",
          description: `Score: ${correctCount}/${resultArray.length}`,
        })
      }

      setTimeout(() => {
        onScanComplete()
      }, 500)
    } catch (error) {
      setDetectStatus("idle")
      setIsGuideAligned(false)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar imagem"

      console.error("Erro completo:", error)
      toast({
        title: "Erro no processamento",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result as string
      processCapture(imageData)
    }
    reader.readAsDataURL(file)
  }

  if (!activeExam) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center">
        <Card className="p-6 max-w-md mx-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center mb-2">Nenhuma Prova Selecionada</h2>
          <p className="text-center text-slate-600 mb-4">Selecione uma prova no dashboard antes de escanear.</p>
          <Button onClick={onClose} className="w-full">
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-slate-700">
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold text-white">{activeExam.title}</h2>
            <p className="text-xs text-slate-400">{activeExam.totalQuestions} questões</p>
            {pendingGradeContext && (
              <p className="text-xs text-slate-300 mt-1">
                Aluno: {pendingGradeContext.studentName} • Matrícula: {pendingGradeContext.studentMatricula}
              </p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-600 text-white">
          {scannedCount} corrigidas
        </Badge>
      </div>

      {/* Camera View */}
      <div ref={previewRef} className="flex-1 relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

        {/* Overlay Guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-[90%] max-w-lg aspect-[210/297] border-4 rounded-lg transition-all duration-300 ${
              detectStatus === "idle"
                ? isGuideAligned
                  ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)]"
                  : detectedSquares.length >= 2
                    ? "border-amber-400/70"
                    : "border-white/40"
                : detectStatus === "detecting"
                  ? "border-yellow-400 animate-pulse"
                  : "border-emerald-400"
            }`}
          >
            <div className="relative w-full h-full">
              {/* Marcadores dinâmicos - mostram onde os quadrados pretos foram detectados */}
              {detectedSquares.map((sq, i) => (
                <div
                  key={i}
                  className="absolute transition-all duration-200"
                  style={{
                    left: `${sq.x * 100}%`,
                    top: `${sq.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="w-7 h-7 border-2 border-emerald-400 rounded-sm bg-emerald-400/20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                  </div>
                </div>
              ))}
              {/* Guias de canto estáticas (referência visual sutil) */}
              <div className="absolute top-1 left-1 w-5 h-5 border-t-2 border-l-2 border-white/30" />
              <div className="absolute top-1 right-1 w-5 h-5 border-t-2 border-r-2 border-white/30" />
              <div className="absolute bottom-1 left-1 w-5 h-5 border-b-2 border-l-2 border-white/30" />
              <div className="absolute bottom-1 right-1 w-5 h-5 border-b-2 border-r-2 border-white/30" />
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
          {detectStatus === "idle" && (
            <div
              className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 ${
                isGuideAligned ? "bg-emerald-500 text-slate-900 animate-pulse" : "bg-slate-800/90 text-white"
              }`}
            >
              {isGuideAligned ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Referências detectadas — capturando...
                </>
              ) : (
                <>
                  <span className="font-mono font-bold">{detectedSquares.length}/4</span>
                  {detectedSquares.length >= 4
                    ? "Aguardando estabilizar..."
                    : detectedSquares.length > 0
                      ? "Quadrados detectados — posicione a folha"
                      : "Posicione a folha dentro do quadro"}
                </>
              )}
            </div>
          )}
          {detectStatus === "detecting" && (
            <div className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              Processando...
            </div>
          )}
          {detectStatus === "found" && (
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Prova detectada!
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800 p-6 space-y-3">
        <Button
          onClick={captureImage}
          disabled={isProcessing}
          className="h-14 w-full bg-blue-600 text-lg hover:bg-blue-700"
        >
          {isProcessing ? (
            <>Processando...</>
          ) : (
            <>
              <Camera className="mr-2 h-5 w-5" />
              Capturar Prova
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full bg-transparent text-white border-slate-600 hover:bg-slate-700"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload de Imagem
        </Button>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
