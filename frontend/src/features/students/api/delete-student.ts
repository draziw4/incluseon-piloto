import { api } from "@/api/client"

export async function deleteStudent(studentId: number) {
  await api.delete(`/students/${studentId}`)
}
