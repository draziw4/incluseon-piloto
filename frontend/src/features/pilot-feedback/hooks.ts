import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createPilotFeedback,
  listPilotFeedback,
  updatePilotFeedback
} from "./api"


const feedbackQueryKey = ["pilot-feedback"]

export function usePilotFeedback() {
  return useQuery({
    queryKey: feedbackQueryKey,
    queryFn: listPilotFeedback
  })
}

export function useCreatePilotFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPilotFeedback,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feedbackQueryKey })
  })
}

export function useUpdatePilotFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; status: Parameters<typeof updatePilotFeedback>[1]["status"]; admin_note?: string }) =>
      updatePilotFeedback(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feedbackQueryKey })
  })
}
