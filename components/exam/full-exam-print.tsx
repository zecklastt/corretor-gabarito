"use client"

import { Button } from "@/components/ui/button"
import { LensScoreLogo } from "@/components/layout/lensscore-logo"
import { ArrowLeft, Printer } from "lucide-react"
import type { ExamTemplate } from "@/lib/types"

interface FullExamPrintProps {
  exam: ExamTemplate
  onBack: () => void
}

export function FullExamPrint({ exam, onBack }: FullExamPrintProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Controls */}
      <div className="print:hidden max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Prova Completa</h1>
              <p className="text-sm text-slate-500">{exam.title}</p>
            </div>
          </div>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Prova
          </Button>
        </div>
      </div>

      {/* Printable Exam */}
      <div className="print:m-0 print:p-0 flex justify-center p-8">
        <div className="w-[210mm] bg-white print:shadow-none shadow-2xl" style={{ minHeight: "297mm" }}>
          <div className="p-16">
            {/* Header */}
            <header className="border-b-2 border-black pb-4 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-black">{exam.title}</h1>
                  <p className="text-sm text-slate-600 mt-2">Total: {exam.totalQuestions} questões</p>
                </div>
                <LensScoreLogo size="sm" className="items-end text-right" subtitle="Exam Intelligence" />
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-xs text-slate-500">NOME: ___________________________________</span>
                </div>
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-xs text-slate-500">MATRÍCULA: _______________________</span>
                </div>
              </div>
            </header>

            {/* Questions */}
            <main className="space-y-6">
              {Array.from({ length: exam.totalQuestions }, (_, i) => i + 1).map((questionNum) => (
                <div key={questionNum} className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-black">{questionNum}.</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">
                        {exam.questions?.[questionNum] || `Questão ${questionNum} - Enunciado a ser preenchido`}
                      </p>
                    </div>
                  </div>
                  <div className="ml-6 space-y-2">
                    {(["A", "B", "C", "D"] as const).map((option) => (
                      <div key={option} className="flex items-start gap-2">
                        <span className="font-semibold text-black w-6">{option})</span>
                        <span className="text-sm text-slate-600">Alternativa {option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </main>

            {/* Footer */}
            <footer className="mt-12 pt-4 border-t border-slate-300">
              <p className="text-xs text-slate-600 text-center">
                LensScore - Sistema de Correção Automática de Provas
              </p>
            </footer>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}
