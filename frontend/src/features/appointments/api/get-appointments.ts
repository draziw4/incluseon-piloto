import { api } from "../../../api/client"

import type {
  Appointment,
  AppointmentStatus
} from "../types/appointment"

type GetAppointmentsParams = {
  status?: AppointmentStatus | ""
  search?: string
}

export async function getAppointments({
  status = "",
  search = ""
}: GetAppointmentsParams = {}) {
  const response = await api.get<Appointment[]>(
    "/appointments",
    {
      params: {
        status: status || undefined,
        search: search || undefined
      }
    }
  )

  return response.data
}