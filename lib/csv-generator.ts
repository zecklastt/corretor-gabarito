import type { ExamTemplate, Submission, Class } from "./types"

export function generateCSV(submissions: Submission[], exam: ExamTemplate, classData?: Class): string {
  const headers = ["student_id", "student_name", "class_name", "city", "instructor", "date", "exam_title", "score"]

  for (let q = 1; q <= exam.totalQuestions; q++) {
    headers.push(`q${q}`)
  }
  headers.push("timestamp")

  const rows = submissions.map((sub) => {
    const row: (string | number)[] = [
      sub.studentId || "",
      sub.studentName || "Não informado",
      classData?.name || sub.classId || "",
      sub.city || classData?.city || "",
      sub.instructor || classData?.instructor || "",
      sub.date || classData?.date || "",
      exam.title,
      sub.score,
    ]

    for (let q = 1; q <= exam.totalQuestions; q++) {
      row.push(sub.answers[q] || "BRANCO")
    }

    row.push(new Date(sub.scannedAt).toLocaleString("pt-BR"))

    return row
  })

  const csvLines = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))]

  return csvLines.join("\n")
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
