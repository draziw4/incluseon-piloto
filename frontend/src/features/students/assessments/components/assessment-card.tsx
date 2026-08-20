import { Brain, CalendarDays, Pencil, Trash2 } from "lucide-react"

import type { Assessment } from "../types/assessment"
import {
  formatInstrumentAnswer,
  getInstrumentDefinition,
} from "../instrument-definitions"

type Props = {
  assessment: Assessment
  onEdit: () => void
  onDelete: () => void
}

export function AssessmentCard({ assessment, onEdit, onDelete }: Props) {
  const definition = getInstrumentDefinition(assessment.assessment_type)
  const answeredFields = definition?.sections.flatMap((section) =>
    section.fields
      .filter((field) => {
        const answer = assessment.assessment_data[field.name]
        return Array.isArray(answer) ? answer.length > 0 : typeof answer === "string" && answer.trim().length > 0
      })
      .map((field) => ({
        label: field.label,
        value: formatInstrumentAnswer(field, assessment.assessment_data[field.name]),
      })),
  ) ?? []

  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-blue-600">
            <Brain size={18} />

            <span className="text-sm font-semibold">Instrumental do estudo de caso</span>
          </div>

          <h3 className="text-lg font-bold text-blue-950">
            {assessment.title}
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            {formatAssessmentType(assessment.assessment_type)}
          </p>
        </div>

        <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          <CalendarDays size={14} />
          {new Date(assessment.created_at).toLocaleDateString("pt-BR")}
        </div>
          {definition && (
            <button type="button" onClick={onEdit} aria-label="Editar instrumental" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Pencil size={16} /></button>
          )}
          <button type="button" onClick={onDelete} aria-label="Excluir avaliação" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
        </div>
      </div>

      {answeredFields.length > 0 ? (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-blue-700">
            Ver {answeredFields.length} respostas registradas
          </summary>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {answeredFields.map((answer) => (
              <AssessmentInfo key={answer.label} label={answer.label} value={answer.value} />
            ))}
          </div>
        </details>
      ) : (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Registro legado sem respostas compatíveis com o novo instrumental.
        </p>
      )}
    </article>
  )
}

function AssessmentInfo({
  label,
  value
}: {
  label: string
  value?: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
        {label}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-zinc-700">
        {value || "Não informado"}
      </p>
    </div>
  )
}

function formatAssessmentType(type: string) {
  return getInstrumentDefinition(type)?.label || `Registro legado (${type})`
}
