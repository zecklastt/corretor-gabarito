import { getSession, getToken } from "./auth"
import { buildAppApiUrl, USE_MOCK_DATA } from "./api-config"
import {
  applyMockCandidatura,
  getMockInstrutorInfo,
  getMockTurmaAlunos,
  getMockTurmas,
  saveMockResultados,
} from "./mock-data"

async function parseJsonBody<T>(res: Response): Promise<T | null> {
  const rawBody = await res.text()

  if (!rawBody.trim()) {
    return null
  }

  try {
    return JSON.parse(rawBody) as T
  } catch {
    return null
  }
}

function getResponseMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const message = (payload as Record<string, unknown>).msg
    if (typeof message === "string" && message.trim()) {
      return message
    }

    const altMessage = (payload as Record<string, unknown>).message
    if (typeof altMessage === "string" && altMessage.trim()) {
      return altMessage
    }
  }

  return fallback
}

export interface Turma {
  id: number
  titulo?: string
  nome?: string
  data_inicial: string
  data_final: string
  trainee: unknown
  instrutor: unknown
  inscricoes_com_nota?: number | string | null
  vagas_ocupadas?: number | string | null
  id_curso?: number
  id_tipo_curso?: number | string
  tipo?: number | string
  tipo_curso?: {
    id?: number | string | null
  } | null
  curso_nome?: string
  [key: string]: unknown
}

export interface TurmasResponse {
  current_page: number
  data: Turma[]
  last_page: number
  total: number
}

export interface InstrutorInfo {
  id: number
  nome: string
  cursos_trainee: string | null
  cursos: string | null
  id_usuario: number
}

export type CandidaturaTipo = "instrutor" | "trainee"

export type NotaStatus = "aprovado" | "reprovado" | "remediar" | "faltou" | "sem resultado"

export interface NotaStatusOption {
  id: NotaStatus
  nome: string
}

export interface TurmaAluno {
  id_inscricao: string
  id_matricula: string
  nome: string
  email: string
  nota?: string
  status?: NotaStatus
  [key: string]: unknown
}

export interface TurmaAlunosParaNotas {
  turmaType: number | null
  students: TurmaAluno[]
}

export interface TurmaAlunoResultadoPayload {
  adicionar_instrutor: boolean
  aprovado: NotaStatus
  aprovado_adicional: string
  arquivos_certificados: string | null
  carteirinha: string
  carteirinha_enviada: string
  carteirinha_fisica: number
  certificado: string
  certificado_aprovacao: string
  declaracao: string | null
  declaracao_aprovada: string | null
  declaracao_comparecimento: string
  declaracao_situacao: string
  documentacao_obrigatoria: string | null
  documento_certificado: string | null
  id_inscricao: string
  id: string | number | null
  id_aluno: string | number | null
  id_carteirinha: string | number | null
  id_carteirinha_adicional: string | number | null
  nome: string
  email: string
  nota: string | null
  nota_adicional: string | null
  pre_test: string | null
  status_documento_certificado: string
  status_documento_certificado_label: string
  status_pre_teste: string
  status_pre_teste_label: string
  [key: string]: unknown
}

export interface PendingGradeContext {
  studentName: string
  studentMatricula: string
  studentEnrollmentId: string
  turmaType: number
  turmaId?: number
  turmaName?: string
  status?: NotaStatus
  grade?: string
}

const PENDING_GRADE_STORAGE_KEY = "lensscore.pending-grade-context"

export const NOTA_STATUS_OPTIONS: NotaStatusOption[] = [
  { id: "aprovado", nome: "Aprovado" },
  { id: "reprovado", nome: "Reprovado" },
  { id: "remediar", nome: "Remediar" },
  { id: "faltou", nome: "Faltou" },
  { id: "sem resultado", nome: "Sem resultado" },
]

interface FetchTurmasOptions {
  instrutor?: boolean
}

function normalizeNotaStatus(value: unknown): NotaStatus {
  const normalizedValue = String(value ?? "sem resultado").trim().toLowerCase() as NotaStatus

  return NOTA_STATUS_OPTIONS.some((option) => option.id === normalizedValue) ? normalizedValue : "sem resultado"
}

