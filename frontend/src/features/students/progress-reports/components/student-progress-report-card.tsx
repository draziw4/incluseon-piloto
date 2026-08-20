import { CalendarDays, ClipboardCheck, Pencil, Trash2 } from "lucide-react"

import type { StudentProgressReport } from "../types/student-progress-report"

type Props = {
  report: StudentProgressReport
  canChange: boolean
  canReview: boolean
  onEdit: () => void
  onDelete: () => void
  onReview: () => void
}

const aeeDetailFields = [
  ["activities", "Atividades desenvolvidas"],
  ["participation_engagement", "Participação e engajamento"],
  ["progress", "Avanços observados"],
  ["difficulties", "Dificuldades e barreiras"],
  ["strategies_and_resources", "Estratégias e recursos"],
  ["communication_socialization", "Comunicação e socialização"],
  ["autonomy_functionality", "Autonomia e funcionalidade"],
  ["family_school_notes", "Articulação com família e escola"],
  ["next_steps", "Próximos passos"],
] as const

const supportDetailFields = [
  ["activities", "Atividades acompanhadas"],
  ["participation_engagement", "Participação e resposta do estudante"],
  ["difficulties", "Intercorrências, barreiras ou riscos"],
  ["strategies_and_resources", "Apoios e estratégias utilizados"],
  ["communication_socialization", "Comunicação e interação"],
  ["autonomy_functionality", "Autonomia e cuidados"],
  ["family_school_notes", "Informações importantes para o AEE"],
  ["next_steps", "Pontos para acompanhamento"],
] as const

const reviewLabels = {
  pending: { label: "Aguardando avaliação do AEE", className: "bg-amber-50 text-amber-700" },
  reviewed: { label: "Avaliado pelo AEE", className: "bg-emerald-50 text-emerald-700" },
  needs_adjustment: { label: "Ajuste solicitado pelo AEE", className: "bg-red-50 text-red-700" },
} as const

export function StudentProgressReportCard({ report, canChange, canReview, onEdit, onDelete, onReview }: Props) {
  const detailFields = report.professional_type === "support" ? supportDetailFields : aeeDetailFields
  const details = detailFields.filter(([field]) => Boolean(report[field]))
  const review = report.review_status ? reviewLabels[report.review_status] : null

  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {report.report_type === "daily" ? "Diário" : "Semanal"}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${report.professional_type === "support" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"}`}>
              {report.professional_type === "support" ? "Relatório do PA" : "Relatório do AEE"}
            </span>
            {review ? <span className={`rounded-full px-3 py-1 text-xs font-semibold ${review.className}`}>{review.label}</span> : null}
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              <CalendarDays size={13} /> {formatPeriod(report)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-blue-950">{report.title}</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Registrado por {report.created_by_name || "profissional não identificado"} em {new Date(report.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {(canChange || canReview) && (
          <div className="flex gap-2">
            {canReview ? <button type="button" onClick={onReview} aria-label="Avaliar relatório do PA" title="Avaliar relatório do PA" className="rounded-xl border border-emerald-100 p-2 text-emerald-700 hover:bg-emerald-50"><ClipboardCheck size={17} /></button> : null}
            {canChange ? <button type="button" onClick={onEdit} aria-label="Editar relatório" className="rounded-xl border border-blue-100 p-2 text-blue-700 hover:bg-blue-50"><Pencil size={17} /></button> : null}
            {canChange ? <button type="button" onClick={onDelete} aria-label="Excluir relatório" className="rounded-xl border border-red-100 p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button> : null}
          </div>
        )}
      </div>

      {report.professional_type === "support" && report.review_notes ? (
        <div className={`mt-4 rounded-xl border p-4 ${report.review_status === "needs_adjustment" ? "border-red-100 bg-red-50" : "border-emerald-100 bg-emerald-50"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Parecer do AEE</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{report.review_notes}</p>
          <p className="mt-2 text-xs text-zinc-500">Avaliado por {report.reviewed_by_name || "profissional do AEE"}{report.reviewed_at ? ` em ${new Date(report.reviewed_at).toLocaleDateString("pt-BR")}` : ""}</p>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Síntese</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{report.summary}</p>
      </div>

      {details.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-blue-700">Ver acompanhamento detalhado</summary>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {details.map(([field, label]) => (
              <div key={field} className="rounded-xl border border-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{label}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{report[field]}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </article>
  )
}

function formatPeriod(report: StudentProgressReport) {
  const start = new Date(`${report.period_start}T12:00:00`).toLocaleDateString("pt-BR")
  if (report.report_type === "daily") return start
  const end = new Date(`${report.period_end}T12:00:00`).toLocaleDateString("pt-BR")
  return `${start} a ${end}`
}
