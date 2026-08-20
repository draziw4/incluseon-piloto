export type StudentProgressReportType = "daily" | "weekly"
export type StudentProgressProfessionalType = "aee" | "support"
export type StudentProgressReviewStatus = "pending" | "reviewed" | "needs_adjustment"

export type StudentProgressReport = {
  id: number
  student_id: number
  created_by_id: number | null
  created_by_name: string | null
  created_by_role: string | null
  professional_type: StudentProgressProfessionalType
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
  review_status: StudentProgressReviewStatus | null
  review_notes: string | null
  reviewed_by_id: number | null
  reviewed_by_name: string | null
  reviewed_by_role: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}
