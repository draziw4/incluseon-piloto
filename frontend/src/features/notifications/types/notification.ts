export type AppNotification = {
  id: number
  event_type: string
  title: string
  message: string
  student_id: number | null
  resource_type: string | null
  resource_id: number | null
  action_url: string | null
  read_at: string | null
  created_at: string
}

export type NotificationList = {
  items: AppNotification[]
  unread_count: number
}
