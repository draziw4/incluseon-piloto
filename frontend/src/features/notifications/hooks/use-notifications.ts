import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notifications"

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  })
}

export function useNotificationMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] })

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: invalidate,
  })
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: invalidate,
  })

  return { markReadMutation, markAllReadMutation }
}
