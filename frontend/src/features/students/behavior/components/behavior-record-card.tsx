import { Activity, Clock, MapPin, Pencil, Trash2 } from "lucide-react"

import type { BehaviorRecord } from "../types/behavior-record"

type Props = {
  record: BehaviorRecord
  onEdit?: () => void
  onDelete?: () => void
}

export function BehaviorRecordCard({ record, onEdit, onDelete }: Props) {
  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-blue-600">
            <Activity size={18} />

            <span className="text-sm font-semibold">
              Registro ABA
            </span>
          </div>

          <h3 className="text-lg font-bold text-blue-950">
            {record.behavior}
          </h3>
        </div>

        <div className="flex items-center gap-2">
        {record.intensity && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Intensidade {record.intensity}/10
          </span>
        )}
          {onEdit ? <button type="button" onClick={onEdit} aria-label="Editar registro" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Pencil size={16} /></button> : null}
          {onDelete ? <button type="button" onClick={onDelete} aria-label="Excluir registro" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoBlock
          title="Antecedente"
          content={record.antecedent}
        />

        <InfoBlock
          title="Comportamento"
          content={record.behavior}
        />

        <InfoBlock
          title="Consequência"
          content={record.consequence}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-zinc-600 md:grid-cols-2">
        {record.environment && (
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            <span>{record.environment}</span>
          </div>
        )}

        {record.duration_minutes !== null &&
          record.duration_minutes !== undefined && (
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <span>{record.duration_minutes} minutos</span>
            </div>
          )}
      </div>

      {record.strategy_used && (
        <div className="mt-4 rounded-xl bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-950">
            Estratégia utilizada
          </p>

          <p className="mt-1 text-sm text-blue-800">
            {record.strategy_used}
          </p>

          <p className="mt-2 text-xs font-medium text-blue-600">
            Funcionou?{" "}
            {record.strategy_effective === true
              ? "Sim"
              : record.strategy_effective === false
                ? "Não"
                : "Não informado"}
          </p>
        </div>
      )}

      {record.function_hypothesis && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-blue-950">
            Hipótese funcional
          </p>

          <p className="mt-1 text-sm text-zinc-600">
            {record.function_hypothesis}
          </p>
        </div>
      )}
    </article>
  )
}

function InfoBlock({
  title,
  content
}: {
  title: string
  content: string
}) {
  return (
    <div className="rounded-xl border border-blue-50 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
        {title}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-zinc-700">
        {content}
      </p>
    </div>
  )
}
