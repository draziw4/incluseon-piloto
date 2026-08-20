import { api } from "@/api/client"

import type { AppNotification, NotificationList } from "../types/notification"

export async function getNotifications() {
  const response = await api.get<NotificationList>("/notifications", {
    params: { limit: 30 },
  })
  return response.data
}

export async function markNotificationAsRead(notificationId: number) {
  const response = await api.patch<AppNotification>(`/notifications/${notificationId}/read`)
  return response.data
}

export async function markAllNotificationsAsRead() {
  await api.patch("/notifications/read-all")
}
