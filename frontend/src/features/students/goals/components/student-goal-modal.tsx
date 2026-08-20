import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import { useCreateStudentGoal } from "../hooks/use-create-student-goal"
import { useUpdateStudentGoal } from "../hooks/use-update-student-goal"
import { studentGoalSchema, type StudentGoalData, type StudentGoalFormData } from "../schemas/student-goal-schema"
import type { StudentGoal } from "../types/student-goal"

type Props = {
  open: boolean
  studentId: string
  goal?: StudentGoal | null
  onClose: () => void
}

export function StudentGoalModal({ open, studentId, goal, onClose }: Props) {
  const [actionError, setActionError] = useState<string | null>(null)
  const createMutation = useCreateStudentGoal(studentId)
  const updateMutation = useUpdateStudentGoal(studentId)
  const isEditing = Boolean(goal)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentGoalFormData, unknown, StudentGoalData>({
    resolver: zodResolver(studentGoalSchema),
    defaultValues: getGoalFormValues(goal)
  })

  useEffect(() => {
    if (open) reset(getGoalFormValues(goal))
  }, [goal, open, reset])

  if (!open) return null

  const isPending = createMutation.isPending || updateMutation.isPending

  function handleClose() {
    setActionError(null)
    onClose()
  }

  async function onSubmit(data: StudentGoalData) {
    try {
      setActionError(null)

      if (goal) {
        await updateMutation.mutateAsync({ studentId, goalId: goal.id, data })
      } else {
        await createMutation.mutateAsync({ studentId, data })
      }

      handleClose()
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-950">{isEditing ? "Editar meta do PAEE" : "Nova meta do PAEE"}</h2>
            <p className="mt-1 text-sm text-zinc-500">Defina objetivo, prazo, progresso e evidências de acompanhamento.</p>
          </div>
          <button type="button" onClick={handleClose} className="rounded-xl px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100">Fechar</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {actionError && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 md:col-span-2">{actionError}</div>}

          <Field label="Título" error={errors.title?.message} className="md:col-span-2">
            <input {...register("title")} className={fieldClass} placeholder="Ex: Ampliar comunicação funcional" />
          </Field>

          <Field label="Área" error={errors.area?.message}>
            <input {...register("area")} className={fieldClass} placeholder="Comunicação, autonomia, socialização..." />
          </Field>

          <Field label="Prazo" error={errors.target_date?.message}>
            <input type="date" {...register("target_date")} className={fieldClass} />
          </Field>

          <Field label="Status" error={errors.status?.message}>
            <select {...register("status")} className={fieldClass}>
              <option value="not_started">Não iniciada</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluída</option>
              <option value="paused">Pausada</option>
            </select>
          </Field>

          <Field label="Prioridade" error={errors.priority?.message}>
            <select {...register("priority")} className={fieldClass}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </Field>

          <Field label="Progresso (%)" error={errors.progress?.message}>
            <input type="number" min={0} max={100} {...register("progress")} className={fieldClass} />
          </Field>

          <Field label="Descrição" error={errors.description?.message} className="md:col-span-2">
            <textarea {...register("description")} className={textareaClass} placeholder="Descreva o objetivo pedagógico/funcional." />
          </Field>

          <Field label="Evidências" error={errors.evidence_notes?.message} className="md:col-span-2">
            <textarea {...register("evidence_notes")} className={textareaClass} placeholder="Registre observações, evidências, estratégias e evolução." />
          </Field>

          <div className="mt-2 flex justify-end gap-3 md:col-span-2">
            <button type="button" onClick={handleClose} className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
            <button type="submit" disabled={isPending} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isPending ? "Salvando..." : "Salvar meta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </label>
  )
}

function getGoalFormValues(goal?: StudentGoal | null): StudentGoalFormData {
  return {
    title: goal?.title ?? "",
    area: goal?.area ?? "",
    description: goal?.description ?? "",
    status: goal?.status ?? "not_started",
    priority: goal?.priority ?? "medium",
    target_date: goal?.target_date ?? "",
    progress: goal?.progress ?? 0,
    evidence_notes: goal?.evidence_notes ?? ""
  }
}

const fieldClass = "w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
const textareaClass = "min-h-28 w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
