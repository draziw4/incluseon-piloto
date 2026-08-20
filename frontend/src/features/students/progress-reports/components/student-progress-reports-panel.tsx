import { useState } from "react"
import { BookOpenText, Plus } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import type { StudentProgressReportFilters } from "../api/student-progress-reports"
import { useStudentProgressReportMutations, useStudentProgressReports } from "../hooks/use-student-progress-reports"
import type { StudentProgressProfessionalType, StudentProgressReport } from "../types/student-progress-report"
import { StudentProgressReportCard } from "./student-progress-report-card"
import { StudentProgressReportModal } from "./student-progress-report-modal"
import { StudentProgressReportReviewModal } from "./student-progress-report-review-modal"

type Props = {
  studentId: string
}

type ReportFilter = "all" | "aee" | "support" | "pending_support"

const filterOptions: Array<{ value: ReportFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "aee", label: "Relatórios do AEE" },
  { value: "support", label: "Relatórios do PA" },
  { value: "pending_support", label: "PA aguardando avaliação" },
]

function reportFilters(filter: ReportFilter): StudentProgressReportFilters {
  if (filter === "aee") return { professionalType: "aee" }
  if (filter === "support") return { professionalType: "support" }
  if (filter === "pending_support") return { professionalType: "support", reviewStatus: "pending" }
  return {}
}

export function StudentProgressReportsPanel({ studentId }: Props) {
  const { user } = useAuth()
  const [filter, setFilter] = useState<ReportFilter>(user?.role === "support_professional" ? "support" : "all")
  const [openModal, setOpenModal] = useState(false)
  const [editingReport, setEditingReport] = useState<StudentProgressReport | null>(null)
  const [reviewingReport, setReviewingReport] = useState<StudentProgressReport | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { data: reports = [], isLoading, isError } = useStudentProgressReports(studentId, reportFilters(filter))
  const { deleteMutation } = useStudentProgressReportMutations(studentId)

  const professionalType: StudentProgressProfessionalType = user?.role === "support_professional" ? "support" : "aee"
  const canCreate = user?.role === "admin" || user?.role === "aee" || user?.role === "support_professional"
  const canReviewSupportReports = user?.role === "admin" || user?.role === "aee"

  function canChange(report: StudentProgressReport) {
    return user?.role === "admin" || report.created_by_id === user?.id
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

  const createLabel = professionalType === "support" ? "Novo relatório diário do PA" : "Novo relatório do AEE"

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold text-blue-950">Relatórios de acompanhamento</h2>
          <p className="mt-1 text-sm text-zinc-500">O PA registra o cotidiano do estudante; o AEE avalia esses registros e produz seus próprios relatórios pedagógicos detalhados.</p>
        </div>
        {canCreate ? (
          <button type="button" onClick={() => { setEditingReport(null); setOpenModal(true) }} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">
            <Plus size={18} /> {createLabel}
          </button>
        ) : (
          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">Consulta ao histórico</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filtros de relatórios">
        {filterOptions.map((item) => (
          <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === item.value ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
            {item.label}
          </button>
        ))}
      </div>

      {actionError ? <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{actionError}</div> : null}
      {isLoading ? <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">Carregando relatórios...</div> : null}
      {isError ? <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">Não foi possível carregar os relatórios.</div> : null}

      {!isLoading && !isError && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <StudentProgressReportCard
              key={report.id}
              report={report}
              canChange={canChange(report)}
              canReview={canReviewSupportReports && report.professional_type === "support"}
              onEdit={() => { setEditingReport(report); setOpenModal(true) }}
              onDelete={() => void handleDelete(report)}
              onReview={() => setReviewingReport(report)}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && reports.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><BookOpenText size={28} /></div>
          <h3 className="mt-4 text-lg font-bold text-blue-950">Nenhum relatório neste filtro</h3>
          <p className="mt-1 max-w-lg text-sm text-zinc-500">Os relatórios do PA ficam aguardando avaliação do AEE. Os relatórios do AEE permanecem separados e podem conter uma análise mais detalhada do estudante.</p>
        </div>
      ) : null}

      <StudentProgressReportModal
        studentId={studentId}
        open={openModal}
        report={editingReport}
        professionalType={editingReport?.professional_type ?? professionalType}
        onClose={() => { setOpenModal(false); setEditingReport(null) }}
      />
      <StudentProgressReportReviewModal
        studentId={studentId}
        report={reviewingReport}
        onClose={() => setReviewingReport(null)}
      />
    </div>
  )
}
