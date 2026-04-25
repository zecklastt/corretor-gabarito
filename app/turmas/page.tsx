"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AssignGradeModal } from "@/components/turmas/assign-grade-modal"
import { AppHeader } from "@/components/layout/app-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
import { getSession, isAuthenticated, type UserSession } from "@/lib/auth"
import {
  candidatarComo,
  fetchInstrutorInfo,
  fetchTurmas,
  getCursoPermissaoId,
  podeCandidatarComo,
  savePendingGradeContext,
  vagaDisponivel,
  type CandidaturaTipo,
  type InstrutorInfo,
  type NotaStatus,
  type Turma,
  type TurmaAluno,
} from "@/lib/turmas"
import { ChevronLeft, ChevronRight, Loader2, MoreVertical } from "lucide-react"

type TurmasTab = "candidaturas" | "confirmadas"

function TurmaNameLabel({ id, name, isMobile }: { id: number | string; name: string; isMobile: boolean }) {
  const fullLabel = `${id} - ${name}`

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            aria-label={fullLabel}
          >
            {name}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] break-words p-3 text-sm">
          {fullLabel}
        </PopoverContent>
      </Popover>
    )
  }

  return <span className="block whitespace-normal break-words font-medium">{name}</span>
}

export default function TurmasPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const [session, setSession] = useState<UserSession | null>(null)
  const [activeTab, setActiveTab] = useState<TurmasTab>("candidaturas")
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmasConfirmadas, setTurmasConfirmadas] = useState<Turma[]>([])
  const [instrutorInfo, setInstrutorInfo] = useState<InstrutorInfo | null>(null)
  const [loadingInstrutorInfo, setLoadingInstrutorInfo] = useState(true)
  const [loadingTurmas, setLoadingTurmas] = useState(true)
  const [loadingTurmasConfirmadas, setLoadingTurmasConfirmadas] = useState(true)
  const [errorTurmas, setErrorTurmas] = useState("")
  const [errorTurmasConfirmadas, setErrorTurmasConfirmadas] = useState("")
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [confirmedPage, setConfirmedPage] = useState(1)
  const [confirmedLastPage, setConfirmedLastPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [selectedTurmaForGrade, setSelectedTurmaForGrade] = useState<Turma | null>(null)

  const loadInstrutorInfo = useCallback(async () => {
    setLoadingInstrutorInfo(true)

    try {
      const response = await fetchInstrutorInfo()
      setInstrutorInfo(response)
    } catch {
      setInstrutorInfo(null)
    } finally {
      setLoadingInstrutorInfo(false)
    }
  }, [])

  const loadTurmas = useCallback(async (pageNum: number) => {
    setLoadingTurmas(true)
    setErrorTurmas("")

    try {
      const response = await fetchTurmas(pageNum)
      setTurmas(response.data)
      setLastPage(response.last_page)
    } catch (err) {
      setErrorTurmas(err instanceof Error ? err.message : "Erro ao carregar dados.")
    } finally {
      setLoadingTurmas(false)
    }
  }, [])

  const loadTurmasConfirmadas = useCallback(async (pageNum: number) => {
    setLoadingTurmasConfirmadas(true)
    setErrorTurmasConfirmadas("")

    try {
      const response = await fetchTurmas(pageNum, { instrutor: true })
      setTurmasConfirmadas(response.data)
      setConfirmedLastPage(response.last_page)
    } catch (err) {
      setErrorTurmasConfirmadas(err instanceof Error ? err.message : "Erro ao carregar dados.")
    } finally {
      setLoadingTurmasConfirmadas(false)
    }
  }, [])

  useEffect(() => {
    const currentSession = getSession()

    if (!currentSession || !isAuthenticated()) {
      router.replace("/login")
      return
    }

    setSession(currentSession)
    setAuthReady(true)
  }, [router])

  useEffect(() => {
    if (!authReady) {
      return
    }

    loadInstrutorInfo()
  }, [authReady, loadInstrutorInfo])

  useEffect(() => {
    if (!authReady) {
      return
    }

    loadTurmas(page)
  }, [authReady, loadTurmas, page])

  useEffect(() => {
    if (!authReady) {
      return
    }

    loadTurmasConfirmadas(confirmedPage)
  }, [authReady, confirmedPage, loadTurmasConfirmadas])

  function getTurmaNome(turma: Turma): string {
    return turma.titulo ?? turma.nome ?? turma.curso_nome ?? `Turma ${turma.id}`
  }

  function getConfirmedMetric(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === "") {
      return "0"
    }

    return String(value)
  }

  function renderVagaBadge(vaga: unknown) {
    if (vagaDisponivel(vaga)) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-600">
          Vaga aberta
        </Badge>
      )
    }

    return <Badge variant="destructive">Sem vaga</Badge>
  }

  function getMenuActions(turma: Turma) {
    const canApplyAsInstructor =
      podeCandidatarComo(turma, instrutorInfo, "instrutor") && vagaDisponivel(turma.instrutor)
    const canApplyAsTrainee =
      podeCandidatarComo(turma, instrutorInfo, "trainee") && vagaDisponivel(turma.trainee)

    return {
      canApplyAsInstructor,
      canApplyAsTrainee,
      hasAnyAction: canApplyAsInstructor || canApplyAsTrainee,
    }
  }

  function renderCandidaturaActions(turma: Turma, triggerVariant: "icon" | "label" = "icon") {
    const { canApplyAsInstructor, canApplyAsTrainee, hasAnyAction } = getMenuActions(turma)
    const isLabelTrigger = triggerVariant === "label"

    if (isLabelTrigger) {
      return (
        <div className="flex flex-wrap justify-end gap-2 w-full">
          {canApplyAsInstructor && (
            <Button
              className="w-full"
              variant="outline"
              size="sm"
              disabled={actionLoading === `${turma.id}-instrutor`}
              onClick={() => handleCandidatar(turma, "instrutor")}
            >
              {actionLoading === `${turma.id}-instrutor` && <Loader2 className="h-4 w-4 animate-spin" />}
              Candidatar como instrutor
            </Button>
          )}
          {canApplyAsTrainee && (
            <Button
              className="w-full"
              variant="outline"
              size="sm"
              disabled={actionLoading === `${turma.id}-trainee`}
              onClick={() => handleCandidatar(turma, "trainee")}
            >
              {actionLoading === `${turma.id}-trainee` && <Loader2 className="h-4 w-4 animate-spin" />}
              Candidatar como trainee
            </Button>
          )}
          {!hasAnyAction && (
            <Button variant="outline" size="sm" disabled>
              Sem ações disponíveis
            </Button>
          )}
        </div>
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ações da turma ${turma.id}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canApplyAsInstructor && (
            <DropdownMenuItem
              disabled={actionLoading === `${turma.id}-instrutor`}
              onClick={() => handleCandidatar(turma, "instrutor")}
            >
              {actionLoading === `${turma.id}-instrutor` && <Loader2 className="h-4 w-4 animate-spin" />}
              Candidatar como instrutor
            </DropdownMenuItem>
          )}
          {canApplyAsTrainee && (
            <DropdownMenuItem
              disabled={actionLoading === `${turma.id}-trainee`}
              onClick={() => handleCandidatar(turma, "trainee")}
            >
              {actionLoading === `${turma.id}-trainee` && <Loader2 className="h-4 w-4 animate-spin" />}
              Candidatar como trainee
            </DropdownMenuItem>
          )}
          {!hasAnyAction && <DropdownMenuItem disabled>Sem ações disponíveis</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  function renderConfirmedActions(turma: Turma, triggerVariant: "icon" | "label" = "icon") {
    const isLabelTrigger = triggerVariant === "label"

    if (isLabelTrigger) {
      return (
        <Button variant="outline" size="sm" onClick={() => handleAtribuirNota(turma)}>
          Atribuir nota
        </Button>
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ações da turma confirmada ${turma.id}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleAtribuirNota(turma)}>Atribuir nota</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  async function handleCandidatar(turma: Turma, tipo: CandidaturaTipo) {
    const descricao = tipo === "instrutor" ? "instrutor" : "trainee"
    const vaga = tipo === "instrutor" ? turma.instrutor : turma.trainee

    if (!podeCandidatarComo(turma, instrutorInfo, tipo)) {
      toast({
        title: "Atenção",
        description: `Você não pode se candidatar como ${descricao} para este curso.`,
      })
      return
    }

    if (!vagaDisponivel(vaga)) {
      toast({
        title: "Atenção",
        description: "Não há vaga disponível para esta candidatura.",
      })
      return
    }

    setActionLoading(`${turma.id}-${tipo}`)

    try {
      const message = await candidatarComo(turma.id, tipo)

      toast({
        title: "Sucesso",
        description: message,
        variant: "success",
      })

      await loadTurmas(page)
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao enviar candidatura.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  function handleAtribuirNota(turma: Turma) {
    setSelectedTurmaForGrade(turma)
  }

  function handleCorrigirProvaAluno({
    turma,
    aluno,
    grade,
    status,
    turmaType,
  }: {
    turma: Turma
    aluno: TurmaAluno
    grade: string
    status: NotaStatus
    turmaType: number | null
  }) {
    const resolvedTurmaType = turmaType ?? getCursoPermissaoId(turma)

    if (resolvedTurmaType === null) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar o tipo da turma para iniciar a correção.",
        variant: "destructive",
      })
      return
    }

    if (!aluno.id_matricula || !aluno.id_inscricao) {
      toast({
        title: "Erro",
        description: "Aluno sem matrícula ou inscrição. Não é possível iniciar a correção.",
        variant: "destructive",
      })
      return
    }

    const pendingGradeContext = {
      studentName: aluno.nome,
      studentMatricula: aluno.id_matricula,
      studentEnrollmentId: aluno.id_inscricao,
      turmaType: resolvedTurmaType,
      turmaId: turma.id,
      turmaName: getTurmaNome(turma),
      status,
      grade,
    }

    if (!savePendingGradeContext(pendingGradeContext)) {
      toast({
        title: "Erro",
        description: "Não foi possível preparar a correção pendente neste navegador.",
        variant: "destructive",
      })
      return
    }

    router.push("/camera")
  }

  function renderEmptyState(message: string) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{message}</p>
  }

  function renderPagination(
    currentPage: number,
    totalPages: number,
    onPageChange: (updater: (currentPage: number) => number) => void,
  ) {
    if (totalPages <= 1) {
      return null
    }

    return (
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange((pageValue) => pageValue - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange((pageValue) => pageValue + 1)}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const loadingCandidaturas = !authReady || loadingInstrutorInfo || loadingTurmas
  const loadingConfirmadas = !authReady || loadingTurmasConfirmadas

  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <AppHeader />

        <div>
          <div>
            <h1 className="text-2xl font-bold">Turmas</h1>
            {session && <p className="text-sm text-muted-foreground">Olá, {session.nome}</p>}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TurmasTab)}>
          <TabsList>
            <TabsTrigger value="candidaturas">Turmas para candidatar</TabsTrigger>
            <TabsTrigger value="confirmadas">Turmas confirmadas</TabsTrigger>
          </TabsList>

          <TabsContent value="candidaturas">
            <Card>
              <CardContent>
                {loadingCandidaturas ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : errorTurmas ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-destructive">{errorTurmas}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => loadTurmas(page)}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : turmas.length === 0 ? (
                  renderEmptyState("Nenhuma turma encontrada.")
                ) : (
                  <>
                    <Table className="table-fixed md:table-auto">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="md:hidden">Turma</TableHead>
                            <TableHead className="hidden w-[80px] md:table-cell">ID</TableHead>
                            <TableHead className="hidden w-[220px] md:table-cell md:w-auto">Nome</TableHead>
                            <TableHead className="hidden text-center md:table-cell">Trainee</TableHead>
                            <TableHead className="hidden text-center md:table-cell">Instrutor</TableHead>
                            <TableHead className="hidden text-right md:table-cell">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {turmas.map((turma) => {
                            const turmaNome = getTurmaNome(turma)

                            return (
                              <TableRow key={turma.id}>
                                <TableCell className="p-3 align-top whitespace-normal md:hidden">
                                  <div className="flex flex-col gap-3">
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground">Turma #{turma.id}</p>
                                      <p className="break-words font-medium leading-snug">{turmaNome}</p>
                                    </div>
                                    <div className="grid gap-2 text-sm">
                                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2">
                                        <span className="text-muted-foreground">Trainee</span>
                                        {renderVagaBadge(turma.trainee)}
                                      </div>
                                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2">
                                        <span className="text-muted-foreground">Instrutor</span>
                                        {renderVagaBadge(turma.instrutor)}
                                      </div>
                                    </div>
                                    <div className="flex justify-end">{renderCandidaturaActions(turma, "label")}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden font-mono text-sm md:table-cell">{turma.id}</TableCell>
                                <TableCell className="hidden w-[220px] max-w-[220px] md:table-cell md:w-auto md:max-w-none">
                                  <TurmaNameLabel id={turma.id} name={turmaNome} isMobile={isMobile} />
                                </TableCell>
                                <TableCell className="hidden text-center md:table-cell">{renderVagaBadge(turma.trainee)}</TableCell>
                                <TableCell className="hidden text-center md:table-cell">{renderVagaBadge(turma.instrutor)}</TableCell>
                                <TableCell className="hidden text-right md:table-cell">
                                  <div className="flex justify-end">{renderCandidaturaActions(turma)}</div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>

                    {renderPagination(page, lastPage, setPage)}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirmadas">
            <Card>
              <CardContent>
                {loadingConfirmadas ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : errorTurmasConfirmadas ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-destructive">{errorTurmasConfirmadas}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => loadTurmasConfirmadas(confirmedPage)}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : turmasConfirmadas.length === 0 ? (
                  renderEmptyState("Nenhuma turma confirmada encontrada.")
                ) : (
                  <>
                    <Table className="table-fixed md:table-auto">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="md:hidden">Turma</TableHead>
                            <TableHead className="hidden w-[80px] md:table-cell">ID</TableHead>
                            <TableHead className="hidden w-[220px] md:table-cell md:w-auto">Nome</TableHead>
                            <TableHead className="hidden text-center md:table-cell">Inscrições com nota</TableHead>
                            <TableHead className="hidden text-center md:table-cell">Vagas ocupadas</TableHead>
                            <TableHead className="hidden text-right md:table-cell">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {turmasConfirmadas.map((turma) => {
                            const turmaNome = getTurmaNome(turma)

                            return (
                              <TableRow key={`confirmada-${turma.id}`}>
                                <TableCell className="p-3 align-top whitespace-normal md:hidden">
                                  <div className="flex flex-col gap-3">
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground">Turma #{turma.id}</p>
                                      <p className="break-words font-medium leading-snug">{turmaNome}</p>
                                    </div>
                                    <div className="grid gap-2 text-sm">
                                      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
                                        <span className="text-muted-foreground">Inscrições com nota</span>
                                        <span className="font-medium">{getConfirmedMetric(turma.inscricoes_com_nota)}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
                                        <span className="text-muted-foreground">Vagas ocupadas</span>
                                        <span className="font-medium">{getConfirmedMetric(turma.vagas_ocupadas)}</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-end">{renderConfirmedActions(turma, "label")}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden font-mono text-sm md:table-cell">{turma.id}</TableCell>
                                <TableCell className="hidden w-[220px] max-w-[220px] md:table-cell md:w-auto md:max-w-none">
                                  <TurmaNameLabel id={turma.id} name={turmaNome} isMobile={isMobile} />
                                </TableCell>
                                <TableCell className="hidden text-center md:table-cell">
                                  {getConfirmedMetric(turma.inscricoes_com_nota)}
                                </TableCell>
                                <TableCell className="hidden text-center md:table-cell">
                                  {getConfirmedMetric(turma.vagas_ocupadas)}
                                </TableCell>
                                <TableCell className="hidden text-right md:table-cell">
                                  <div className="flex justify-end">{renderConfirmedActions(turma)}</div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>

                    {renderPagination(confirmedPage, confirmedLastPage, setConfirmedPage)}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AssignGradeModal
          open={Boolean(selectedTurmaForGrade)}
          turma={selectedTurmaForGrade}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTurmaForGrade(null)
            }
          }}
          onSaved={async () => {
            setSelectedTurmaForGrade(null)
            await loadTurmasConfirmadas(confirmedPage)
          }}
          onCorrigirProva={handleCorrigirProvaAluno}
        />
      </div>
    </div>
  )
}
