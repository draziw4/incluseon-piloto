import { useQuery } from "@tanstack/react-query"

import {
  getAppointments
} from "../api/get-appointments"

import type {
  AppointmentStatus
} from "../types/appointment"

type Params = {
  status?: AppointmentStatus | ""
  search?: string
}

export function useAppointments({
  status = "",
  search = ""
}: Params = {}) {
  return useQuery({
    queryKey: [
      "appointments",
      {
        status,
        search
      }
    ],
    queryFn: () =>
      getAppointments({
        status,
        search
      })
  })
}