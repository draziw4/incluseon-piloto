import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query"

import {
    updateAppointment
} from "../api/update-appointment"
export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAppointment,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments"]
      })
    }
  })
}