function normalizeTurmaAluno(item: unknown): TurmaAluno {
  const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
  const nestedAluno =
    record.aluno && typeof record.aluno === "object" ? (record.aluno as Record<string, unknown>) : {}

  const nome =
    String(
      record.nome ?? record.nome_aluno ?? nestedAluno.nome_aluno ?? nestedAluno.nome ?? "Aluno sem nome",
    ).trim() || "Aluno sem nome"

  const email = String(record.email ?? record.email_aluno ?? nestedAluno.email ?? nestedAluno.email_aluno ?? "").trim()
  const idInscricao = String(record.id_inscricao ?? record.inscricao_id ?? record.id ?? "").trim()
  const idMatricula = String(
    record.id_matricula ??
      record.matricula ??
      record.id_aluno ??
      nestedAluno.id_matricula ??
      nestedAluno.matricula ??
      nestedAluno.id_aluno ??
      "",
  ).trim()
  const nota = String(record.nota ?? record.nota_adicional ?? record.media ?? "").trim()

  return {
    ...record,
    id_inscricao: idInscricao,
    id_matricula: idMatricula,
    nome,
    email,
    nota,
    status: normalizeNotaStatus(record.aprovado ?? record.status ?? record.resultado ?? record.situacao),
  }
}

function normalizeNullableText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalizedValue = String(value).trim()

  return normalizedValue ? normalizedValue : null
}

function normalizeText(value: unknown, fallback: string): string {
  if (value === null || value === undefined) {
    return fallback
  }

  const normalizedValue = String(value).trim()

  return normalizedValue || fallback
}

function normalizeNumber(value: unknown, fallback: number): number {
  const normalizedValue = Number(value)

  return Number.isNaN(normalizedValue) ? fallback : normalizedValue
}

function normalizeIdentifier(value: unknown, fallback: string | number | null): string | number | null {
  if (typeof value === "string" || typeof value === "number") {
    return value
  }

  return fallback
}

function extractTurmaType(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const record = payload as Record<string, unknown>
  const tipoCurso =
    record.tipo_curso && typeof record.tipo_curso === "object"
      ? (record.tipo_curso as Record<string, unknown>).id
      : record.id_tipo_curso ?? record.tipo

  if (tipoCurso === null || tipoCurso === undefined) {
    return null
  }

  const normalizedTipoCurso = Number(tipoCurso)

  return Number.isNaN(normalizedTipoCurso) ? null : normalizedTipoCurso
}

function extractTurmaAlunos(payload: unknown, confirmedOnly = false): TurmaAluno[] {
  if (Array.isArray(payload)) {
    return payload
      .filter((item) => {
        if (!confirmedOnly || !item || typeof item !== "object") {
          return true
        }

        const statusInscricao = (item as Record<string, unknown>).status_inscricao
        return statusInscricao === "confirmada"
      })
      .map(normalizeTurmaAluno)
  }

  if (!payload || typeof payload !== "object") {
    return []
  }

  const record = payload as Record<string, unknown>
  const possibleLists = [record.alunos, record.inscricoes, record.data]

  for (const list of possibleLists) {
    if (Array.isArray(list)) {
      return extractTurmaAlunos(list, confirmedOnly)
    }
  }

  return []
}

export async function fetchTurmas(page = 1, options: FetchTurmasOptions = {}): Promise<TurmasResponse> {
  if (USE_MOCK_DATA) {
    const session = getSession()
    if (!session) throw new Error("Não autenticado.")

    return getMockTurmas(session.id, page, options)
  }

  const token = getToken()
  if (!token) throw new Error("Não autenticado.")

  const res = await fetch(buildAppApiUrl(`/api/v1/curso/turmas-instrutor?page=${page}`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sort: "data_inicial",
      direction: "desc",
      pageSize: 20,
      ...(options.instrutor ? { instrutor: true } : {}),
    }),
  })

  if (!res.ok) {
    throw new Error("Erro ao buscar turmas.")
  }

  const payload = await parseJsonBody<TurmasResponse>(res)

  if (!payload || !Array.isArray(payload.data)) {
    throw new Error("Resposta inválida ao buscar turmas.")
  }

  return payload
}

