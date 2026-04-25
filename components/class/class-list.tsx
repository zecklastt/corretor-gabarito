"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useExamStore } from "@/store/exam-store"
import { Plus, Users, Trash2 } from "lucide-react"

interface ClassListProps {
  onCreateClass: () => void
}

export function ClassList({ onCreateClass }: ClassListProps) {
  const { classes, deleteClass, getClassSubmissions, setActiveClass } = useExamStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Turmas</h2>
        <Button onClick={onCreateClass} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Turma
        </Button>
      </div>

      {classes.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">Nenhuma turma criada</h3>
          <p className="text-sm text-slate-500 mb-4">Crie turmas para organizar suas correções</p>
          <Button onClick={onCreateClass} variant="outline">
            Criar Primeira Turma
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {classes.map((classData) => {
            const submissions = getClassSubmissions(classData.id)
            return (
              <Card
                key={classData.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActiveClass(classData.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{classData.name}</h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">Cidade:</span> {classData.city}
                      </p>
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">Instrutor:</span> {classData.instructor}
                      </p>
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">Data:</span> {classData.date}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                        {submissions.length} correções
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Deseja excluir a turma "${classData.name}"?`)) {
                        deleteClass(classData.id)
                      }
                    }}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
