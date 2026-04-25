import type { UserSession } from "./auth"
import type { ExamTemplate, Option } from "./types"
import type {
  CandidaturaTipo,
  InstrutorInfo,
  Turma,
  TurmaAluno,
  TurmaAlunosParaNotas,
  TurmaAlunoResultadoPayload,
  TurmasResponse,
} from "./turmas"

interface MockUserRecord {
  label: string
  identifiers: string[]
  password: string
  session: UserSession
  instrutorInfo: InstrutorInfo
}

interface MockTurmaAssignment {
  instrutorUserId?: number
  traineeUserId?: number
}

interface MockLoginHint {
  label: string
  identifier: string
  password: string
}

type MockExamDraft = Omit<ExamTemplate, "id" | "createdAt"> & {
  id?: string
  createdAt?: number
}

const mockUsers: MockUserRecord[] = [
  {
    label: "Instrutora principal",
    identifiers: ["ana.ribeiro", "ana.ribeiro@lensscore.test"],
    password: "teste123",
    session: {
      foto_perfil: null,
      id: 101,
      nome: "Ana Ribeiro",
      email: "ana.ribeiro@lensscore.test",
      cards: null,
      unidades: [{ id: 1, nome: "LensScore Lab" }],
      expira_senha: null,
      B2BouInstrutor: null,
    },
    instrutorInfo: {
      id: 1001,
      nome: "Ana Ribeiro",
      cursos_trainee: JSON.stringify([102, 104, 106, 108]),
      cursos: JSON.stringify([101, 103, 105, 107]),
      id_usuario: 101,
    },
  },
  {
    label: "Usuário com camera restrita",
    identifiers: ["carlos.menezes", "carlos.menezes@lensscore.test"],
    password: "teste123",
    session: {
      foto_perfil: null,
      id: 202,
      nome: "Carlos Menezes",
      email: "carlos.menezes@lensscore.test",
      cards: null,
      unidades: [{ id: 2, nome: "LensScore Remote" }],
      expira_senha: null,
      B2BouInstrutor: 104,
    },
    instrutorInfo: {
      id: 1002,
      nome: "Carlos Menezes",
      cursos_trainee: JSON.stringify([101, 102]),
      cursos: JSON.stringify([103, 104]),
      id_usuario: 202,
    },
  },
]

const mockTurmasCatalog: Turma[] = [
  {
    id: 7301,
    titulo: "Fundamentos de Atendimento | Maio/2026",
    data_inicial: "2026-05-12",
    data_final: "2026-05-14",
    trainee: 0,
    instrutor: 0,
    id_curso: 101,
    id_tipo_curso: 101,
    tipo: 101,
    tipo_curso: { id: 101 },
    curso_nome: "Fundamentos de Atendimento",
  },
  {
    id: 7302,
    titulo: "Suporte Basico | Junho/2026",
    data_inicial: "2026-06-03",
    data_final: "2026-06-05",
    trainee: 0,
    instrutor: 0,
    id_curso: 102,
    id_tipo_curso: 102,
    tipo: 102,
    tipo_curso: { id: 102 },
    curso_nome: "Suporte Basico",
  },
  {
    id: 8401,
    titulo: "Suporte Avancado | Abril/2026",
    data_inicial: "2026-04-08",
    data_final: "2026-04-10",
    trainee: 0,
    instrutor: 0,
    id_curso: 103,
    id_tipo_curso: 103,
    tipo: 103,
    tipo_curso: { id: 103 },
    curso_nome: "Suporte Avancado",
  },
  {
    id: 8402,
    titulo: "Atendimento em Pediatria | Abril/2026",
    data_inicial: "2026-04-18",
    data_final: "2026-04-20",
    trainee: 101,
    instrutor: 0,
    id_curso: 105,
    id_tipo_curso: 105,
    tipo: 105,
    tipo_curso: { id: 105 },
    curso_nome: "Atendimento em Pediatria",
  },
  {
    id: 9101,
    titulo: "Avaliacao Clinica | Junho/2026",
    data_inicial: "2026-06-22",
    data_final: "2026-06-23",
    trainee: 0,
    instrutor: 202,
    id_curso: 104,
    id_tipo_curso: 104,
    tipo: 104,
    tipo_curso: { id: 104 },
    curso_nome: "Avaliacao Clinica",
  },
]

const mockTurmaAssignments: Record<number, MockTurmaAssignment> = {
  7301: {},
  7302: {},
  8401: { instrutorUserId: 101 },
  8402: { traineeUserId: 101 },
  9101: { instrutorUserId: 202 },
}

