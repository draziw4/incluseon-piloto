import {
  CalendarDays,
  Clock,
  Pencil,
  Trash2,
  UserRound
} from "lucide-react"

import type {
  Appointment
} from "../types/appointment"

import {
    formatAppointmentStatus,
    formatAppointmentType
}   from "../constants/appointment-options"


type Props = {
  appointment: Appointment
  onEdit: (appointment: Appointment) => void
  onDelete: (appointment: Appointment) => void
}

export function AppointmentCard({
  appointment,
  onEdit,
  onDelete
}: Props) {
  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2 text-blue-600">
            <CalendarDays size={18} />

            <span className="text-sm font-semibold">
              {formatAppointmentType(
                appointment.appointment_type
              )}
            </span>
          </div>

          <h3 className="text-lg font-bold text-blue-950">
            {appointment.student?.name ||
              `Aluno #${appointment.student_id}`}
          </h3>

          <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock size={15} />
              {formatDateTime(appointment.scheduled_at)}
            </span>

            <span className="flex items-center gap-1">
              <UserRound size={15} />
              {appointment.professional?.name ||
                "Profissional nÃ£o informado"}
            </span>
          </div>
        </div>

        <StatusBadge status={appointment.status} />
      </div>

      {appointment.objective && (
        <div className="mt-4 rounded-xl bg-blue-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Objetivo
          </p>

          <p className="mt-1 text-sm text-zinc-700">
            {appointment.objective}
          </p>
        </div>
      )}

      {appointment.summary && (
        <div className="mt-3 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Resumo
          </p>

          <p className="mt-1 text-sm text-zinc-700">
            {appointment.summary}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-blue-50 pt-4 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={() => onEdit(appointment)}
          className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          <Pencil size={16} />
          Editar
        </button>

        <button
          type="button"
          onClick={() => onDelete(appointment)}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 size={16} />
          Remover
        </button>
      </div>
    </article>
  )
}

function StatusBadge({
  status
}: {
  status: Appointment["status"]
}) {
  const styles: Record<
    Appointment["status"],
    string
> = {
    scheduled: "bg-blue-50 text-blue-700",
    completed: "bg-emerald-50 text-emerald-700",
    pending: "bg-orange-50 text-orange-700",
    canceled: "bg-red-50 text-red-700"
  }

  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-semibold",
        styles[status]
      ].join(" ")}
    >
      {formatAppointmentStatus(status)}
    </span>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value))
}