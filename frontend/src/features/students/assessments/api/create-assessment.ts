import { api } from "../../../../api/client"

import type { Assessment } from "../types/assessment"
import type { CreateAssessmentData } from "../schemas/create-assessment-schema"

type CreateAssessmentParams = {
  studentId: string
  data: CreateAssessmentData
}

export async function createAssessment({
  studentId,
  data
}: CreateAssessmentParams) {
  const response = await api.post<Assessment>(
    `/assessments/student/${studentId}`,
    data
  )

  return response.data
}
