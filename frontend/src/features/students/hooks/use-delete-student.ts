import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteStudent } from "../api/delete-student"

export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: async (_, studentId) => {
      queryClient.removeQueries({
        queryKey: ["student", String(studentId)]
      })

      await queryClient.invalidateQueries({
        queryKey: ["students"]
      })
    }
  })
}