export async function fetchInstrutorInfo(): Promise<InstrutorInfo | null> {
  if (USE_MOCK_DATA) {
    const session = getSession()
    if (!session) throw new Error("Não autenticado.")

    return getMockInstrutorInfo(session.id)
  }

  const token = getToken()
  if (!token) throw new Error("Não autenticado.")

  const res = await fetch(buildAppApiUrl("/api/v1/instrutor/get-curso-instrutor-user"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error("Erro ao buscar informações do instrutor.")
  }

  return parseJsonBody<InstrutorInfo>(res)
}

export async function fetchTurmaAlunos(turmaId: number): Promise<TurmaAlunosParaNotas> {
  if (USE_MOCK_DATA) {
    const session = getSession()
    if (!session) throw new Error("Não autenticado.")

    return getMockTurmaAlunos(turmaId)
  }

  const token = getToken()
  if (!token) throw new Error("Não autenticado.")

  const cursoRes = await fetch(buildAppApiUrl(`/api/v1/curso/${turmaId}/alunos`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!cursoRes.ok) {
    throw new Error("Não foi possível carregar os dados da turma.")
  }

  const cursoPayload = await parseJsonBody<unknown>(cursoRes)

  const res = await fetch(buildAppApiUrl(`/api/v1/curso/${turmaId}/aprovar-estudantes`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    throw new Error("Não foi possível carregar os alunos confirmados da turma.")
  }

  const payload = await parseJsonBody<unknown>(res)

  return {
    turmaType: extractTurmaType(cursoPayload),
    students: extractTurmaAlunos(payload, true),
  }
}

export function buildResultadoPayload(student: TurmaAluno): TurmaAlunoResultadoPayload {
  const record = student as Record<string, unknown>

  return {
    ...record,
    adicionar_instrutor: Boolean(record.adicionar_instrutor ?? false),
    aprovado: student.status ?? "sem resultado",
    aprovado_adicional: normalizeText(record.aprovado_adicional, ""),
    arquivos_certificados: normalizeNullableText(record.arquivos_certificados),
    carteirinha: normalizeText(record.carteirinha, "Não"),
    carteirinha_enviada: normalizeText(record.carteirinha_enviada, "n"),
    carteirinha_fisica: normalizeNumber(record.carteirinha_fisica, 0),
    certificado: normalizeText(record.certificado, "Não"),
    certificado_aprovacao: normalizeText(record.certificado_aprovacao, "n"),
    declaracao: normalizeNullableText(record.declaracao),
    declaracao_aprovada: normalizeNullableText(record.declaracao_aprovada),
    declaracao_comparecimento: normalizeText(record.declaracao_comparecimento, "n"),
    declaracao_situacao: normalizeText(record.declaracao_situacao, "Não enviado"),
    documentacao_obrigatoria: normalizeNullableText(record.documentacao_obrigatoria),
    documento_certificado: normalizeNullableText(record.documento_certificado),
    email: student.email,
    id: normalizeIdentifier(record.id, student.id_inscricao || null),
    id_aluno: normalizeIdentifier(record.id_aluno, student.id_matricula || null),
    id_carteirinha: normalizeIdentifier(record.id_carteirinha, null),
    id_carteirinha_adicional: normalizeIdentifier(record.id_carteirinha_adicional, null),
    id_inscricao: student.id_inscricao,
    nome: student.nome,
    nota: normalizeNullableText(student.nota),
    nota_adicional: normalizeNullableText(record.nota_adicional),
    pre_test: normalizeNullableText(record.pre_test),
    status_documento_certificado: normalizeText(record.status_documento_certificado, "not_sent"),
    status_documento_certificado_label: normalizeText(record.status_documento_certificado_label, "Não Enviado"),
    status_pre_teste: normalizeText(record.status_pre_teste, "not_sent"),
    status_pre_teste_label: normalizeText(record.status_pre_teste_label, "Não Enviado"),
  }
}

export function getCursoPermissaoId(turma: Turma): number | null {
  const cursoId = turma.id_tipo_curso ?? turma.tipo ?? turma.tipo_curso?.id ?? turma.id_curso ?? null

  if (cursoId === null || cursoId === undefined) {
    return null
  }

  const normalizedCursoId = Number(cursoId)

  return Number.isNaN(normalizedCursoId) ? null : normalizedCursoId
}

export function parseCursoIds(cursos: string | null): number[] {
  if (!cursos?.trim()) return []

  try {
    const parsed = JSON.parse(cursos)
    if (Array.isArray(parsed)) return parsed.map(Number)
  } catch {
    // Fall back to extracting numeric ids from strings like "|8|9|" or "8,9".
  }

  const matches = cursos.match(/\d+/g)

  if (!matches) {
    return []
  }

  return matches.map(Number).filter((value) => !Number.isNaN(value))
}

export function podeCandidatarComo(
  turma: Turma,
  instrutorInfo: InstrutorInfo | null,
  tipo: CandidaturaTipo,
): boolean {
  const cursoId = getCursoPermissaoId(turma)

  if (cursoId === null) {
    return false
  }

  const cursosPermitidos = {
    instrutor: parseCursoIds(instrutorInfo?.cursos ?? null),
    trainee: parseCursoIds(instrutorInfo?.cursos_trainee ?? null),
  }

  return cursosPermitidos[tipo].includes(cursoId)
}

export function vagaDisponivel(vaga: unknown): boolean {
  if (vaga === null || vaga === undefined) {
    return true
  }

  if (typeof vaga === "boolean") {
    return !vaga
  }

  if (typeof vaga === "number") {
    return vaga === 0
  }

  if (typeof vaga === "string") {
    const normalizedVaga = vaga.trim().toLowerCase()

    return ["", "0", "false", "null", "undefined", "[]", "{}"].includes(normalizedVaga)
  }

  if (Array.isArray(vaga)) {
    return vaga.length === 0
  }

  return false
}

function parsePendingGradeContextPayload(payload: unknown): PendingGradeContext | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const record = payload as Record<string, unknown>
  const studentName = normalizeText(record.studentName, "")
  const studentMatricula = normalizeText(record.studentMatricula, "")
  const studentEnrollmentId = normalizeText(record.studentEnrollmentId, "")
  const turmaType = Number(record.turmaType)

  if (!studentName || !studentMatricula || !studentEnrollmentId || Number.isNaN(turmaType)) {
    return null
  }

  const turmaIdValue = record.turmaId
  const turmaId = turmaIdValue === undefined || turmaIdValue === null ? undefined : Number(turmaIdValue)
  const turmaName = normalizeText(record.turmaName, "")
  const grade = normalizeText(record.grade, "")
  const statusValue = normalizeText(record.status, "")

  return {
    studentName,
    studentMatricula,
    studentEnrollmentId,
    turmaType,
    turmaId: turmaId !== undefined && !Number.isNaN(turmaId) ? turmaId : undefined,
    turmaName: turmaName || undefined,
    status: statusValue ? normalizeNotaStatus(statusValue) : undefined,
    grade: grade || undefined,
  }
}

export function savePendingGradeContext(context: PendingGradeContext): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    sessionStorage.setItem(PENDING_GRADE_STORAGE_KEY, JSON.stringify(context))
    return true
  } catch {
    return false
  }
}

