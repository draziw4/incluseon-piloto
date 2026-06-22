import { api } from "@/api/client"

type Params = {
  studentId: string
  goalId: number
}

export async function deleteStudentGoal({ studentId, goalId }: Params) {
  await api.delete(`/students/${studentId}/goals/${goalId}`)
}
