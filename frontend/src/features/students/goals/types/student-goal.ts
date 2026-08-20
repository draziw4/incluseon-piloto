export type StudentGoalStatus = "not_started" | "in_progress" | "completed" | "paused"
export type StudentGoalPriority = "low" | "medium" | "high"

export type StudentGoal = {
  id: number
  student_id: number
  created_by_id: number | null
  title: string
  description?: string | null
  area: string
  status: StudentGoalStatus
  priority: StudentGoalPriority
  target_date?: string | null
  progress: number
  evidence_notes?: string | null
  created_at: string
  updated_at: string
}
