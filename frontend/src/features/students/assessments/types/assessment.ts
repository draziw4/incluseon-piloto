export type Assessment = {
  id: number

  student_id: number
  psychologist_id: number | null

  title: string
  assessment_type: string

  assessment_data: Record<string, unknown>

  created_at: string
  updated_at: string
}
