"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Printer, Trash2 } from "lucide-react"
import type { ExamTemplate } from "@/lib/types"
import { useExamStore } from "@/store/exam-store"

interface ExamCardProps {
  exam: ExamTemplate
  onView: () => void
  onPrint: () => void
}

export function ExamCard({ exam, onView, onPrint }: ExamCardProps) {
  const { getExamSubmissions, deleteExam } = useExamStore()
  const submissions = getExamSubmissions(exam.id)
  const completionRate = submissions.length

  return (
    <Card className="p-4 hover:shadow-md transition-shadow border-slate-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-900">{exam.title}</h3>
          <p className="text-sm text-slate-500 mt-1">{exam.totalQuestions} questões</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="border-blue-200 bg-blue-50 text-xs text-blue-700">
              {completionRate} alunos corrigidos
            </Badge>
            <Badge variant="outline" className="text-xs border-slate-300">
              {new Date(exam.createdAt).toLocaleDateString("pt-BR")}
            </Badge>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onView} className="text-slate-500 hover:text-slate-900">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex gap-2 mt-4">
        <Button size="sm" variant="outline" onClick={onPrint} className="flex-1 bg-transparent border-slate-300">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir Folha
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            if (confirm("Deseja realmente excluir esta prova?")) {
              deleteExam(exam.id)
            }
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
