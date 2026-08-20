import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createBehaviorRecord } from "../api/create-behavior-record"

export function useCreateBehaviorRecord(studentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBehaviorRecord,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["behavior-records", studentId]
      })

      queryClient.invalidateQueries({
        queryKey: ["student", studentId]
      })

      queryClient.invalidateQueries({
        queryKey: ["student-behavior-analytics", studentId]
      })

      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary"]
      })
    }
  })
}
