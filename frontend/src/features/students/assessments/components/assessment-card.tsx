import { Brain, CalendarDays, Pencil, Trash2 } from "lucide-react"

import type { Assessment } from "../types/assessment"

type Props = {
  assessment: Assessment
  onEdit: () => void
  onDelete: () => void
}

export function AssessmentCard({ assessment, onEdit, onDelete }: Props) {
  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-blue-600">
            <Brain size={18} />

            <span className="text-sm font-semibold">
              Avaliação
            </span>
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
          <button type="button" onClick={onEdit} aria-label="Editar avaliação" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Pencil size={16} /></button>
          <button type="button" onClick={onDelete} aria-label="Excluir avaliação" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <AssessmentInfo
          label="Dificuldades"
          value={String(assessment.assessment_data.difficulties || "")}
        />

        <AssessmentInfo
          label="Potencialidades"
          value={String(assessment.assessment_data.strengths || "")}
        />

        <AssessmentInfo
          label="Comunicação"
          value={String(assessment.assessment_data.communication_notes || "")}
        />

        <AssessmentInfo
          label="Apoios recomendados"
          value={String(assessment.assessment_data.recommended_supports || "")}
        />
      </div>
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
  const labels: Record<string, string> = {
    parent_interview: "Entrevista com responsáveis",
    student_assessment: "Avaliação do estudante",
    school_interview: "Entrevista com equipe escolar",
    cognitive_assessment: "Avaliação cognitiva",
    pei: "PEI"
  }

  return labels[type] || type
}
