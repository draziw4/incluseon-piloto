export type AppointmentType =
  | "aee"
  | "school_support"
  | "classroom_observation"
  | "family_meeting"
  | "pedagogical_meeting"
  | "behavioral_intervention"
  | "guidance"
  | "other"

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "canceled"
  | "pending"

export type AppointmentStudent = {
  id: number
  name: string
  age: number
  school_name?: string | null
}

export type AppointmentProfessional = {
  id: number
  name: string
  email: string
  role: string
}

export type Appointment = {
  id: number

  student_id: number
  professional_id: number

  appointment_type: AppointmentType
  status: AppointmentStatus

  scheduled_at: string

  objective?: string | null
  summary?: string | null
  observations?: string | null
  next_steps?: string | null

  created_at: string
  updated_at: string

  student?: AppointmentStudent | null
  professional?: AppointmentProfessional | null
}