import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, ClipboardCheck } from "lucide-react"
import { useForm } from "react-hook-form"

import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import { useStudentProgressReportMutations } from "../hooks/use-student-progress-reports"
import {
  studentProgressReportReviewSchema,
  type StudentProgressReportReviewData,
} from "../schemas/student-progress-report-schema"
import type { StudentProgressReport } from "../types/student-progress-report"

type Props = {
  studentId: string
  report: StudentProgressReport | null
  onClose: () => void
}

export function StudentProgressReportReviewModal({ studentId, report, onClose }: Props) {
  const [actionError, setActionError] = useState<string | null>(null)
  const { reviewMutation } = useStudentProgressReportMutations(studentId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentProgressReportReviewData>({
    resolver: zodResolver(studentProgressReportReviewSchema),
  })

  useEffect(() => {
    if (!report) return
    reset({
      review_status: report.review_status === "needs_adjustment" ? "needs_adjustment" : "reviewed",
      review_notes: report.review_notes ?? "",
    })
  }, [report, reset])

  if (!report) return null
  const reportId = report.id

  function closeModal() {
    setActionError(null)
    onClose()
  }

  async function onSubmit(data: StudentProgressReportReviewData) {
    try {
      setActionError(null)
      await reviewMutation.mutateAsync({ reportId, data })
      closeModal()
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section role="dialog" aria-modal="true" aria-labelledby="pa-review-title" className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ClipboardCheck size={21} /></div>
            <div>
              <h2 id="pa-review-title" className="text-xl font-bold text-blue-950">Avaliar relatório diário do PA</h2>
              <p className="mt-1 text-sm text-zinc-500">{report.title} · {report.created_by_name || "Profissional não identificado"}</p>
            </div>
          </div>
          <button type="button" onClick={closeModal} className="rounded-xl px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100">Fechar</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {actionError ? <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0" /><p>{actionError}</p></div> : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Resultado da avaliação</label>
            <select {...register("review_status")} className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500">
              <option value="reviewed">Avaliado</option>
              <option value="needs_adjustment">Solicitar ajuste ao PA</option>
            </select>
            {errors.review_status ? <p className="mt-1 text-sm text-red-500">{errors.review_status.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Parecer do AEE *</label>
            <textarea {...register("review_notes")} rows={7} placeholder="Registre sua análise, orientações e, quando necessário, os ajustes que o PA deverá realizar." className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500" />
            {errors.review_notes ? <p className="mt-1 text-sm text-red-500">{errors.review_notes.message}</p> : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-blue-100 pt-4">
            <button type="button" onClick={closeModal} className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
            <button type="submit" disabled={reviewMutation.isPending} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{reviewMutation.isPending ? "Salvando avaliação..." : "Salvar avaliação"}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
