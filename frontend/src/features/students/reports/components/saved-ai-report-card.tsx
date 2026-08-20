import {
  CalendarDays,
  Download,
  FileText,
  Pencil
} from "lucide-react"

import type {
  SavedAIReport
} from "../types/saved-ai-report"

type Props = {
  report: SavedAIReport
  canEdit: boolean
  isDownloading: boolean
  onEdit: () => void
  onDownload: () => void
}

export function SavedAIReportCard({
  report,
  canEdit,
  isDownloading,
  onEdit,
  onDownload
}: Props) {
  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2 text-blue-600">
            <FileText size={18} />

            <span className="text-sm font-semibold">
              Estudo de caso com IA
            </span>
          </div>

          <h3 className="text-lg font-bold text-blue-950">
            Estudo de caso
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Modelo: {report.model_used || "Não informado"} · Versão {report.revision}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          <CalendarDays size={14} />

          {new Date(report.created_at).toLocaleDateString("pt-BR")}
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-2xl bg-slate-50 p-4">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
          {report.content}
        </pre>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <p className="text-xs text-zinc-500">
          Tokens usados: {report.total_tokens ?? "não registrado"}
        </p>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <button type="button" onClick={onEdit} className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
              <Pencil size={16} /> Revisar
            </button>
          )}
          {report.pdf_available && (
            <button type="button" onClick={onDownload} disabled={isDownloading} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              <Download size={16} /> {isDownloading ? "Baixando..." : "Baixar PDF"}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
