import { api } from "../../../api/client"

export async function deleteAppointment(
  appointmentId: number
) {
  await api.delete(
    `/appointments/${appointmentId}`
  )
}