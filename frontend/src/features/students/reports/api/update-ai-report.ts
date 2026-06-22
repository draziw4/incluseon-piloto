import { api } from "@/api/client"

import type { SavedAIReport } from "../types/saved-ai-report"

type UpdateAIReportParams = {
  reportId: number
  content: string
  expectedRevision: number
}

export async function updateAIReport({ reportId, content, expectedRevision }: UpdateAIReportParams) {
  const response = await api.patch<SavedAIReport>(
    `/ai-reports/${reportId}`,
    { content, expected_revision: expectedRevision }
  )

  return response.data
}