export function readPendingGradeContext(): PendingGradeContext | null {
  if (typeof window === "undefined") {
    return null
  }

  const rawContext = sessionStorage.getItem(PENDING_GRADE_STORAGE_KEY)

  if (!rawContext) {
    return null
  }

  try {
    return parsePendingGradeContextPayload(JSON.parse(rawContext))
  } catch {
    return null
  }
}

export function clearPendingGradeContext() {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.removeItem(PENDING_GRADE_STORAGE_KEY)
}

interface CandidaturaResponse {
  msg?: string
  message?: string
}

interface SaveResultadosResponse {
  msg?: string
  message?: string
}

export async function candidatarComo(turmaId: number, tipo: CandidaturaTipo): Promise<string> {
  if (USE_MOCK_DATA) {
    const session = getSession()
    if (!session) throw new Error("Não autenticado.")

    return applyMockCandidatura(session.id, turmaId, tipo)
  }

  const token = getToken()
  if (!token) throw new Error("Não autenticado.")

  const res = await fetch(buildAppApiUrl("/api/v1/instrutor/adiciona-turma-instrutor"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id_curso: turmaId,
      tipo_instrutor: tipo,
    }),
  })

  const payload = await parseJsonBody<CandidaturaResponse>(res)

  if (!res.ok) {
    throw new Error(getResponseMessage(payload, "Erro ao enviar candidatura."))
  }

  return getResponseMessage(payload, "Candidatura enviada com sucesso.")
}

export async function salvarResultadosTurma(
  turmaId: number,
  inscricoes: TurmaAlunoResultadoPayload[],
): Promise<string> {
  if (USE_MOCK_DATA) {
    const session = getSession()
    if (!session) throw new Error("Não autenticado.")

    return saveMockResultados(turmaId, inscricoes)
  }

  const token = getToken()
  if (!token) throw new Error("Não autenticado.")

  const res = await fetch(buildAppApiUrl("/api/v1/inscricao/alterar-certificados"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inscricoes,
      id_curso: turmaId,
    }),
  })

  const payload = await parseJsonBody<SaveResultadosResponse>(res)

  if (!res.ok) {
    throw new Error(getResponseMessage(payload, "Não foi possível salvar os lançamentos."))
  }

  return getResponseMessage(payload, "Lançamento feito.")
}
