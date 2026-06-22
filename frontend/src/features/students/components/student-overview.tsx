import type { Student } from "../types/student"

type Props = {
  student: Student
}

export function StudentOverview({ student }: Props) {
  return (
    <div className="space-y-4">
      <OverviewCard
        title="Comunicação"
        content={student.communication_notes}
      />

      <OverviewCard
        title="Sensibilidade sensorial"
        content={student.sensory_notes}
      />

      <OverviewCard
        title="Observações gerais"
        content={student.general_observations}
      />
    </div>
  )
}

function OverviewCard({
  title,
  content
}: {
  title: string
  content?: string | null
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-blue-950">
        {title}
      </h2>

      <p className="text-sm leading-relaxed text-zinc-600">
        {content || "Nenhuma informação registrada ainda."}
      </p>
    </div>
  )
}
