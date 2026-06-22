import type {
  AppointmentStatus,
  AppointmentType
} from "../types/appointment"

export const APPOINTMENT_TYPES: {
  value: AppointmentType
  label: string
}[] = [
  {
    value: "aee",
    label: "Atendimento AEE"
  },
  {
    value: "school_support",
    label: "Apoio escolar"
  },
  {
    value: "classroom_observation",
    label: "Observação em sala"
  },
  {
    value: "family_meeting",
    label: "Reunião com família"
  },
  {
    value: "pedagogical_meeting",
    label: "Reunião pedagógica"
  },
  {
    value: "behavioral_intervention",
    label: "Intervenção comportamental"
  },
  {
    value: "guidance",
    label: "Orientação"
  },
  {
    value: "other",
    label: "Outro"
  }
]

export const APPOINTMENT_STATUSES: {
  value: AppointmentStatus
  label: string
}[] = [
  {
    value: "scheduled",
    label: "Agendado"
  },
  {
    value: "completed",
    label: "Realizado"
  },
  {
    value: "pending",
    label: "Pendente"
  },
  {
    value: "canceled",
    label: "Cancelado"
  }
]

export function formatAppointmentType(
  type: AppointmentType
) {
  return (
    APPOINTMENT_TYPES.find(
      (item) => item.value === type
    )?.label || type
  )
}

export function formatAppointmentStatus(
  status: AppointmentStatus
) {
  return (
    APPOINTMENT_STATUSES.find(
      (item) => item.value === status
    )?.label || status
  )
}