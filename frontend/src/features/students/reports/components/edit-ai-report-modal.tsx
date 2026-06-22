import { AlertCircle, FilePenLine } from "lucide-react"
import { useState } from "react"

import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import { useUpdateAIReport } from "../hooks/use-update-ai-report"
import type { SavedAIReport } from "../types/saved-ai-report"

type Props = {
  report: SavedAIReport
  studentId: string
  onClose: () => void
}

export function EditAIReportModal({ report, studentId, onClose }: Props) {
  const [content, setContent] = useState(report.content)
  const [actionError, setActionError] = useState<string | null>(null)
  const mutation = useUpdateAIReport(studentId)

  const isValid = content.trim().length >= 100

  function handleClose() {
    setActionError(null)
    onClose()
  }

  async function handleSave() {
    if (!isValid) return

    try {
      setActionError(null)
      await mutation.mutateAsync({
        reportId: report.id,
        content: content.trim(),
        expectedRevision: report.revision
      })
      handleClose()
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div role="dialog" aria-modal="true" aria-labelledby="edit-report-title" className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FilePenLine size={21} /></div>
            <div>
              <h2 id="edit-report-title" className="text-xl font-bold text-blue-950">Revisar relatório</h2>
              <p className="mt-1 text-sm text-zinc-500">A alteração criará a versão {report.revision + 1} e regenerará o PDF.</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="rounded-xl px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100">Fechar</button>
        </div>

        <label className="mt-6 flex min-h-0 flex-1 flex-col text-sm font-medium text-zinc-700">
          Conteúdo revisado pelo profissional
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="mt-2 min-h-96 flex-1 resize-y rounded-xl border border-blue-100 p-4 font-mono text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />
        </label>

        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>Mínimo de 100 caracteres</span><span>{content.trim().length} caracteres</span>
        </div>

        {actionError && (
          <div className="mt-4 flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" />{actionError}</div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={handleClose} className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={!isValid || mutation.isPending} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {mutation.isPending ? "Salvando e gerando PDF..." : "Salvar nova versão"}
          </button>
        </div>
      </div>
    </div>
  )
}
