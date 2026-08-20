import {
  Activity,
  Brain,
  FileText,
  Sparkles,
  type LucideIcon
} from "lucide-react"

import type { TimelineItem } from "../types/timeline-item"

type Props = {
  item: TimelineItem
}

const timelineIcons: Record<string, LucideIcon> = {
  behavior_record: Activity,
  progress_report: FileText,
  assessment: Brain,
  report: FileText,
  ai_report: Sparkles
}

const timelineLabels: Record<string, string> = {
  behavior_record: "Observação comportamental",
  progress_report: "Relatório diário/semanal",
  assessment: "Avaliação / Entrevista",
  report: "Relatório",
  ai_report: "Estudo de caso"
}

export function TimelineItemCard({ item }: Props) {
  const Icon = timelineIcons[item.type] ?? Activity

  return (
    <article className="relative rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon size={20} />
        </div>

        <div className="flex-1">
          <div className="mb-1 flex flex-col justify-between gap-2 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                {formatTimelineType(item.type)}
              </p>

              <h3 className="text-lg font-bold text-blue-950">
                {item.title}
              </h3>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {new Date(item.created_at).toLocaleDateString("pt-BR")}
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {item.description}
          </p>

          {item.metadata?.intensity !== undefined && (
            <div className="mt-3 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
              Intensidade: {String(item.metadata.intensity)}/10
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function formatTimelineType(type: string) {
  return timelineLabels[type] ?? type
}
