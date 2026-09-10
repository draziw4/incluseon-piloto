import type { Student } from "../types/student"

export type StudentFolder = {
  id: number
  owner_id: number
  name: string
  created_at: string
  can_manage: boolean
}

export type StudentFolderView = {
  key: string
  label: string
  description: string
  students: Student[]
  isCustom: boolean
  folderId?: number
  canManage: boolean
}