const mockStudentsByTurmaId: Record<number, TurmaAluno[]> = {
  8401: [
    {
      id: "8401-1",
      id_aluno: "MAT-2001",
      id_inscricao: "INS-8401-001",
      id_matricula: "MAT-2001",
      nome: "Beatriz Nascimento",
      email: "beatriz.nascimento@lensscore.test",
      nota: "8.5",
      status: "aprovado",
    },
    {
      id: "8401-2",
      id_aluno: "MAT-2002",
      id_inscricao: "INS-8401-002",
      id_matricula: "MAT-2002",
      nome: "Diego Fernandes",
      email: "diego.fernandes@lensscore.test",
      nota: "6.0",
      status: "remediar",
    },
    {
      id: "8401-3",
      id_aluno: "MAT-2003",
      id_inscricao: "INS-8401-003",
      id_matricula: "MAT-2003",
      nome: "Larissa Costa",
      email: "larissa.costa@lensscore.test",
      nota: "",
      status: "sem resultado",
    },
  ],
  8402: [
    {
      id: "8402-1",
      id_aluno: "MAT-3101",
      id_inscricao: "INS-8402-001",
      id_matricula: "MAT-3101",
      nome: "Gabriel Souza",
      email: "gabriel.souza@lensscore.test",
      nota: "9.0",
      status: "aprovado",
    },
    {
      id: "8402-2",
      id_aluno: "MAT-3102",
      id_inscricao: "INS-8402-002",
      id_matricula: "MAT-3102",
      nome: "Marina Lopes",
      email: "marina.lopes@lensscore.test",
      nota: "7.0",
      status: "aprovado",
    },
    {
      id: "8402-3",
      id_aluno: "MAT-3103",
      id_inscricao: "INS-8402-003",
      id_matricula: "MAT-3103",
      nome: "Rafael Gomes",
      email: "rafael.gomes@lensscore.test",
      nota: "5.5",
      status: "reprovado",
    },
  ],
  9101: [
    {
      id: "9101-1",
      id_aluno: "MAT-4101",
      id_inscricao: "INS-9101-001",
      id_matricula: "MAT-4101",
      nome: "Paula Martins",
      email: "paula.martins@lensscore.test",
      nota: "",
      status: "sem resultado",
    },
    {
      id: "9101-2",
      id_aluno: "MAT-4102",
      id_inscricao: "INS-9101-002",
      id_matricula: "MAT-4102",
      nome: "Thiago Araujo",
      email: "thiago.araujo@lensscore.test",
      nota: "",
      status: "sem resultado",
    },
  ],
}

const MOCK_EXAMS_STORAGE_PREFIX = "lensscore.mock-exams"

const mockExamCatalog: ExamTemplate[] = [
  {
    id: "mock-exam-103-01",
    title: "Suporte Avancado - Prova 01",
    createdAt: Date.parse("2026-04-01T09:00:00Z"),
    type: 1,
    course: "Suporte Avancado",
    id_tipo_curso: 103,
    tipo_prova: "1",
    totalQuestions: 10,
    answerKey: {
      1: "A",
      2: "C",
      3: "B",
      4: "D",
      5: "A",
      6: "B",
      7: "D",
      8: "C",
      9: "A",
      10: "B",
    },
    config: {
      tolerance: 0.6,
      pointsPerQuestion: 1,
    },
  },
  {
    id: "mock-exam-105-01",
    title: "Atendimento em Pediatria - Prova 01",
    createdAt: Date.parse("2026-04-11T09:00:00Z"),
    type: 1,
    course: "Atendimento em Pediatria",
    id_tipo_curso: 105,
    tipo_prova: "1",
    totalQuestions: 10,
    answerKey: {
      1: "B",
      2: "A",
      3: "D",
      4: "C",
      5: "B",
      6: "A",
      7: "C",
      8: "D",
      9: "B",
      10: "A",
    },
    config: {
      tolerance: 0.6,
      pointsPerQuestion: 1,
    },
  },
  {
    id: "mock-exam-104-01",
    title: "Avaliacao Clinica - Prova 01",
    createdAt: Date.parse("2026-04-21T09:00:00Z"),
    type: 1,
    course: "Avaliacao Clinica",
    id_tipo_curso: 104,
    tipo_prova: "1",
    totalQuestions: 10,
    answerKey: {
      1: "D",
      2: "B",
      3: "A",
      4: "C",
      5: "D",
      6: "A",
      7: "B",
      8: "C",
      9: "D",
      10: "A",
    },
    config: {
      tolerance: 0.6,
      pointsPerQuestion: 1,
    },
  },
]

