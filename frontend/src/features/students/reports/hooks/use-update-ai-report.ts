import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateAIReport } from "../api/update-ai-report"

export function useUpdateAIReport(studentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAIReport,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["student-ai-reports", studentId]
      })
    }
  })
}
