import { useState } from "react"

import { Brain, Plus } from "lucide-react"

import { useAssessments } from "../hooks/use-assessments"
import { AssessmentCard } from "./assessment-card"
import { CreateAssessmentModal } from "./create-assement-modal"
import type { Assessment } from "../types/assessment"
import { api } from "@/api/client"
import { useQueryClient } from "@tanstack/react-query"

type Props = {
  studentId: string
}

export function AssessmentsPanel({ studentId }: Props) {
  const [openModal, setOpenModal] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null)
  const queryClient = useQueryClient()

  async function deleteAssessment(assessment: Assessment) {
    if (!window.confirm("Excluir esta avaliação? Esta ação não pode ser desfeita.")) return
    await api.delete(`/assessments/student/${studentId}/${assessment.id}`)
    await queryClient.invalidateQueries({ queryKey: ["assessments", studentId] })
  }

  const {
    data,
    isLoading,
    isError
  } = useAssessments(studentId)

const assessments = Array.isArray(data)
  ? data
  : data?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold text-blue-950">
            Avaliações e entrevistas
          </h2>

          <p className="text-sm text-zinc-500">
            Registre entrevistas, instrumentos avaliativos e informações do PEI.
          </p>
        </div>

        <button
          onClick={() => { setEditingAssessment(null); setOpenModal(true) }}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Nova avaliação
        </button>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">
          Carregando avaliações...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
          Não foi possível carregar as avaliações.
        </div>
      )}

      {!isLoading && !isError && assessments.length > 0 && (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onEdit={() => { setEditingAssessment(assessment); setOpenModal(true) }}
              onDelete={() => void deleteAssessment(assessment)}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && assessments.length === 0 && (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Brain size={28} />
          </div>

          <h3 className="text-lg font-bold text-blue-950">
            Nenhuma avaliação registrada
          </h3>

          <p className="mt-1 max-w-md text-sm text-zinc-500">
            Cadastre entrevistas e avaliações para construir o perfil global do aluno.
          </p>

          <button
            onClick={() => { setEditingAssessment(null); setOpenModal(true) }}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Criar primeira avaliação
          </button>
        </div>
      )}

      <CreateAssessmentModal
        studentId={studentId}
        open={openModal}
        onClose={() => { setOpenModal(false); setEditingAssessment(null) }}
        assessment={editingAssessment}
      />
    </div>
  )
}
