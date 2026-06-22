export type DashboardMetrics = {
  students_count: number
  behavior_records_last_7_days: number
  assessments_count: number
  ai_reports_count: number
  appointments_today: number
  upcoming_appointments: number
}

export type DashboardReminder = {
  type: string
  title: string
  description: string
  to: string
  priority: "low" | "medium" | "high" | string
  due_at?: string | null
}

export type DashboardSummary = {
  metrics: DashboardMetrics
  reminders: DashboardReminder[]
}
