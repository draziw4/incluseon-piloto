import { useEffect, useState } from "react"

import {
  useForm
} from "react-hook-form"

import {
  zodResolver
} from "@hookform/resolvers/zod"

import {
  AlertCircle
} from "lucide-react"

import {
  createAppointmentSchema,
  type CreateAppointmentData,
  type CreateAppointmentFormData
} from "../schemas/create-appointment-schema"

import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES
} from "../constants/appointment-options"

import type {
  Appointment
} from "../types/appointment"



import {
    useCreateAppointment
} from "../hooks/use-create-appointment"

import {
    useUpdateAppointment
} from "../hooks/use-update-appointment"

import {
  useStudents
} from "../../students/hooks/use-students"

import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"


type Props = {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
}

export function CreateAppointmentModal({
  open,
  onClose,
  appointment
}: Props) {
  const [actionError, setActionError] =
    useState<string | null>(null)

  const createMutation = useCreateAppointment()
  const updateMutation = useUpdateAppointment()

  const isEditing = !!appointment

  const {
    data: studentsData,
    isLoading: isLoadingStudents
  } = useStudents({
    page: 1,
    per_page: 100,
    search: ""
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<
    CreateAppointmentFormData,
    unknown,
    CreateAppointmentData
  >({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      status: "scheduled"
    }
  })

  useEffect(() => {
    if (appointment) {
      reset({
        student_id: appointment.student_id,
        appointment_type: appointment.appointment_type,
        scheduled_at: formatDateTimeLocal(
          appointment.scheduled_at
        ),
        status: appointment.status,
        objective: appointment.objective || "",
        summary: appointment.summary || "",
        observations: appointment.observations || "",
        next_steps: appointment.next_steps || ""
      })

      return
    }

    reset({
      status: "scheduled"
    })
  }, [appointment, reset, open])

  async function onSubmit(
    data: CreateAppointmentData
  ) {
    try {
      setActionError(null)

      const payload = {
        ...data,
        scheduled_at: data.scheduled_at
      }

      if (isEditing && appointment) {
        await updateMutation.mutateAsync({
          appointmentId: appointment.id,
          data: payload
        })
      } else {
        await createMutation.mutateAsync(payload)
      }

      handleClose()
    } catch (error) {
      setActionError(
        getApiErrorMessage(error)
      )
    }
  }

  function handleClose() {
    reset({
      status: "scheduled"
    })
    setActionError(null)
    onClose()
  }

  if (!open) return null

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending

  const students = studentsData?.items || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-950">
            {isEditing
              ? "Editar atendimento"
              : "Novo atendimento"}
          </h2>

          <p className="text-sm text-zinc-500">
            Registre os atendimentos realizados ou agendados para os alunos.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {actionError && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <p>{actionError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <Label>Aluno</Label>

              <select
                {...register("student_id")}
                disabled={isEditing}
                className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
              >
                <option value="">
                  {isLoadingStudents
                    ? "Carregando alunos..."
                    : "Selecione o aluno"}
                </option>

                {students.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.name}
                  </option>
                ))}
              </select>

              {errors.student_id && (
                <ErrorMessage>
                  {errors.student_id.message}
                </ErrorMessage>
              )}
            </Field>

            <Field>
              <Label>Tipo de atendimento</Label>

              <select
                {...register("appointment_type")}
                className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Selecione o tipo
                </option>

                {APPOINTMENT_TYPES.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </select>

              {errors.appointment_type && (
                <ErrorMessage>
                  {errors.appointment_type.message}
                </ErrorMessage>
              )}
            </Field>

            <Field>
              <Label>Data e hora</Label>

              <input
                type="datetime-local"
                {...register("scheduled_at")}
                className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              {errors.scheduled_at && (
                <ErrorMessage>
                  {errors.scheduled_at.message}
                </ErrorMessage>
              )}
            </Field>

            <Field>
              <Label>Status</Label>

              <select
                {...register("status")}
                className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {APPOINTMENT_STATUSES.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field>
            <Label>Objetivo do atendimento</Label>

            <textarea
              {...register("objective")}
              rows={3}
              className="w-full resize-none rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Ex: Trabalhar leitura com apoio visual."
            />
          </Field>

          <Field>
            <Label>Resumo do atendimento</Label>

            <textarea
              {...register("summary")}
              rows={4}
              className="w-full resize-none rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Descreva o que aconteceu durante o atendimento."
            />
          </Field>

          <Field>
            <Label>Observações</Label>

            <textarea
              {...register("observations")}
              rows={3}
              className="w-full resize-none rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Observações importantes sobre comportamento, participação ou contexto."
            />
          </Field>

          <Field>
            <Label>Próximos passos</Label>

            <textarea
              {...register("next_steps")}
              rows={3}
              className="w-full resize-none rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Encaminhamentos, estratégias ou ações futuras."
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Criar atendimento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  )
}

function Label({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <label className="mb-1 block text-sm font-medium text-zinc-700">
      {children}
    </label>
  )
}

function ErrorMessage({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <p className="mt-1 text-sm text-red-500">
      {children}
    </p>
  )
}

function formatDateTimeLocal(value: string) {
  const date = new Date(value)

  const offset = date.getTimezoneOffset()
  const localDate = new Date(
    date.getTime() - offset * 60 * 1000
  )

  return localDate
    .toISOString()
    .slice(0, 16)
}