import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateStudentGoal } from "../api/update-student-goal"

export function useUpdateStudentGoal(studentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateStudentGoal,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student-goals", studentId] }),
        queryClient.invalidateQueries({ queryKey: ["student-behavior-analytics", studentId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      ])
    }
  })
}
