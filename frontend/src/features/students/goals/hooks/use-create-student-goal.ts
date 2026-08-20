import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createStudentGoal } from "../api/create-student-goal"

export function useCreateStudentGoal(studentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createStudentGoal,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student-goals", studentId] }),
        queryClient.invalidateQueries({ queryKey: ["student-behavior-analytics", studentId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      ])
    }
  })
}
