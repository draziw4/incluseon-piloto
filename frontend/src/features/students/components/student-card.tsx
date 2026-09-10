import { Link } from "react-router-dom"
import { Pencil, Trash2 } from "lucide-react"

import type { Student } from "../types/student"
import { formatStudentClassroom } from "../classroom-options"

type Props = {
  student: Student
  canManage?: boolean
  onEdit?: (student: Student) => void
  onDelete?: (student: Student) => void
}

export function StudentCard({ student, canManage, onEdit, onDelete }: Props) {
  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <Link to={`/students/${student.id}`} className="block">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-950">
              {student.name}
            </h2>

            <p className="text-sm text-blue-600">
              {student.diagnosis || "Sem diagnóstico"}
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {student.age !== null ? `${student.age} anos` : "Idade não informada"}
          </span>
        </div>

        <div className="space-y-1 text-sm text-zinc-600">
          <p>
            Escola:{" "}
            <span className="font-medium">
              {student.school_name || "-"}
            </span>
          </p>

          <p>
            Turma:{" "}
            <span className="font-medium">
              {formatStudentClassroom(student.school_grade, student.class_group)}
            </span>
          </p>

          <p>
            Responsável:{" "}
            <span className="font-medium">
              {student.guardian_name || "-"}
            </span>
          </p>
        </div>
      </Link>

      {canManage && (
        <div className="mt-4 flex gap-2 border-t border-blue-50 pt-4">
          <button type="button" onClick={() => onEdit?.(student)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
            <Pencil size={16} />
            Editar
          </button>
          <button type="button" onClick={() => onDelete?.(student)} className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50" aria-label={`Remover ${student.name}`}>
            <Trash2 size={16} />
            Remover
          </button>
        </div>
      )}
    </article>
  )
}
