import { api } from "@/api/client"

import type { StudentGoalData } from "../schemas/student-goal-schema"
import type { StudentGoal } from "../types/student-goal"

type Params = {
  studentId: string
  data: StudentGoalData
}

export async function createStudentGoal({ studentId, data }: Params) {
  const response = await api.post<StudentGoal>(`/students/${studentId}/goals`, normalizeGoalData(data))

  return response.data
}

export function normalizeGoalData(data: StudentGoalData) {
  return {
    ...data,
    target_date: data.target_date || null,
    description: data.description || null,
    evidence_notes: data.evidence_notes || null
  }
}
