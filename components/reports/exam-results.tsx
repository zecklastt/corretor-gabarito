"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, ArrowLeft, FileSpreadsheet } from "lucide-react"
import { useExamStore } from "@/store/exam-store"
import { generateCSV, downloadCSV } from "@/lib/csv-generator"
import { useToast } from "@/hooks/use-toast"

interface ExamResultsProps {
  examId: string
  classId?: string
  onBack: () => void
}

export function ExamResults({ examId, classId, onBack }: ExamResultsProps) {
  const { exams, getExamSubmissions, getClassSubmissions, getClass } = useExamStore()
  const { toast } = useToast()
  const exam = exams.find((e) => e.id === examId)

  const allSubmissions = classId ? getClassSubmissions(classId) : getExamSubmissions(examId)
  const submissions = classId ? allSubmissions.filter((s) => s.examId === examId) : allSubmissions
  const classData = classId ? getClass(classId) : undefined

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-6">
          <p className="text-slate-600">Prova não encontrada</p>
          <Button onClick={onBack} className="mt-4">
            Voltar
          </Button>
        </Card>
      </div>
    )
  }

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast({
        title: "Nenhum resultado",
        description: "Não há resultados para exportar",
        variant: "destructive",
      })
      return
    }

    const csvContent = generateCSV(submissions, exam, classData)
    const classPrefix = classData ? `${classData.name.replace(/\s+/g, "_")}_` : ""
    const filename = `${classPrefix}${exam.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    downloadCSV(csvContent, filename)

    toast({
      title: "Exportado!",
      description: `Arquivo ${filename} baixado com sucesso`,
    })
  }

  // Calculate statistics
  const totalSubmissions = submissions.length
  const averageScore =
    totalSubmissions > 0 ? submissions.reduce((sum, sub) => sum + sub.score, 0) / totalSubmissions : 0
  const maxScore = exam.totalQuestions * exam.config.pointsPerQuestion
  const passRate =
    totalSubmissions > 0 ? (submissions.filter((s) => s.score >= maxScore * 0.6).length / totalSubmissions) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
            <p className="text-sm text-slate-500">
              {classData ? `Turma: ${classData.name}` : "Relatório de Resultados"}
            </p>
          </div>
          <Button onClick={handleExportCSV} className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-sm text-slate-500 mb-1">Total de Alunos</div>
            <div className="text-3xl font-bold text-slate-900">{totalSubmissions}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-slate-500 mb-1">Média da Turma</div>
            <div className="text-3xl font-bold text-blue-600">{averageScore.toFixed(1)}</div>
            <div className="text-xs text-slate-400 mt-1">de {maxScore} pontos</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-slate-500 mb-1">Taxa de Aprovação</div>
            <div className="text-3xl font-bold text-blue-600">{passRate.toFixed(0)}%</div>
            <div className="text-xs text-slate-400 mt-1">≥ 60% de acerto</div>
          </Card>
        </div>

        {/* Results Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Lista de Resultados</h2>
            <Badge variant="secondary">{totalSubmissions} alunos</Badge>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum resultado ainda</p>
              <p className="text-sm text-slate-400 mt-1">Comece a escanear provas para ver os resultados aqui</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50 border-b">
                  <tr className="text-left text-sm text-slate-600">
                    <th className="pb-3 pr-4">Aluno</th>
                    <th className="pb-3 pr-4">Matrícula</th>
                    <th className="pb-3 pr-4">Nota</th>
                    <th className="pb-3 pr-4">%</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions
                    .sort((a, b) => b.score - a.score)
                    .map((submission) => {
                      const percentage = (submission.score / maxScore) * 100
                      const passed = percentage >= 60

                      return (
                        <tr key={submission.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 pr-4 font-medium text-slate-900">{submission.studentName}</td>
                          <td className="py-3 pr-4 text-slate-600">{submission.studentId || "-"}</td>
                          <td className="py-3 pr-4 font-bold text-slate-900">
                            {submission.score}/{maxScore}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{percentage.toFixed(0)}%</td>
                          <td className="py-3">
                            <Badge variant={passed ? "default" : "destructive"} className="text-xs">
                              {passed ? "Aprovado" : "Reprovado"}
                            </Badge>
                            {submission.status === "warning" && (
                              <Badge variant="outline" className="ml-2 text-xs text-yellow-600 border-yellow-600">
                                Revisão
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </Card>

        {/* Question Analysis */}
        {submissions.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Análise por Questão</h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: exam.totalQuestions }, (_, i) => i + 1).map((qNum) => {
                const correctCount = submissions.filter((s) => s.answers[qNum] === exam.answerKey[qNum]).length
                const correctRate = (correctCount / totalSubmissions) * 100

                return (
                  <div
                    key={qNum}
                    className={`p-3 rounded-lg border-2 text-center ${
                      correctRate >= 80
                        ? "bg-blue-50 border-blue-300"
                        : correctRate >= 60
                          ? "bg-cyan-50 border-cyan-300"
                          : correctRate >= 40
                            ? "bg-yellow-50 border-yellow-300"
                            : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-700">Q{qNum}</div>
                    <div className="text-lg font-bold text-slate-900 mt-1">{correctRate.toFixed(0)}%</div>
                    <div className="text-[10px] text-slate-500 mt-1">{exam.answerKey[qNum]}</div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-300" />
                <span>≥80%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-cyan-300" />
                <span>60-79%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-300" />
                <span>40-59%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-slate-300" />
                <span>{"<40%"}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
