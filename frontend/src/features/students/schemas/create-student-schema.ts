import { z } from "zod"

export const createStudentSchema = z.object({
  name: z.string().min(3, "Nome precisa ter pelo menos 3 caracteres"),

  birth_date: z
    .string()
    .min(1, "Data de nascimento é obrigatória")
    .refine(
      (value) => new Date(`${value}T00:00:00`) <= new Date(),
      "Data de nascimento não pode estar no futuro"
    ),

  diagnosis: z.string().optional(),
  strengths: z.string().optional(),
  difficulties: z.string().optional(),
  takes_medication: z.boolean(),
  medications: z.string().optional(),
  school_name: z.string().optional(),

  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),

  communication_notes: z.string().optional(),
  sensory_notes: z.string().optional(),
  general_observations: z.string().optional()
}).superRefine((data, context) => {
  if (data.takes_medication && !data.medications?.trim()) {
    context.addIssue({
      code: "custom",
      path: ["medications"],
      message: "Informe quais medicamentos o aluno utiliza"
    })
  }
})

export type CreateStudentFormData = z.input<typeof createStudentSchema>

export type CreateStudentData = z.output<typeof createStudentSchema>
