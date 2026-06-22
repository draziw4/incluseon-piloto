import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteStudentGoal } from "../api/delete-student-goal"

export function useDeleteStudentGoal(studentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteStudentGoal,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student-goals", studentId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      ])
    }
  })
}
