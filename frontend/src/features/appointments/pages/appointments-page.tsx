import { useMemo, useState } from "react"

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  XCircle
} from "lucide-react"

import type {
  Appointment,
  AppointmentStatus
} from "../types/appointment"

import {
  APPOINTMENT_STATUSES
} from "../constants/appointment-options"

import {
  useAppointments
} from "../hooks/use-appointments"

import {
  useDeleteAppointment
} from "../hooks/use-delete-appointment"


import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"


import {
  AppointmentSummaryCard
} from "../components/appointment-summary-card"

import {
  AppointmentCard
} from "../components/appointment-card"

import {
  CreateAppointmentModal
} from "../components/create-appointment-modal"

export function AppointmentsPage() {
  const [openModal, setOpenModal] =
    useState(false)

  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null)

  const [statusFilter, setStatusFilter] =
    useState<AppointmentStatus | "">("")

  const [search, setSearch] =
    useState("")

  const [actionError, setActionError] =
    useState<string | null>(null)

  const {
    data: appointments = [],
    isLoading,
    isError
  } = useAppointments({
    status: statusFilter,
    search
  })

  const deleteMutation = useDeleteAppointment()

  const summary = useMemo(() => {
    const today = new Date()

    const todayCount = appointments.filter(
      (appointment) => {
        const date = new Date(
          appointment.scheduled_at
        )

        return (
          date.toDateString() ===
          today.toDateString()
        )
      }
    ).length

    const completed = appointments.filter(
      (appointment) =>
        appointment.status === "completed"
    ).length

    const pending = appointments.filter(
      (appointment) =>
        appointment.status === "pending" ||
        appointment.status === "scheduled"
    ).length

    const canceled = appointments.filter(
      (appointment) =>
        appointment.status === "canceled"
    ).length

    return {
      todayCount,
      completed,
      pending,
      canceled
    }
  }, [appointments])

  function handleEdit(
    appointment: Appointment
  ) {
    setEditingAppointment(appointment)
    setOpenModal(true)
  }

  async function handleDelete(
    appointment: Appointment
  ) {
    const confirmed = window.confirm(
      "Deseja remover este atendimento?"
    )

    if (!confirmed) return

    try {
      setActionError(null)

      await deleteMutation.mutateAsync(
        appointment.id
      )
    } catch (error) {
      setActionError(
        getApiErrorMessage(error)
      )
    }
  }

  function handleCloseModal() {
    setOpenModal(false)
    setEditingAppointment(null)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-600">
              <CalendarDays size={20} />

              <span className="text-sm font-semibold">
                Gestão de atendimentos
              </span>
            </div>

            <h1 className="text-2xl font-bold text-blue-950">
              Atendimentos
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Registre e acompanhe atendimentos, reuniões, observações e intervenções realizadas com os alunos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Novo atendimento
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AppointmentSummaryCard
          icon={<CalendarDays size={20} />}
          title="Atendimentos hoje"
          value={summary.todayCount}
          description="registros para hoje"
        />

        <AppointmentSummaryCard
          icon={<CheckCircle2 size={20} />}
          title="Realizados"
          value={summary.completed}
          description="atendimentos concluídos"
        />

        <AppointmentSummaryCard
          icon={<Clock size={20} />}
          title="Pendentes"
          value={summary.pending}
          description="agendados ou pendentes"
        />

        <AppointmentSummaryCard
          icon={<XCircle size={20} />}
          title="Cancelados"
          value={summary.canceled}
          description="atendimentos cancelados"
        />
      </section>

      {actionError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-950">
              Lista de atendimentos
            </h2>

            <p className="text-sm text-zinc-500">
              Histórico e agenda de atendimentos registrados.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex items-center gap-3 rounded-xl border border-blue-100 px-4 py-3">
              <Search
                size={18}
                className="text-zinc-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar por aluno"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as AppointmentStatus | ""
                )
              }
              className="rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                Todos os status
              </option>

              {APPOINTMENT_STATUSES.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">
            Carregando atendimentos...
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
            Não foi possível carregar os atendimentos.
          </div>
        )}

        {!isLoading &&
          !isError &&
          appointments.length > 0 && (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

        {!isLoading &&
          !isError &&
          appointments.length === 0 && (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-blue-100 bg-blue-50/40 p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <CalendarDays size={30} />
              </div>

              <h3 className="text-lg font-bold text-blue-950">
                Nenhum atendimento encontrado
              </h3>

              <p className="mt-1 max-w-md text-sm text-zinc-500">
                Crie um novo atendimento para registrar acompanhamentos, reuniões, observações ou intervenções.
              </p>
            </div>
          )}
      </section>

      <CreateAppointmentModal
        open={openModal}
        onClose={handleCloseModal}
        appointment={editingAppointment}
      />
    </div>
  )
}