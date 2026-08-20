import { z } from "zod"

export const studentProgressReportSchema = z.object({
  report_type: z.enum(["daily", "weekly"]),
  period_start: z.string().min(1, "Informe a data inicial"),
  period_end: z.string().min(1, "Informe a data final"),
  title: z.string().min(3, "Informe um título").max(255),
  summary: z.string().min(10, "A síntese deve ter pelo menos 10 caracteres").max(20_000),
  activities: z.string().max(20_000).optional(),
  participation_engagement: z.string().max(20_000).optional(),
  progress: z.string().max(20_000).optional(),
  difficulties: z.string().max(20_000).optional(),
  strategies_and_resources: z.string().max(20_000).optional(),
  communication_socialization: z.string().max(20_000).optional(),
  autonomy_functionality: z.string().max(20_000).optional(),
  family_school_notes: z.string().max(20_000).optional(),
  next_steps: z.string().max(20_000).optional(),
}).superRefine((data, context) => {
  const start = new Date(`${data.period_start}T00:00:00`)
  const end = new Date(`${data.period_end}T00:00:00`)
  const durationDays = Math.round((end.getTime() - start.getTime()) / 86_400_000)

  if (durationDays < 0) {
    context.addIssue({ code: "custom", path: ["period_end"], message: "A data final não pode ser anterior à inicial" })
  }
  if (data.report_type === "daily" && durationDays !== 0) {
    context.addIssue({ code: "custom", path: ["period_end"], message: "O relatório diário deve usar uma única data" })
  }
  if (data.report_type === "weekly" && durationDays > 6) {
    context.addIssue({ code: "custom", path: ["period_end"], message: "O período semanal deve ter no máximo sete dias" })
  }
})

export type StudentProgressReportFormData = z.input<typeof studentProgressReportSchema>
export type StudentProgressReportData = z.output<typeof studentProgressReportSchema>
