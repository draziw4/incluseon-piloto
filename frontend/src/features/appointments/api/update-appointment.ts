import { api } from "../../../api/client"

import type {
  Appointment
} from "../types/appointment"

import type {
  CreateAppointmentData
} from "../schemas/create-appointment-schema"

type UpdateAppointmentParams = {
  appointmentId: number
  data: Partial<CreateAppointmentData>
}

export async function updateAppointment({
  appointmentId,
  data
}: UpdateAppointmentParams) {
  const response = await api.patch<Appointment>(
    `/appointments/${appointmentId}`,
    data
  )

  return response.data
}