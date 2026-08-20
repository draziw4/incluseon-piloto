export type StudentProgressReportType = "daily" | "weekly"

export type StudentProgressReport = {
  id: number
  student_id: number
  created_by_id: number | null
  created_by_name: string | null
  created_by_role: string | null
  report_type: StudentProgressReportType
  period_start: string
  period_end: string
  title: string
  summary: string
  activities: string | null
  participation_engagement: string | null
  progress: string | null
  difficulties: string | null
  strategies_and_resources: string | null
  communication_socialization: string | null
  autonomy_functionality: string | null
  family_school_notes: string | null
  next_steps: string | null
  created_at: string
  updated_at: string
}
