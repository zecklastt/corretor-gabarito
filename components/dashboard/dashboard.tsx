"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, Plus, Printer, FileText, Trash2 } from "lucide-react"
import { ClassList } from "@/components/class/class-list"
import { useExamStore } from "@/store/exam-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { getSession } from "@/lib/auth"
import { buildAppApiUrl, USE_MOCK_DATA } from "@/lib/api-config"
import { deleteMockExam } from "@/lib/mock-data"
import type { PendingGradeContext } from "@/lib/turmas"
import { AppHeader } from "@/components/layout/app-header"

interface DashboardProps {
  onOpenScanner: () => void
  onCreateExam: () => void
  onCreateClass: () => void
  onViewExam: (examId: string) => void
  onPrintAnswerSheet: (examId: string, classId?: string) => void
  onPrintFullExam: (examId: string) => void
  onViewReports: (examId: string, classId?: string) => void
  pendingGradeContext?: PendingGradeContext | null
}

function matchesExamTurmaType(examIdTipoCurso: number | undefined, examCourse: string | undefined, turmaType: number) {
  if (examIdTipoCurso === turmaType) {
    return true
  }

  if (examCourse) {
    return Number(examCourse) === turmaType
  }

  return false
}

export function Dashboard({
  onOpenScanner,
  onCreateExam,
  onCreateClass,
  onViewExam,
  onPrintAnswerSheet,
  onPrintFullExam,
  onViewReports,
  pendingGradeContext,
}: DashboardProps) {
  const { exams, activeExamId, activeClassId, setActiveExam, getExamSubmissions, getActiveClass, deleteExam } = useExamStore()
  const { toast } = useToast()
  const activeClass = getActiveClass()
  const visibleExams = pendingGradeContext
    ? exams.filter((exam) => matchesExamTurmaType(exam.id_tipo_curso, exam.course, pendingGradeContext.turmaType))
    : exams

  useEffect(() => {
    if (!pendingGradeContext) {
      return
    }

    const matchingExams = exams.filter((exam) =>
      matchesExamTurmaType(exam.id_tipo_curso, exam.course, pendingGradeContext.turmaType),
    )

    if (!matchingExams.some((exam) => exam.id === activeExamId)) {
      setActiveExam(matchingExams[0]?.id ?? null)
    }
  }, [activeExamId, exams, pendingGradeContext, setActiveExam])

  const handleDeleteExam = async (examId: string) => {
    const exam = exams.find((e) => e.id === examId)
    if (!exam) return

    if (USE_MOCK_DATA) {
      const session = getSession()

      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão inválida para excluir a prova localmente.",
          variant: "destructive",
        })
        return
      }

      deleteMockExam(session.id, examId)
      deleteExam(examId)
      toast({
        title: "Sucesso!",
        description: "Prova local removida com sucesso",
        variant: "success" as const,
      })
      return
    }

    const idTipoCurso = exam.id_tipo_curso ?? (exam.course ? Number(exam.course) : undefined)
    const tipoProva = exam.tipo_prova ?? (exam.type ? String(exam.type) : undefined)

    if (!idTipoCurso || !tipoProva) {
      toast({
        title: "Erro",
        description: "Dados da prova incompletos para exclusão (Tipo do curso/tipo de prova).",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(buildAppApiUrl("/api/delete-prova"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_tipo_curso: idTipoCurso,
          tipo_prova: tipoProva,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao deletar prova no servidor")
      }

      deleteExam(examId)
      toast({
        title: "Sucesso!",
        description: "Prova deletada com sucesso",
        variant: "success" as const,
      })
    } catch (error) {
      console.error("Erro ao deletar prova:", error)
      toast({
        title: "Erro",
        description: "Erro ao deletar a prova",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-4 space-y-6">
        <AppHeader />

        {/* Quick Action Card */}
        <Card className="border-blue-700 bg-blue-600 p-6 text-white shadow-lg">
          <h2 className="text-xl font-semibold mb-2">
            {pendingGradeContext ? "Correção Vinculada" : "Nova Correção"}
          </h2>
          {pendingGradeContext && (
            <div className="mb-4 rounded-lg bg-white/10 p-3 text-sm">
              <p className="font-semibold">Aluno: {pendingGradeContext.studentName}</p>
              <p>Matrícula: {pendingGradeContext.studentMatricula}</p>
              <p>Inscrição: {pendingGradeContext.studentEnrollmentId}</p>
              <p>Tipo da turma: {pendingGradeContext.turmaType}</p>
              {pendingGradeContext.grade && <p>Nota digitada: {pendingGradeContext.grade}</p>}
              {pendingGradeContext.status && <p>Status: {pendingGradeContext.status}</p>}
            </div>
          )}
          <p className="mb-1 text-sm text-blue-50">
            {activeClass
              ? `Turma: ${activeClass.name}`
              : pendingGradeContext
                ? "Selecione uma prova compatível e abra a câmera"
                : "Selecione uma prova e turma"}
          </p>
          <p className="mb-4 text-xs text-blue-100">{activeClass ? `${activeClass.city} • ${activeClass.date}` : ""}</p>
          <Button
            variant="secondary"
            className="w-full bg-white font-semibold text-blue-700 hover:bg-blue-50"
            onClick={onOpenScanner}
            disabled={!activeExamId}
          >
            <Camera className="mr-2 h-5 w-5" />
            Abrir Câmera
          </Button>
          {!activeExamId && (
            <p className="mt-2 text-center text-xs text-blue-100">
              {pendingGradeContext ? "Nenhuma prova compatível com o tipo da turma" : "Selecione uma prova abaixo"}
            </p>
          )}
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="exams" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100">
            <TabsTrigger value="exams" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Provas
            </TabsTrigger>
            <TabsTrigger value="classes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Turmas
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="space-y-4 mt-4">
            <Button
              variant="outline"
              className="w-full border-blue-600 bg-transparent text-blue-700 hover:bg-blue-50"
              onClick={onCreateExam}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Nova Prova
            </Button>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Provas Cadastradas</h3>
              {visibleExams.length === 0 ? (
                <Card className="p-8 text-center border-slate-200">
                  <p className="text-slate-500">
                    {pendingGradeContext ? "Nenhuma prova compatível com a turma selecionada" : "Nenhuma prova cadastrada"}
                  </p>
                  {!pendingGradeContext && (
                    <Button variant="link" onClick={onCreateExam} className="mt-2 text-blue-600">
                      Crie seu primeiro gabarito
                    </Button>
                  )}
                </Card>
              ) : (
                visibleExams.map((exam) => (
                  <div
                    key={exam.id}
                    className={`${activeExamId === exam.id ? "rounded-lg ring-2 ring-blue-500" : ""}`}
                    onClick={() => setActiveExam(exam.id)}
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-slate-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => onViewExam(exam.id)}>
                          <h3 className="font-bold text-slate-900">{exam.title}</h3>
                          <p className="text-sm text-slate-500 mt-1">{exam.totalQuestions} questões</p>
                          <div className="mt-2 text-xs text-slate-400">
                            {getExamSubmissions(exam.id).length} correções
                          </div>
                        </div>
                        <div className="flex">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="text-slate-400">
                                <Printer className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onPrintAnswerSheet(exam.id, activeClassId || undefined)
                                }}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Folha de Respostas
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onPrintFullExam(exam.id)
                                }}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Prova Completa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteExam(exam.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="classes" className="mt-4">
            <ClassList onCreateClass={onCreateClass} />
          </TabsContent>

          <TabsContent value="reports" className="mt-4 space-y-3">
            {visibleExams.length === 0 ? (
              <Card className="p-8 text-center border-slate-200">
                <p className="text-slate-500">Nenhuma prova disponível</p>
              </Card>
            ) : (
              visibleExams.map((exam) => {
                const submissions = getExamSubmissions(exam.id)
                return (
                  <Card
                    key={exam.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-slate-200"
                    onClick={() => onViewReports(exam.id)}
                  >
                    <h3 className="font-bold text-slate-900">{exam.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{submissions.length} alunos corrigidos</p>
                    {submissions.length > 0 && (
                      <div className="mt-2 text-xs font-semibold text-blue-600">Ver relatório →</div>
                    )}
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
