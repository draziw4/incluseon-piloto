import { z } from "zod"

import { instrumentTypes } from "../instrument-definitions"

const answerSchema = z.union([z.string(), z.array(z.string())])

export const createAssessmentSchema = z.object({
  title: z.string().min(3, "O título precisa ter pelo menos 3 caracteres"),
  assessment_type: z.enum(instrumentTypes, {
    message: "Selecione um dos três instrumentais disponíveis",
  }),
  assessment_data: z.record(z.string(), answerSchema),
}).superRefine((data, context) => {
  const hasAnswer = Object.values(data.assessment_data).some((answer) =>
    Array.isArray(answer) ? answer.length > 0 : answer.trim().length > 0,
  )

  if (!hasAnswer) {
    context.addIssue({
      code: "custom",
      path: ["assessment_data"],
      message: "Preencha ao menos uma resposta do instrumental",
    })
  }
})

export type CreateAssessmentFormData = z.input<typeof createAssessmentSchema>
export type CreateAssessmentData = z.output<typeof createAssessmentSchema>
