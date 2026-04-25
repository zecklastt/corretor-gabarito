"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Save, AlertTriangle, Check, X } from "lucide-react"
import { useScannerStore } from "@/store/scanner-store"
import { useExamStore } from "@/store/exam-store"
import { buildAppApiUrl } from "@/lib/api-config"
import type { Option, Submission, QuestionDetail } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { NOTA_STATUS_OPTIONS, type NotaStatus, type PendingGradeContext } from "@/lib/turmas"

interface ScanReviewModalProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  pendingGradeContext?: PendingGradeContext | null
}

export function ScanReviewModal({ open, onClose, onSave, pendingGradeContext }: ScanReviewModalProps) {
  const { scanResult, reset } = useScannerStore()
  const { getActiveExam, getActiveClass, addSubmission } = useExamStore()
  const { toast } = useToast()

  const [studentName, setStudentName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [studentEnrollmentId, setStudentEnrollmentId] = useState("")
  const [resultStatus, setResultStatus] = useState<NotaStatus>("sem resultado")
  const [editedAnswers, setEditedAnswers] = useState<Record<number, Option | null>>({})

  const activeExam = getActiveExam()
  const activeClass = getActiveClass()
  const totalQuestions = scanResult?.details?.length || activeExam?.totalQuestions || 0
  const city = scanResult?.city || scanResult?.aluno?.cidade_aluno || activeClass?.city || ""
  const instructor = scanResult?.instructor || scanResult?.aluno?.nome_instrutor || activeClass?.instructor || ""
  const date = scanResult?.date || activeClass?.date || ""

  // Calcular score em tempo real baseado nas respostas editadas
  const currentScore = useMemo(() => {
    if (!scanResult || !activeExam) return 0

    let correct = 0
    if (scanResult.details && scanResult.details.length > 0) {
      scanResult.details.forEach((detail: QuestionDetail) => {
        if (editedAnswers[detail.questao] === detail.resposta_correta) {
          correct++
        }
      })
    } else {
      for (let q = 1; q <= activeExam.totalQuestions; q++) {
        if (editedAnswers[q] === activeExam.answerKey[q]) {
          correct++
        }
      }
    }
    return correct
  }, [editedAnswers, scanResult, activeExam])

  const notaPercentual = useMemo(() => {
    if (totalQuestions === 0) return 0

    return (currentScore / totalQuestions) * 100
  }, [currentScore, totalQuestions])

  const formattedNotaPercentual = notaPercentual.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })

  useEffect(() => {
    if (scanResult) {
      // Se há detalhes da API, usar eles para inicializar as respostas
      if (scanResult.details && scanResult.details.length > 0) {
        const answers: Record<number, Option | null> = {}
        scanResult.details.forEach((detail: QuestionDetail) => {
          if (detail.resposta_lida === "BRANCO") {
            answers[detail.questao] = null
          } else if (["A", "B", "C", "D"].includes(detail.resposta_lida)) {
            answers[detail.questao] = detail.resposta_lida as Option
          }
        })
        setEditedAnswers(answers)
      } else {
        // Fallback para scanResult.answers
        setEditedAnswers(scanResult.answers)
      }
      
      // Extrair informações do aluno da API
      setStudentName(pendingGradeContext?.studentName || scanResult.studentName || scanResult.aluno?.nome_aluno || "")
      setStudentId(pendingGradeContext?.studentMatricula || scanResult.studentId || scanResult.matricula || "")
      setStudentEnrollmentId(
        pendingGradeContext?.studentEnrollmentId || scanResult.studentEnrollmentId || "",
      )
      setResultStatus(pendingGradeContext?.status || "sem resultado")
    }
  }, [scanResult, activeClass, pendingGradeContext])

  const handleSave = async () => {
    if (!activeExam || !scanResult) return

    if (!studentName.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, informe o nome do aluno",
        variant: "destructive",
      })
      return
    }

    const finalScore = currentScore * activeExam.config.pointsPerQuestion

    const submission: Submission = {
      id: `sub-${Date.now()}`,
      examId: activeExam.id,
      classId: activeClass?.id,
      studentName: studentName.trim(),
      studentId: studentId.trim() || undefined,
      studentEnrollmentId: studentEnrollmentId.trim() || undefined,
      city: city.trim() || undefined,
      instructor: instructor.trim() || undefined,
      date: date.trim() || undefined,
      answers: editedAnswers,
      score: finalScore,
      scannedAt: Date.now(),
      status: scanResult.warnings.length > 0 ? "warning" : "success",
    }

    try {
      // Enviar a nota para a API
      const response = await fetch(buildAppApiUrl("/api/salvar-nota"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_inscricao: studentEnrollmentId.trim() || studentId.trim() || studentName.trim(),
          nota: notaPercentual,
          resultado: resultStatus,
        }),
      })

      if (!response.ok) {
        console.error("Erro ao salvar nota na API:", response.statusText)
      }
    } catch (error) {
      console.error("Erro ao enviar nota para API:", error)
    }

    addSubmission(submission)
    toast({
      title: "Sucesso!",
      description: `Prova de ${studentName} salva com nota ${formattedNotaPercentual}`,
    })

    setStudentName("")
    setStudentId("")
    setStudentEnrollmentId("")
    setResultStatus("sem resultado")
    reset()
    onSave()
  }

  const handleAnswerChange = (questionNum: number, answer: Option) => {
    setEditedAnswers((prev) => ({
      ...prev,
      [questionNum]: answer,
    }))
  }

  if (!scanResult || !activeExam) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Validar Correção</DialogTitle>
          <div className="flex items-center gap-3 mt-2">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                Nota: {formattedNotaPercentual}
              </div>
              <div className="text-sm text-slate-500">
                {currentScore}/{totalQuestions} acertos
              </div>
            </div>
            {scanResult.warnings.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {scanResult.warnings.length} avisos
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="space-y-4 pe-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="studentName">Nome do aluno</Label>
                <Input
                  id="studentName"
                  value={studentName}
                  readOnly
                  className="mt-1 bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="studentId">Matrícula</Label>
                  <Input
                    id="studentId"
                    value={studentId}
                    readOnly
                    className="mt-1 bg-slate-50"
                  />
                </div>
                <div>
                  <Label htmlFor="studentEnrollmentId">Inscrição</Label>
                  <Input
                    id="studentEnrollmentId"
                    value={studentEnrollmentId}
                    readOnly
                    className="mt-1 bg-slate-50"
                  />
                </div>
                <div>
                  <Label htmlFor="resultStatus">Resultado</Label>
                  <Select value={resultStatus} onValueChange={(value) => setResultStatus(value as NotaStatus)}>
                    <SelectTrigger id="resultStatus" className="mt-1 w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTA_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {scanResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">Avisos de Detecção:</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {scanResult.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Answer Review Grid */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Respostas Detectadas (passe o mouse para ver o status):</h4>
              <div className="border rounded-lg p-3 max-h-[400px] overflow-y-auto">
                <TooltipProvider>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {scanResult.details && scanResult.details.length > 0
                      ? scanResult.details.map((detail: QuestionDetail) => {
                          const detected = editedAnswers[detail.questao]
                          const correct = detail.resposta_correta
                          const isCorrect = detected === correct
                          const isBlank = detected === null || detected === undefined
                          const statusText = isBlank ? "Em branco" : isCorrect ? "Correto ✓" : "Incorreto ✗"

                          return (
                            <div
                              key={detail.questao}
                              className={`border-2 rounded-lg p-3 transition-all ${
                                isBlank
                                  ? "bg-slate-50 border-slate-300"
                                  : isCorrect
                                    ? "bg-emerald-50 border-emerald-400"
                                    : "bg-red-50 border-red-400"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-sm font-bold text-slate-700">Q{detail.questao}</div>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                      {isBlank ? (
                                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                      ) : isCorrect ? (
                                        <Check className="w-4 h-4 text-emerald-600" />
                                      ) : (
                                        <X className="w-4 h-4 text-red-600" />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-sm font-medium">{statusText}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>

                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-slate-600">Correto: <b className="text-emerald-700">{correct}</b></span>
                                </div>

                                <div className="flex gap-1 mt-2 pt-2 border-t border-slate-300">
                                  {(["A", "B", "C", "D"] as Option[]).map((opt) => (
                                    <button
                                      type="button"
                                      key={opt}
                                      onClick={() => handleAnswerChange(detail.questao, opt)}
                                      className={`flex-1 h-6 rounded border-2 text-xs font-bold transition-colors ${
                                        editedAnswers[detail.questao] === opt
                                          ? "bg-slate-900 text-white border-slate-900"
                                          : "bg-white border-slate-300 hover:border-slate-500"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      : Array.from({ length: activeExam.totalQuestions }, (_, i) => i + 1).map((qNum) => {
                          const detected = editedAnswers[qNum]
                          const correct = activeExam.answerKey[qNum]
                          const isCorrect = detected === correct
                          const isBlank = detected === null || detected === undefined
                          const statusText = isBlank ? "Em branco" : isCorrect ? "Correto ✓" : "Incorreto ✗"

                          return (
                            <div
                              key={qNum}
                              className={`border-2 rounded-lg p-2 transition-all ${
                                isBlank
                                  ? "bg-slate-50 border-slate-300"
                                  : isCorrect
                                    ? "bg-emerald-50 border-emerald-400"
                                    : "bg-red-50 border-red-400"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <div className="text-xs font-semibold text-slate-700">Q{qNum}</div>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                      {isBlank ? (
                                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                      ) : isCorrect ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <X className="w-3 h-3 text-red-600" />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-sm font-medium">{statusText}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="flex gap-1">
                                {(["A", "B", "C", "D"] as Option[]).map((opt) => (
                                  <button
                                    type="button"
                                    key={opt}
                                    onClick={() => handleAnswerChange(qNum, opt)}
                                    className={`w-7 h-7 rounded border-2 text-xs font-bold transition-colors ${
                                      editedAnswers[qNum] === opt
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white border-slate-300 hover:border-slate-500"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                Gabarito: <span className="font-bold">{correct}</span>
                              </div>
                            </div>
                          )
                        })}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 h-4 w-4" />
            Salvar Resultado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
