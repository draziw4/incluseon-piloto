import { api } from "../../../api/client"

import type { PaginatedResponse } from "@/types/pagination"

import type { Student } from "../types/student"

type GetStudentsParams = {
  page?: number
  per_page?: number
  search?: string
}

export async function getStudents({
  page = 1,
  per_page = 10,
  search = ""
}: GetStudentsParams = {}) {
  const response = await api.get<PaginatedResponse<Student>>(
    "/students",
    {
      params: {
        page,
        per_page,
        search
      }
    }
  )

  return response.data
}
