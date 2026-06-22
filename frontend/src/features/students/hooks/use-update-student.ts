import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateStudent } from "../api/update-student"

export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateStudent,
    onSuccess: async (student) => {
      queryClient.setQueryData(
        ["student", String(student.id)],
        student
      )

      await queryClient.invalidateQueries({
        queryKey: ["students"]
      })
    }
  })
}
