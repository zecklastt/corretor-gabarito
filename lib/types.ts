export type Option = "A" | "B" | "C" | "D"

export interface QuestionDetail {
  questao: number
  resposta_lida: string
  resposta_correta: string
  acertou: boolean
}

export interface Class {
  id: string
  name: string
  city: string
  instructor: string
  date: string
  createdAt: number
}

export interface ExamTemplate {
  id: string
  title: string
  createdAt: number
  type?: number
  course?: string
  id_tipo_curso?: number
  tipo_prova?: string
  totalQuestions: number
  answerKey: Record<number, Option>
  questions?: Record<number, string>
  config: {
    tolerance: number
    pointsPerQuestion: number
  }
}

export interface Submission {
  id: string
  examId: string
  classId?: string
  studentName?: string
  studentId?: string
  studentEnrollmentId?: string
  city?: string
  instructor?: string
  date?: string
  answers: Record<number, Option | null>
  score: number
  scannedAt: number
  imagePreview?: string
  status: "success" | "warning" | "error"
}

export interface ScanResult {
  answers: Record<number, Option | null>
  score: number
  warnings: string[]
  details: QuestionDetail[]
  studentName?: string
  studentId?: string
  studentEnrollmentId?: string
  city?: string
  instructor?: string
  date?: string
  matricula?: string
  aluno?: {
    nome_aluno?: string
    cidade_aluno?: string
    nome_instrutor?: string | null
  }
}
