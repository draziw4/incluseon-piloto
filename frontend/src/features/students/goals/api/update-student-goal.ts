import { api } from "@/api/client"

import { normalizeGoalData } from "./create-student-goal"
import type { StudentGoalData } from "../schemas/student-goal-schema"
import type { StudentGoal } from "../types/student-goal"

type Params = {
  studentId: string
  goalId: number
  data: StudentGoalData
}

export async function updateStudentGoal({ studentId, goalId, data }: Params) {
  const response = await api.patch<StudentGoal>(
    `/students/${studentId}/goals/${goalId}`,
    normalizeGoalData(data)
  )

  return response.data
}
