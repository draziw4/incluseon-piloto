import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query"

import {
  deleteAppointment
} from "../api/delete-appointment"

export function useDeleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAppointment,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments"]
      })
    }
  })
}