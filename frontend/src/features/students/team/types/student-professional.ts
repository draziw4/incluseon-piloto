export type StudentProfessionalRole =
  | "owner"
  | "aee"
  | "support"
  | "psychologist"
  | "supervisor"
  | "viewer"

export type LinkedUser = {
  id: number
  name: string
  email: string
  role: string
  allowed_tools: string[]
}

export type StudentProfessional = {
  id: number
  student_id: number
  user_id: number
  role_in_student: StudentProfessionalRole

  can_view: boolean
  can_register_aba: boolean
  can_create_assessment: boolean
  can_create_pei: boolean
  can_generate_ai_report: boolean
  can_view_reports: boolean

  user?: LinkedUser | null
}
