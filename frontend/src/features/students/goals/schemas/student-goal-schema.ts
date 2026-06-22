import { z } from "zod"

export const studentGoalSchema = z.object({
  title: z.string().min(3, "Informe uma meta com pelo menos 3 caracteres"),
  area: z.string().min(2, "Informe a área da meta"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed", "paused"]),
  priority: z.enum(["low", "medium", "high"]),
  target_date: z.string().optional(),
  progress: z.coerce.number().min(0, "Mínimo 0%").max(100, "Máximo 100%"),
  evidence_notes: z.string().optional()
})

export type StudentGoalFormData = z.input<typeof studentGoalSchema>
export type StudentGoalData = z.output<typeof studentGoalSchema>
