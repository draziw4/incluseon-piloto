import { api } from "@/api/client"

import type { StudentFolder } from "./types"


export async function getStudentFolders() {
  const response = await api.get<StudentFolder[]>("/student-folders")
  return response.data
}

export async function createStudentFolder(name: string) {
  const response = await api.post<StudentFolder>("/student-folders", { name })
  return response.data
}

export async function renameStudentFolder(folderId: number, name: string) {
  const response = await api.patch<StudentFolder>(`/student-folders/${folderId}`, { name })
  return response.data
}

export async function deleteStudentFolder(folderId: number) {
  await api.delete(`/student-folders/${folderId}`)
}
