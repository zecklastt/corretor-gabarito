"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, isAuthenticated, isCameraRestricted } from "@/lib/auth"
import { Dashboard } from "@/components/dashboard/dashboard"
import { CreateExamForm } from "@/components/exam/create-exam-form"
import { CreateClassForm } from "@/components/class/create-class-form"
import { AnswerSheet } from "@/components/exam/answer-sheet"
import { FullExamPrint } from "@/components/exam/full-exam-print"
import { CameraScanner } from "@/components/scanner/camera-scanner"
import { ScanReviewModal } from "@/components/scanner/scan-review-modal"
import { ExamResults } from "@/components/reports/exam-results"
import { buildAppApiUrl, USE_MOCK_DATA } from "@/lib/api-config"
import { getMockExams } from "@/lib/mock-data"
import { useExamStore } from "@/store/exam-store"
import type { ExamTemplate, Option } from "@/lib/types"
import { clearPendingGradeContext, readPendingGradeContext, type PendingGradeContext } from "@/lib/turmas"

function matchesExamTurmaType(exam: ExamTemplate, turmaType: number): boolean {
  const possibleExamType = exam.id_tipo_curso ?? (exam.course ? Number(exam.course) : undefined)

  return possibleExamType === turmaType
}

function CameraPageContent() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [pendingGradeContext, setPendingGradeContext] = useState<PendingGradeContext | null>(null)
  const [currentView, setCurrentView] = useState<
    "dashboard" | "scanner" | "createExam" | "createClass" | "printSheet" | "printExam" | "reports"
  >("dashboard")

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login")
      return
    }

    if (isCameraRestricted(getSession())) {
      router.replace("/turmas")
      return
    }

    setAuthChecked(true)
  }, [router])

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const { exams, getClass, setActiveExam, setExams } = useExamStore()

  useEffect(() => {
    if (!authChecked) {
      return
    }

    setPendingGradeContext(readPendingGradeContext())

    return () => {
      clearPendingGradeContext()
    }
  }, [authChecked])

  const loadExams = useCallback(async () => {
    if (USE_MOCK_DATA) {
      const session = getSession()

      if (!session) {
        setExams([])
        return
      }

      setExams(getMockExams(session.id))
      return
    }

    try {
      const response = await fetch(buildAppApiUrl("/api/listar-provas"))
      if (!response.ok) return
      const result = await response.json()

      const rawList = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []

      const normalizedExams: ExamTemplate[] = rawList
        .map((item: any, index: number) => {
          const answerKey = (item?.answerKey ?? {}) as Record<string, Option>
          const normalizedAnswerKey: Record<number, Option> = {}

          Object.entries(answerKey).forEach(([key, value]) => {
            const question = Number(key)
            if (Number.isFinite(question) && ["A", "B", "C", "D"].includes(String(value))) {
              normalizedAnswerKey[question] = value as Option
            }
          })

          const fallbackType = item?.tipo_prova ? Number(item.tipo_prova) : 1
          const type = Number.isFinite(fallbackType) ? fallbackType : 1
          const totalQuestions = Number(item?.totalQuestions ?? Object.keys(normalizedAnswerKey).length)

          return {
            id: String(item?.id ?? `exam-${index}`),
            title: String(item?.title ?? `Prova ${type}`),
            createdAt: Number(item?.createdAt ?? Date.now()),
            type,
            course: item?.course ? String(item.course) : undefined,
            id_tipo_curso: item?.id_tipo_curso ? Number(item.id_tipo_curso) : undefined,
            tipo_prova: item?.tipo_prova ? String(item.tipo_prova) : String(type),
            totalQuestions: Number.isFinite(totalQuestions) && totalQuestions > 0 ? totalQuestions : 1,
            answerKey: normalizedAnswerKey,
            config: {
              tolerance: Number(item?.config?.tolerance ?? 0.6),
              pointsPerQuestion: Number(item?.config?.pointsPerQuestion ?? 1),
            },
          } satisfies ExamTemplate
        })
        .filter((exam: ExamTemplate) => !!exam.id)

      if (normalizedExams.length > 0) {
        setExams(normalizedExams)
      } else {
        setExams([])
      }
    } catch (error) {
      console.error("Erro ao carregar provas do servidor:", error)
    }
  }, [setExams])

  useEffect(() => {
    loadExams()
  }, [loadExams])

  useEffect(() => {
    if (!pendingGradeContext || exams.length === 0) {
      return
    }

    const firstMatchingExam = exams.find((exam) => matchesExamTurmaType(exam, pendingGradeContext.turmaType))
    setActiveExam(firstMatchingExam?.id ?? null)
  }, [exams, pendingGradeContext, setActiveExam])

  const handleCreateExamSuccess = () => {
    loadExams()
    setCurrentView("dashboard")
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId)
  const selectedClass = selectedClassId ? getClass(selectedClassId) : undefined

  const handleOpenScanner = () => {
    setCurrentView("scanner")
  }

  const handleCreateExam = () => {
    setCurrentView("createExam")
  }

  const handleCreateClass = () => {
    setCurrentView("createClass")
  }

  const handleViewExam = (examId: string) => {
    setSelectedExamId(examId)
  }

  const handlePrintAnswerSheet = (examId: string, classId?: string) => {
    setSelectedExamId(examId)
    setSelectedClassId(classId || null)
    setCurrentView("printSheet")
  }

  const handlePrintFullExam = (examId: string) => {
    setSelectedExamId(examId)
    setCurrentView("printExam")
  }

  const handleViewReports = (examId: string, classId?: string) => {
    setSelectedExamId(examId)
    setSelectedClassId(classId || null)
    setCurrentView("reports")
  }

  const handleScanComplete = () => {
    setShowReviewModal(true)
  }

  const handleReviewSave = () => {
    setShowReviewModal(false)
    clearPendingGradeContext()
    router.replace("/turmas")
  }

  const handleReviewClose = () => {
    setShowReviewModal(false)
  }

  if (!authChecked) {
    return null
  }

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard
          onOpenScanner={handleOpenScanner}
          onCreateExam={handleCreateExam}
          onCreateClass={handleCreateClass}
          onViewExam={handleViewExam}
          onPrintAnswerSheet={handlePrintAnswerSheet}
          onPrintFullExam={handlePrintFullExam}
          onViewReports={handleViewReports}
          pendingGradeContext={pendingGradeContext}
        />
      )}
      {currentView === "scanner" && (
        <CameraScanner
          onClose={() => setCurrentView("dashboard")}
          onScanComplete={handleScanComplete}
          pendingGradeContext={pendingGradeContext}
        />
      )}
      {currentView === "createExam" && (
        <CreateExamForm onBack={() => setCurrentView("dashboard")} onSuccess={handleCreateExamSuccess} />
      )}
      {currentView === "createClass" && (
        <CreateClassForm onBack={() => setCurrentView("dashboard")} onSuccess={() => setCurrentView("dashboard")} />
      )}
      {currentView === "printSheet" && selectedExam && (
        <AnswerSheet exam={selectedExam} classData={selectedClass} onBack={() => setCurrentView("dashboard")} />
      )}
      {currentView === "printExam" && selectedExam && (
        <FullExamPrint exam={selectedExam} onBack={() => setCurrentView("dashboard")} />
      )}
      {currentView === "reports" && selectedExamId && (
        <ExamResults
          examId={selectedExamId}
          classId={selectedClassId || undefined}
          onBack={() => setCurrentView("dashboard")}
        />
      )}

      <ScanReviewModal
        open={showReviewModal}
        onClose={handleReviewClose}
        onSave={handleReviewSave}
        pendingGradeContext={pendingGradeContext}
      />
    </>
  )
}

export default function CameraPage() {
  return (
    <Suspense fallback={null}>
      <CameraPageContent />
    </Suspense>
  )
}