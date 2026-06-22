import { api } from "@/api/client"

import type { StudentGoal } from "../types/student-goal"

export async function getStudentGoals(studentId: string) {
  const response = await api.get<StudentGoal[]>(`/students/${studentId}/goals`)

  return response.data
}
