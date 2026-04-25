"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useExamStore } from "@/store/exam-store"
import { ArrowLeft } from "lucide-react"

interface CreateClassFormProps {
  onBack: () => void
  onSuccess: () => void
}

export function CreateClassForm({ onBack, onSuccess }: CreateClassFormProps) {
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [instructor, setInstructor] = useState("")
  const [date, setDate] = useState("")

  const { addClass } = useExamStore()

  const handleSubmit = () => {
    if (!name || !city || !instructor || !date) {
      alert("Preencha todos os campos")
      return
    }

    const newClass = {
      id: `class-${Date.now()}`,
      name,
      city,
      instructor,
      date,
      createdAt: Date.now(),
    }

    addClass(newClass)
    onSuccess()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nova Turma</h1>
            <p className="text-sm text-slate-500">Crie uma turma para organizar suas correções</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Turma</Label>
            <Input id="name" placeholder="Ex: Turma A - Manhã" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" placeholder="Ex: São Paulo" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor">Instrutor</Label>
            <Input
              id="instructor"
              placeholder="Ex: Prof. João Silva"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
            Criar Turma
          </Button>
        </Card>
      </div>
    </div>
  )
}
