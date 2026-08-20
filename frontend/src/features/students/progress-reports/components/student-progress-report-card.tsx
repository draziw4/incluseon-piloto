import { CalendarDays, Pencil, Trash2 } from "lucide-react"

import type { StudentProgressReport } from "../types/student-progress-report"

type Props = {
  report: StudentProgressReport
  canChange: boolean
  onEdit: () => void
  onDelete: () => void
}

const detailFields = [
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

export function StudentProgressReportCard({ report, canChange, onEdit, onDelete }: Props) {
  const details = detailFields.filter(([field]) => Boolean(report[field]))

  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {report.report_type === "daily" ? "Diário" : "Semanal"}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              <CalendarDays size={13} /> {formatPeriod(report)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-blue-950">{report.title}</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Registrado por {report.created_by_name || "profissional não identificado"} em {new Date(report.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {canChange && (
          <div className="flex gap-2">
            <button type="button" onClick={onEdit} aria-label="Editar relatório" className="rounded-xl border border-blue-100 p-2 text-blue-700 hover:bg-blue-50"><Pencil size={17} /></button>
            <button type="button" onClick={onDelete} aria-label="Excluir relatório" className="rounded-xl border border-red-100 p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button>
          </div>
        )}
      </div>

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
