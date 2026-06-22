import { api } from "../../../api/client"

import type {
  Appointment
} from "../types/appointment"

import type {
  CreateAppointmentData
} from "../schemas/create-appointment-schema"

export async function createAppointment(
  data: CreateAppointmentData
) {
  const response = await api.post<Appointment>(
    "/appointments",
    data
  )

  return response.data
}