export const MOCK_LOGIN_HINTS: MockLoginHint[] = mockUsers.map((user) => ({
  label: user.label,
  identifier: user.identifiers[1] ?? user.identifiers[0],
  password: user.password,
}))

function cloneMockValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getMockUserById(userId: number) {
  return mockUsers.find((user) => user.session.id === userId) ?? null
}

function getMockTurmaById(turmaId: number) {
  return mockTurmasCatalog.find((turma) => turma.id === turmaId) ?? null
}

function getMockExamStorageKey(userId: number) {
  return `${MOCK_EXAMS_STORAGE_PREFIX}.${userId}`
}

function getDefaultMockExams() {
  return cloneMockValue(mockExamCatalog)
}

function persistMockExams(userId: number, exams: ExamTemplate[]) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(getMockExamStorageKey(userId), JSON.stringify(exams))
}

function normalizeStoredMockExam(exam: unknown, index: number): ExamTemplate | null {
  if (!exam || typeof exam !== "object") {
    return null
  }

  const record = exam as Record<string, unknown>
  const rawAnswerKey = record.answerKey && typeof record.answerKey === "object" ? (record.answerKey as Record<string, unknown>) : {}
  const answerKey: Record<number, Option> = {}

  Object.entries(rawAnswerKey).forEach(([key, value]) => {
    const questionNumber = Number(key)
    if (Number.isFinite(questionNumber) && (value === "A" || value === "B" || value === "C" || value === "D")) {
      answerKey[questionNumber] = value
    }
  })

  const totalQuestions = Number(record.totalQuestions)
  const createdAt = Number(record.createdAt)
  const type = Number(record.type ?? record.tipo_prova ?? 1)
  const title = String(record.title ?? "").trim()
  const id = String(record.id ?? `mock-exam-restored-${index}`)
  const idTipoCurso = Number(record.id_tipo_curso)

  if (!title || !Number.isFinite(totalQuestions) || totalQuestions <= 0 || Object.keys(answerKey).length === 0) {
    return null
  }

  return {
    id,
    title,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    type: Number.isFinite(type) ? type : 1,
    course: typeof record.course === "string" ? record.course : undefined,
    id_tipo_curso: Number.isFinite(idTipoCurso) ? idTipoCurso : undefined,
    tipo_prova: typeof record.tipo_prova === "string" ? record.tipo_prova : String(Number.isFinite(type) ? type : 1),
    totalQuestions,
    answerKey,
    config: {
      tolerance: Number((record.config as Record<string, unknown> | undefined)?.tolerance ?? 0.6),
      pointsPerQuestion: Number((record.config as Record<string, unknown> | undefined)?.pointsPerQuestion ?? 1),
    },
  }
}

function isAssignedToUser(userId: number, turmaId: number): boolean {
  const assignment = mockTurmaAssignments[turmaId]

  return assignment?.instrutorUserId === userId || assignment?.traineeUserId === userId
}

function withMockTurmaStats(turma: Turma): Turma {
  const students = mockStudentsByTurmaId[turma.id] ?? []
  const assignment = mockTurmaAssignments[turma.id] ?? {}

  return {
    ...turma,
    trainee: assignment.traineeUserId ?? 0,
    instrutor: assignment.instrutorUserId ?? 0,
    vagas_ocupadas: students.length,
    inscricoes_com_nota: students.filter((student) => student.nota?.trim()).length,
  }
}

export function getMockLoginResult(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase()
  const user = mockUsers.find(
    (candidate) =>
      candidate.password === password &&
      candidate.identifiers.some((candidateIdentifier) => candidateIdentifier.toLowerCase() === normalizedIdentifier),
  )

  if (!user) {
    return null
  }

  return {
    token: `mock-token-${user.session.id}`,
    userSession: cloneMockValue(user.session),
  }
}

export function getMockInstrutorInfo(userId: number): InstrutorInfo | null {
  const user = getMockUserById(userId)

  return user ? cloneMockValue(user.instrutorInfo) : null
}

