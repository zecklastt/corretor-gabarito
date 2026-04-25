"use client"

import { Button } from "@/components/ui/button"
import { LensScoreLogo } from "@/components/layout/lensscore-logo"
import { ArrowLeft, Printer } from "lucide-react"
import type { ExamTemplate, Class } from "@/lib/types"

interface AnswerSheetProps {
  exam: ExamTemplate
  classData?: Class
  onBack: () => void
}

export function AnswerSheet({ exam, classData, onBack }: AnswerSheetProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Controls (hidden when printing) */}
      <div className="print:hidden max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Folha de Respostas</h1>
              <p className="text-sm text-slate-500">{exam.title}</p>
            </div>
          </div>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Instruções:</strong> Esta folha está otimizada para impressão A4. As âncoras pretas nos cantos são
            essenciais para a detecção automática da prova.
          </p>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="print:m-0 print:p-0 flex justify-center p-8">
        <div className="w-[210mm] h-[297mm] bg-white relative print:shadow-none shadow-2xl" id="answer-sheet">
          <div className="absolute top-4 left-4 w-10 h-10 bg-black print:bg-black" id="anchor-tl" />
          <div className="absolute top-4 right-4 w-10 h-10 bg-black print:bg-black" id="anchor-tr" />
          <div className="absolute bottom-4 left-4 w-10 h-10 bg-black print:bg-black" id="anchor-bl" />
          <div className="absolute bottom-4 right-4 w-10 h-10 bg-black print:bg-black" id="anchor-br" />

          {/* Content */}
          <div className="p-12 pt-16">
            {/* Header */}
            <header className="border-b-2 border-black pb-3 mb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-black">{exam.title}</h1>
                  <p className="text-xs text-slate-600 mt-0.5">Total: {exam.totalQuestions} questões</p>
                </div>
                <LensScoreLogo size="sm" className="items-end text-right" subtitle="Exam Intelligence" />
              </div>

              {/* Student and Class Info Fields - layout mais compacto */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                <div className="flex items-end border-b border-black pb-0.5">
                  <span className="text-xs font-bold text-black mr-1 whitespace-nowrap">NOME:</span>
                  <div className="flex-1" />
                </div>
                <div className="flex items-end border-b border-black pb-0.5">
                  <span className="text-xs font-bold text-black mr-1 whitespace-nowrap">MATRÍCULA:</span>
                  <div className="flex-1" />
                </div>
                <div className="flex items-end border-b border-black pb-0.5">
                  <span className="text-xs font-bold text-black mr-1 whitespace-nowrap">TURMA:</span>
                  <div className="flex-1 text-xs">{classData?.name || ""}</div>
                </div>
                <div className="flex items-end border-b border-black pb-0.5">
                  <span className="text-xs font-bold text-black mr-1 whitespace-nowrap">DATA:</span>
                  <div className="flex-1 text-xs">{classData?.date || ""}</div>
                </div>
                <div className="flex items-end border-b border-black pb-0.5">
                  <span className="text-xs font-bold text-black mr-1 whitespace-nowrap">CIDADE:</span>
                  <div className="flex-1 text-xs">{classData?.city || ""}</div>
                </div>
                <div className="flex items-end border-b border-black pb-0.5">
                  <span className="text-xs font-bold text-black mr-1 whitespace-nowrap">INSTRUTOR:</span>
                  <div className="flex-1 text-xs">{classData?.instructor || ""}</div>
                </div>
              </div>
            </header>

            {/* Answer grid – layout em 2 colunas */}
            <main className="mt-3">
              <div className="relative border-4 border-black rounded p-2">
                {/* Marcadores de perspectiva adicionais do bloco de gabarito */}
                {/* <div className="absolute top-1 left-1 w-6 h-6 bg-black print:bg-black" id="answer-anchor-tl" />
                <div className="absolute top-1 right-1 w-6 h-6 bg-black print:bg-black" id="answer-anchor-tr" />
                <div className="absolute bottom-1 left-1 w-6 h-6 bg-black print:bg-black" id="answer-anchor-bl" />
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-black print:bg-black" id="answer-anchor-br" /> */}

                <div className="grid grid-cols-2 gap-x-3">
                {[0, 1].map((colIndex) => (
                  <div key={colIndex} className="border border-slate-300 rounded divide-y divide-slate-200">
                    {Array.from({ length: Math.ceil(exam.totalQuestions / 2) }, (_, rowIndex) => {
                      const questionNum = colIndex * Math.ceil(exam.totalQuestions / 2) + rowIndex + 1
                      if (questionNum > exam.totalQuestions) return null
                      return (
                        <div key={questionNum} className="flex items-center gap-2 px-6 py-1.5">
                          <span className="w-6 font-bold text-xs text-black text-right">
                            {String(questionNum).padStart(2, "0")}.
                          </span>
                          <div className="flex gap-3">
                            {(["A", "B", "C", "D"] as const).map((option) => (
                              <div key={option} className="flex items-center gap-1">
                                <div
                                  className="w-3 h-3 border border-black bg-white"
                                  style={{
                                    WebkitPrintColorAdjust: "exact",
                                    printColorAdjust: "exact",
                                  }}
                                />
                                <span className="text-[10px] font-semibold text-black">{option}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                </div>
              </div>
            </main>

            {/* Footer Instructions */}
            <footer className="mt-3 pt-2 border-t border-black">
              <p className="text-[10px] text-black text-center font-medium">
                Preencha completamente o quadrado da alternativa escolhida. Use caneta preta ou azul. Não rasure.
              </p>
            </footer>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
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
          #answer-sheet {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          #answer-sheet * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}
