"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  buildResultadoPayload,
  fetchTurmaAlunos,
  NOTA_STATUS_OPTIONS,
  salvarResultadosTurma,
  type NotaStatus,
  type Turma,
  type TurmaAluno,
  type TurmaAlunoResultadoPayload,
} from "@/lib/turmas"
import { useToast } from "@/hooks/use-toast"
import { Camera, Loader2, Save } from "lucide-react"

interface GradeAssignmentDraft extends TurmaAluno {
  nota: string
  status: NotaStatus
}

interface AssignGradeModalProps {
  open: boolean
  turma: Turma | null
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void> | void
  onCorrigirProva: (payload: {
    turma: Turma
    aluno: TurmaAluno
    grade: string
    status: NotaStatus
    turmaType: number | null
  }) => void
}

export function AssignGradeModal({ open, turma, onOpenChange, onSaved, onCorrigirProva }: AssignGradeModalProps) {
  const { toast } = useToast()
  const [students, setStudents] = useState<GradeAssignmentDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [resolvedTurmaType, setResolvedTurmaType] = useState<number | null>(null)

  useEffect(() => {
    if (!open || !turma) {
      return
    }

    const currentTurma = turma

    let cancelled = false

    async function loadStudents() {
      setLoading(true)
      setError("")
      setResolvedTurmaType(null)

      try {
        const response = await fetchTurmaAlunos(currentTurma.id)

        if (cancelled) {
          return
        }

        setResolvedTurmaType(response.turmaType)

        setStudents(
          response.students.map((student) => ({
            ...student,
            nota: student.nota ?? "",
            status: student.status ?? "sem resultado",
          })),
        )
      } catch (err) {
        if (cancelled) {
          return
        }

        setError(err instanceof Error ? err.message : "Não foi possível carregar os alunos da turma.")
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadStudents()

    return () => {
      cancelled = true
    }
  }, [open, turma])

  function updateStudent(index: number, changes: Partial<GradeAssignmentDraft>) {
    setStudents((currentStudents) =>
      currentStudents.map((student, currentIndex) =>
        currentIndex === index ? { ...student, ...changes } : student,
      ),
    )
  }

  function handleCorrigirProva(student: GradeAssignmentDraft) {
    if (!turma) {
      return
    }

    onCorrigirProva({
      turma,
      aluno: student,
      grade: student.nota,
      status: student.status,
      turmaType: resolvedTurmaType,
    })
  }

  async function handleSave() {
    if (!turma || students.length === 0) {
      return
    }

    if (!confirm("Confirma os lançamentos de resultado?")) {
      return
    }

    const inscricoes: TurmaAlunoResultadoPayload[] = students.map((student) => buildResultadoPayload(student))

    setSaving(true)

    try {
      const message = await salvarResultadosTurma(turma.id, inscricoes)

      toast({
        title: "Sucesso",
        description: message,
        variant: "success",
      })

      await onSaved()
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível salvar os lançamentos.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-4 sm:max-w-[calc(100%-2rem)] sm:p-6 md:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Atribuir Nota</DialogTitle>
          <DialogDescription>
            {turma ? `Selecione um aluno da turma ${turma.titulo ?? turma.nome ?? turma.id}.` : "Carregando turma."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : students.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhum aluno vinculado a esta turma.
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <Table className="table-fixed md:table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead className="md:hidden">Aluno</TableHead>
                    <TableHead className="hidden md:table-cell">Aluno</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Inscrição</TableHead>
                    <TableHead className="hidden md:table-cell">Nota</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => {
                    const canCorrect = Boolean(student.id_inscricao && student.id_matricula)

                    return (
                      <TableRow key={`${student.id_inscricao || student.id_matricula || student.nome}-${index}`}>
                        <TableCell className="p-3 align-top whitespace-normal md:hidden">
                          <div className="flex flex-col gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Aluno</p>
                              <p className="break-words font-medium leading-snug">{student.nome}</p>
                            </div>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Nota</p>
                                <Input
                                  value={student.nota}
                                  placeholder="Ex: 8.5"
                                  onChange={(event) => updateStudent(index, { nota: event.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Status</p>
                                <Select
                                  value={student.status}
                                  onValueChange={(value) => updateStudent(index, { status: value as NotaStatus })}
                                >
                                  <SelectTrigger className="w-full">
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
                            <div className="flex justify-end">
                              <Button
                                size="icon-sm"
                                className="w-full"
                                disabled={!canCorrect || saving}
                                aria-label={`Corrigir prova de ${student.nome}`}
                                onClick={() => handleCorrigirProva(student)}
                              >
                                <Camera className="h-4 w-4" /> Corrigir Prova
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden font-medium md:table-cell">{student.nome}</TableCell>
                        <TableCell className="hidden md:table-cell">{student.email || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{student.id_inscricao || "-"}</TableCell>
                        <TableCell className="hidden min-w-28 md:table-cell">
                          <Input
                            value={student.nota}
                            placeholder="Ex: 8.5"
                            onChange={(event) => updateStudent(index, { nota: event.target.value })}
                          />
                        </TableCell>
                        <TableCell className="hidden min-w-44 md:table-cell">
                          <Select
                            value={student.status}
                            onValueChange={(value) => updateStudent(index, { status: value as NotaStatus })}
                          >
                            <SelectTrigger className="w-full">
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
                        </TableCell>
                        <TableCell className="hidden text-right md:table-cell">
                          <Button disabled={!canCorrect || saving} onClick={() => handleCorrigirProva(student)}>
                            Corrigir Prova
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Fechar
              </Button>
              <Button onClick={handleSave} disabled={saving || students.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}