export function getMockTurmas(userId: number, page = 1, options: { instrutor?: boolean } = {}): TurmasResponse {
  const filteredTurmas = mockTurmasCatalog
    .filter((turma) => (options.instrutor ? isAssignedToUser(userId, turma.id) : !isAssignedToUser(userId, turma.id)))
    .map((turma) => withMockTurmaStats(turma))
    .sort((left, right) => right.data_inicial.localeCompare(left.data_inicial))

  const pageSize = 20
  const start = (page - 1) * pageSize
  const paginatedTurmas = filteredTurmas.slice(start, start + pageSize)
  const totalPages = Math.max(1, Math.ceil(filteredTurmas.length / pageSize))

  return {
    current_page: page,
    data: cloneMockValue(paginatedTurmas),
    last_page: totalPages,
    total: filteredTurmas.length,
  }
}

export function getMockTurmaAlunos(turmaId: number): TurmaAlunosParaNotas {
  const turma = getMockTurmaById(turmaId)

  return {
    turmaType: turma ? Number(turma.id_tipo_curso ?? turma.tipo ?? turma.tipo_curso?.id ?? turma.id_curso ?? null) : null,
    students: cloneMockValue(mockStudentsByTurmaId[turmaId] ?? []),
  }
}

export function getMockExams(userId: number): ExamTemplate[] {
  if (typeof window === "undefined") {
    return getDefaultMockExams()
  }

  const storageKey = getMockExamStorageKey(userId)
  const rawExams = localStorage.getItem(storageKey)

  if (!rawExams) {
    const seededExams = getDefaultMockExams()
    persistMockExams(userId, seededExams)
    return seededExams
  }

  try {
    const parsedExams = JSON.parse(rawExams)

    if (!Array.isArray(parsedExams)) {
      throw new Error("Invalid exam list")
    }

    const normalizedExams = parsedExams
      .map((exam, index) => normalizeStoredMockExam(exam, index))
      .filter((exam): exam is ExamTemplate => Boolean(exam))

    return cloneMockValue(normalizedExams)
  } catch {
    const fallbackExams = getDefaultMockExams()
    persistMockExams(userId, fallbackExams)
    return fallbackExams
  }
}

export function createMockExam(userId: number, examDraft: MockExamDraft): ExamTemplate {
  const currentExams = getMockExams(userId)
  const resolvedType = Number(examDraft.type ?? examDraft.tipo_prova ?? 1)
  const createdExam: ExamTemplate = {
    ...examDraft,
    id: examDraft.id ?? `mock-exam-${userId}-${Date.now()}`,
    createdAt: examDraft.createdAt ?? Date.now(),
    type: Number.isFinite(resolvedType) ? resolvedType : 1,
    tipo_prova: examDraft.tipo_prova ?? String(Number.isFinite(resolvedType) ? resolvedType : 1),
    course: examDraft.course ?? undefined,
  }

  persistMockExams(userId, [...currentExams, createdExam])

  return cloneMockValue(createdExam)
}

export function deleteMockExam(userId: number, examId: string) {
  const remainingExams = getMockExams(userId).filter((exam) => exam.id !== examId)
  persistMockExams(userId, remainingExams)
}

export function applyMockCandidatura(userId: number, turmaId: number, tipo: CandidaturaTipo): string {
  const assignment = mockTurmaAssignments[turmaId] ?? (mockTurmaAssignments[turmaId] = {})
  const assignmentKey = tipo === "instrutor" ? "instrutorUserId" : "traineeUserId"
  const currentAssignment = assignment[assignmentKey]

  if (currentAssignment === userId) {
    return "Candidatura já registrada no ambiente de teste."
  }

  if (currentAssignment !== undefined) {
    throw new Error("A vaga de teste já foi ocupada por outro usuário.")
  }

  assignment[assignmentKey] = userId

  return "Candidatura enviada com sucesso no ambiente de teste."
}

export function saveMockResultados(turmaId: number, inscricoes: TurmaAlunoResultadoPayload[]): string {
  const students = mockStudentsByTurmaId[turmaId]

  if (!students) {
    throw new Error("Turma de teste sem alunos vinculados.")
  }

  const updatesByEnrollmentId = new Map(inscricoes.map((inscricao) => [String(inscricao.id_inscricao), inscricao]))

  mockStudentsByTurmaId[turmaId] = students.map((student) => {
    const update = updatesByEnrollmentId.get(student.id_inscricao)

    if (!update) {
      return student
    }

    return {
      ...student,
      nota: update.nota ?? "",
      status: update.aprovado,
    }
  })

  return "Lançamento feito no ambiente de teste."
}