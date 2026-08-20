import { Flag, Pencil, Plus, Target, Trash2 } from "lucide-react"
import { useState } from "react"

import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import { useDeleteStudentGoal } from "../hooks/use-delete-student-goal"
import { useStudentGoals } from "../hooks/use-student-goals"
import type { StudentGoal } from "../types/student-goal"
import { StudentGoalModal } from "./student-goal-modal"

type Props = {
  studentId: string
  canManage: boolean
}

export function StudentGoalsPanel({ studentId, canManage }: Props) {
  const [openModal, setOpenModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<StudentGoal | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { data: goals = [], isLoading, isError } = useStudentGoals(studentId)
  const deleteMutation = useDeleteStudentGoal(studentId)

  async function handleDelete(goal: StudentGoal) {
    const confirmed = window.confirm(`Deseja remover a meta "${goal.title}"?`)

    if (!confirmed) return

    try {
      setActionError(null)
      await deleteMutation.mutateAsync({ studentId, goalId: goal.id })
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }

  function handleCloseModal() {
    setOpenModal(false)
    setEditingGoal(null)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-600"><Target size={20} /><span className="text-sm font-semibold">PAEE e metas</span></div>
            <h2 className="text-xl font-bold text-blue-950">Plano de Atendimento Educacional Especializado</h2>
            <p className="mt-1 text-sm text-zinc-500">Elabore o PAEE com base no estudo de caso. O PEI da sala regular é produzido posteriormente pelo professor, com base no PAEE.</p>
          </div>

          {canManage && (
            <button type="button" onClick={() => setOpenModal(true)} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"><Plus size={18} />Nova meta</button>
          )}
        </div>
      </section>

      {actionError && <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{actionError}</div>}

      {isLoading ? (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">Carregando metas...</div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">Não foi possível carregar as metas.</div>
      ) : goals.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <Flag size={28} className="text-blue-600" />
          <h3 className="mt-3 font-bold text-blue-950">Nenhuma meta cadastrada</h3>
          <p className="mt-1 max-w-md text-sm text-zinc-500">Crie metas após revisar o estudo de caso, transformando necessidades e potencialidades em ações do PAEE.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} canManage={canManage} onEdit={() => setEditingGoal(goal)} onDelete={() => handleDelete(goal)} />
          ))}
        </div>
      )}

      <StudentGoalModal open={openModal || Boolean(editingGoal)} studentId={studentId} goal={editingGoal} onClose={handleCloseModal} />
    </div>
  )
}

function GoalCard({ goal, canManage, onEdit, onDelete }: { goal: StudentGoal; canManage: boolean; onEdit: () => void; onDelete: () => void }) {
  const progressColor = goal.status === "completed" ? "bg-emerald-500" : "bg-blue-600"

  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{goal.area}</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">{statusLabel[goal.status]}</span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">{priorityLabel[goal.priority]}</span>
          </div>
          <h3 className="text-lg font-bold text-blue-950">{goal.title}</h3>
          {goal.description && <p className="mt-2 text-sm leading-6 text-zinc-600">{goal.description}</p>}
        </div>

        {canManage && (
          <div className="flex gap-2">
            <button type="button" onClick={onEdit} className="rounded-xl border border-blue-100 p-2 text-blue-700 hover:bg-blue-50" aria-label="Editar meta"><Pencil size={17} /></button>
            <button type="button" onClick={onDelete} className="rounded-xl border border-red-100 p-2 text-red-600 hover:bg-red-50" aria-label="Remover meta"><Trash2 size={17} /></button>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs text-zinc-500"><span>Progresso</span><span>{goal.progress}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-blue-50"><div className={`h-full ${progressColor}`} style={{ width: `${goal.progress}%` }} /></div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <Info label="Prazo" value={goal.target_date ? new Date(`${goal.target_date}T00:00:00`).toLocaleDateString("pt-BR") : "Sem prazo"} />
        <Info label="Última atualização" value={new Date(goal.updated_at).toLocaleDateString("pt-BR")} />
      </div>

      {goal.evidence_notes && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-zinc-600"><strong>Evidências:</strong> {goal.evidence_notes}</div>}
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-zinc-400">{label}</p><p className="font-medium text-blue-950">{value}</p></div>
}

const statusLabel = { not_started: "Não iniciada", in_progress: "Em andamento", completed: "Concluída", paused: "Pausada" }
const priorityLabel = { low: "Baixa", medium: "Média", high: "Alta" }
