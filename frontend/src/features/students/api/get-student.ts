import { api } from "../../../api/client"

import type { Student } from "../types/student"

export async function getStudent(studentId: string) {
  const response = await api.get<Student>(
    `/students/${studentId}`
  )

  return response.data
}
