export type Student = {
  id: number
  age: number | null
  psychologist_id: number

  name: string
  birth_date: string

  diagnosis?: string | null
  strengths?: string | null
  difficulties?: string | null
  takes_medication: boolean
  medications?: string | null
  school_name?: string | null
  school_grade?: string | null
  class_group?: string | null
  folder_id?: number | null

  guardian_name?: string | null
  guardian_phone?: string | null

  communication_notes?: string | null
  sensory_notes?: string | null
  general_observations?: string | null

  created_at: string
}
