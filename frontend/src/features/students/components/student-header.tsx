import type { Student } from "../types/student"
import { Pencil, Trash2 } from "lucide-react"

type Props = {
  student: Student
  canManage?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function StudentHeader({ student, canManage, onEdit, onDelete }: Props) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-3xl font-bold text-blue-950">
            {student.name}
          </h1>

          <p className="mt-1 text-sm text-blue-600">
            {student.diagnosis || "Sem diagnóstico informado"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            {student.age !== null ? `${student.age} anos` : "Idade não informada"}
          </span>

          {canManage && (
            <>
              <button type="button" onClick={onEdit} className="flex items-center gap-2 rounded-xl border border-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                <Pencil size={16} />
                Editar
              </button>
              <button type="button" onClick={onDelete} className="flex items-center gap-2 rounded-xl border border-red-100 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <Trash2 size={16} />
                Remover
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoItem
          label="Escola"
          value={student.school_name}
        />

        <InfoItem
          label="Responsável"
          value={student.guardian_name}
        />

        <InfoItem
          label="Telefone"
          value={student.guardian_phone}
        />
      </div>
    </section>
  )
}

function InfoItem({
  label,
  value
}: {
  label: string
  value?: string | null
}) {
  return (
    <div>
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className="font-medium text-blue-950">
        {value || "-"}
      </p>
    </div>
  )
}
