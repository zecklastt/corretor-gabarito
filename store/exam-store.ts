import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { ExamTemplate, Submission, Class } from "@/lib/types"

interface ExamStore {
  exams: ExamTemplate[]
  classes: Class[]
  submissions: Submission[]
  activeExamId: string | null
  activeClassId: string | null
  setExams: (exams: ExamTemplate[]) => void
  addExam: (exam: ExamTemplate) => void
  deleteExam: (id: string) => void
  setActiveExam: (id: string | null) => void
  addClass: (classData: Class) => void
  deleteClass: (id: string) => void
  setActiveClass: (id: string | null) => void
  getClass: (id: string) => Class | undefined
  addSubmission: (submission: Submission) => void
  getExamSubmissions: (examId: string) => Submission[]
  getClassSubmissions: (classId: string) => Submission[]
  getActiveExam: () => ExamTemplate | undefined
  getActiveClass: () => Class | undefined
}

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      exams: [],
      classes: [],
      submissions: [],
      activeExamId: null,
      activeClassId: null,
      setExams: (exams) =>
        set((state) => ({
          exams,
          activeExamId: exams.some((exam) => exam.id === state.activeExamId) ? state.activeExamId : null,
        })),
      addExam: (exam) => set((state) => ({ exams: [...state.exams, exam] })),
      deleteExam: (id) =>
        set((state) => ({
          exams: state.exams.filter((e) => e.id !== id),
          submissions: state.submissions.filter((s) => s.examId !== id),
        })),
      setActiveExam: (id) => set({ activeExamId: id }),
      addClass: (classData) => set((state) => ({ classes: [...state.classes, classData] })),
      deleteClass: (id) =>
        set((state) => ({
          classes: state.classes.filter((c) => c.id !== id),
          submissions: state.submissions.filter((s) => s.classId !== id),
        })),
      setActiveClass: (id) => set({ activeClassId: id }),
      getClass: (id) => get().classes.find((c) => c.id === id),
      addSubmission: (submission) => set((state) => ({ submissions: [...state.submissions, submission] })),
      getExamSubmissions: (examId) => get().submissions.filter((s) => s.examId === examId),
      getClassSubmissions: (classId) => get().submissions.filter((s) => s.classId === classId),
      getActiveExam: () => get().exams.find((e) => e.id === get().activeExamId),
      getActiveClass: () => get().classes.find((c) => c.id === get().activeClassId),
    }),
    {
      name: "lensscore-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
