import { api } from "@/api/client"

import type { CreateStudentData } from "../schemas/create-student-schema"
import type { Student } from "../types/student"

type UpdateStudentParams = {
  studentId: number
  data: CreateStudentData
}

export async function updateStudent({ studentId, data }: UpdateStudentParams) {
  const response = await api.patch<Student>(`/students/${studentId}`, data)

  return response.data
}
