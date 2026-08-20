import { useState } from "react"
import { BookOpenText, Plus } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import { useStudentProgressReportMutations, useStudentProgressReports } from "../hooks/use-student-progress-reports"
import type { StudentProgressReport, StudentProgressReportType } from "../types/student-progress-report"
import { StudentProgressReportCard } from "./student-progress-report-card"
import { StudentProgressReportModal } from "./student-progress-report-modal"

type Props = {
  studentId: string
  canManage: boolean
}

type ReportFilter = "all" | StudentProgressReportType

export function StudentProgressReportsPanel({ studentId, canManage }: Props) {
  const { user } = useAuth()
  const [filter, setFilter] = useState<ReportFilter>("all")
  const [openModal, setOpenModal] = useState(false)
  const [editingReport, setEditingReport] = useState<StudentProgressReport | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { data: reports = [], isLoading, isError } = useStudentProgressReports(studentId, filter === "all" ? undefined : filter)
  const { deleteMutation } = useStudentProgressReportMutations(studentId)

  function canChange(report: StudentProgressReport) {
    return canManage && (user?.role === "admin" || report.created_by_id === user?.id)
  }

  async function handleDelete(report: StudentProgressReport) {
    if (!window.confirm(`Excluir o relatório "${report.title}"? Esta ação não pode ser desfeita.`)) return
    try {
      setActionError(null)
      await deleteMutation.mutateAsync(report.id)
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold text-blue-950">Relatórios de acompanhamento</h2>
          <p className="mt-1 text-sm text-zinc-500">Registros diários e semanais do AEE, organizados por aluno e preservados no histórico.</p>
        </div>
        {canManage ? (
          <button type="button" onClick={() => { setEditingReport(null); setOpenModal(true) }} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">
            <Plus size={18} /> Novo relatório
          </button>
        ) : (
          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">Consulta ao histórico</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "daily", "weekly"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === item ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
            {item === "all" ? "Todos" : item === "daily" ? "Diários" : "Semanais"}
          </button>
        ))}
      </div>

      {actionError && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{actionError}</div>}
      {isLoading && <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">Carregando relatórios...</div>}
      {isError && <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">Não foi possível carregar os relatórios.</div>}

      {!isLoading && !isError && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => (
            <StudentProgressReportCard
              key={report.id}
              report={report}
              canChange={canChange(report)}
              onEdit={() => { setEditingReport(report); setOpenModal(true) }}
              onDelete={() => void handleDelete(report)}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && reports.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><BookOpenText size={28} /></div>
          <h3 className="mt-4 text-lg font-bold text-blue-950">Nenhum relatório neste período</h3>
          <p className="mt-1 max-w-lg text-sm text-zinc-500">Use os relatórios diários para registrar o acompanhamento de um dia e os semanais para consolidar avanços, barreiras, estratégias e próximos passos.</p>
        </div>
      )}

      <StudentProgressReportModal
        studentId={studentId}
        open={openModal}
        report={editingReport}
        onClose={() => { setOpenModal(false); setEditingReport(null) }}
      />
    </div>
  )
}
