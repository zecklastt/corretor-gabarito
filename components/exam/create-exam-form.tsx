"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { getSession } from "@/lib/auth"
import { buildAppApiUrl, USE_MOCK_DATA } from "@/lib/api-config"
import { createMockExam } from "@/lib/mock-data"
import { useExamStore } from "@/store/exam-store"
import type { ExamTemplate, Option } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface CreateExamFormProps {
  onBack: () => void
  onSuccess: () => void
}

const COURSE_OPTIONS = [
  { id: 101, name: "Fundamentos de Atendimento" },
  { id: 102, name: "Suporte Basico" },
  { id: 103, name: "Suporte Avancado" },
  { id: 104, name: "Avaliacao Clinica" },
  { id: 105, name: "Atendimento em Pediatria" },
  { id: 106, name: "Procedimentos Essenciais" },
  { id: 107, name: "Simulacao de Cenarios" },
  { id: 108, name: "Atualizacao em Emergencias" },
]

export function CreateExamForm({ onBack, onSuccess }: CreateExamFormProps) {
  const { addExam } = useExamStore()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [examType, setExamType] = useState<number>(1)
  const [course, setCourse] = useState<number | null>(null)
  const [answerKey, setAnswerKey] = useState<Record<number, Option>>({})

  // Atualiza automaticamente o título com base em curso + número da prova
  useEffect(() => {
    if (!course) {
      setTitle("")
      return
    }
    const courseName = COURSE_OPTIONS.find((c) => c.id === course)?.name
    const numberStr = String(examType).padStart(2, "0")
    setTitle(`${courseName} - Prova ${numberStr}`)
  }, [course, examType])

  const handlePublish = () => {
    if (!course) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o curso",
        variant: "destructive",
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "Título da prova inválido. Verifique o curso e o número da prova.",
        variant: "destructive",
      })
      return
    }

    if (totalQuestions < 1 || totalQuestions > 50) {
      toast({
        title: "Erro",
        description: "O número de questões deve estar entre 1 e 50",
        variant: "destructive",
      })
      return
    }

    const missingAnswers: number[] = []
    for (let i = 1; i <= totalQuestions; i++) {
      if (!answerKey[i]) {
        missingAnswers.push(i)
      }
    }

    if (missingAnswers.length > 0) {
      toast({
        title: "Atenção",
        description: `Preencha as respostas das questões: ${missingAnswers.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    const selectedCourseName = COURSE_OPTIONS.find((item) => item.id === course)?.name ?? null

    const examData = {
      title,
      course: selectedCourseName ?? undefined,
      id_tipo_curso: course,
      type: examType,
      tipo_prova: String(examType),
      totalQuestions,
      answerKey,
      config: {
        tolerance: 0.6,
        pointsPerQuestion: 1,
      },
    }

    const saveProveData = async () => {
      if (USE_MOCK_DATA) {
        const session = getSession()

        if (!session) {
          toast({
            title: "Erro",
            description: "Sessão inválida para salvar a prova localmente.",
            variant: "destructive",
          })
          return
        }

        const createdExam = createMockExam(session.id, examData)
        addExam(createdExam)
        toast({
          title: "Sucesso!",
          description: "Prova criada e salva localmente para este usuário.",
          variant: "success" as const,
        })
        onSuccess()
        return
      }

      try {
        const response = await fetch(buildAppApiUrl("/api/salvar-info-prova"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(examData),
        })

        if (!response.ok) {
          let errorMessage = "Erro ao salvar a prova no servidor"
          try {
            const errorData = await response.json()
            errorMessage = errorData?.message || errorMessage
          } catch {
            errorMessage = response.status === 409 ? "Já existe este tipo de prova" : errorMessage
          }
          throw new Error(errorMessage)
        }

        toast({
          title: "Sucesso!",
          description: "Prova criada com sucesso",
          variant: "success" as const,
        })
        onSuccess()
      } catch (error) {
        console.error("Erro ao salvar prova:", error)
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro ao salvar a prova no servidor",
          variant: "destructive",
        })
      }
    }

    saveProveData()
  }

  const handleQuestionChange = (questionNumber: number, answer: Option) => {
    setAnswerKey((prev) => ({
      ...prev,
      [questionNumber]: answer,
    }))
  }

  const answeredCount = Object.keys(answerKey).filter((key) => {
    const num = Number(key)
    return num >= 1 && num <= totalQuestions && answerKey[num]
  }).length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Criar Nova Prova</h1>
            <p className="text-sm text-slate-500">Defina o gabarito oficial</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="questions">Número de Questões (1-50)</Label>
                  <Input
                    id="questions"
                    type="number"
                    min="1"
                    max="50"
                    value={totalQuestions}
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value) || 1
                      setTotalQuestions(Math.min(50, Math.max(1, val)))
                      setAnswerKey({})
                    }}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Número da Prova (1 a 10)</Label>
                  <div className="mt-1">
                    <Select
                      value={String(examType)}
                      onValueChange={(val) => setExamType(Number.parseInt(val) || 1)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o número" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label>Curso</Label>
                <div className="mt-1">
                  <Select value={String(course || "")} onValueChange={(val) => setCourse(Number(val))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_OPTIONS.map((course_option) => (
                        <SelectItem key={course_option.id} value={String(course_option.id)}>
                          {course_option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Título da Prova (gerado automaticamente)</Label>
                <Input
                  id="title"
                  placeholder="Ex: Suporte Basico - Prova 01"
                  value={title}
                  disabled
                  readOnly
                  className="mt-1 bg-slate-100"
                />
              </div>
            </div>
          </Card>

          {/* Answer Key Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Gabarito Oficial</h2>
                <p className="text-sm text-slate-500">Selecione a alternativa correta para cada questão</p>
              </div>
              <div className="text-sm font-medium text-slate-600">
                {answeredCount}/{totalQuestions} respondidas
              </div>
            </div>

            <ScrollArea className="h-[600px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((questionNum) => {
                  const currentAnswer = answerKey[questionNum]

                  return (
                    <div
                      key={questionNum}
                      className={`border rounded-lg p-2 transition-colors ${
                        currentAnswer ? "bg-blue-50 border-blue-200" : "bg-white"
                      }`}
                    >
                      <Label className="font-semibold text-slate-700 text-xs mb-2 block">Q{questionNum}</Label>
                      <div className="grid grid-cols-4 gap-1">
                        {(["A", "B", "C", "D"] as Option[]).map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={currentAnswer === option ? "default" : "outline"}
                            className={`h-7 text-xs ${
                              currentAnswer === option ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-slate-100"
                            }`}
                            onClick={() => handleQuestionChange(questionNum, option)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="button" onClick={handlePublish} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" />
              Publicar Prova ({answeredCount}/{totalQuestions})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
