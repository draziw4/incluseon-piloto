import { z } from "zod"

export const createAppointmentSchema = z.object({
  student_id: z.coerce
    .number()
    .min(1, "Selecione um aluno"),

  appointment_type: z.enum([
    "aee",
    "school_support",
    "classroom_observation",
    "family_meeting",
    "pedagogical_meeting",
    "behavioral_intervention",
    "guidance",
    "other"
  ], {
    message: "Selecione o tipo de atendimento"
  }),

  scheduled_at: z
    .string()
    .min(1, "Informe a data e hora do atendimento"),

  status: z.enum([
    "scheduled",
    "completed",
    "canceled",
    "pending"
  ]),

  objective: z.string().optional(),
  summary: z.string().optional(),
  observations: z.string().optional(),
  next_steps: z.string().optional()
})

export type CreateAppointmentFormData =
  z.input<typeof createAppointmentSchema>

export type CreateAppointmentData =
  z.output<typeof createAppointmentSchema>