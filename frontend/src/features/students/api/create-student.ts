import { api } from "../../../api/client"

import type { CreateStudentData } from "../schemas/create-student-schema"
import type { Student } from "../types/student"

export async function createStudent(data: CreateStudentData) {
  const response = await api.post<Student>("/students", data)

  return response.data
}
