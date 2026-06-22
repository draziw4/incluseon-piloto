import { api } from "@/api/client"

export async function downloadAIReport(reportId: number) {
  const response = await api.get<Blob>(
    `/ai-reports/${reportId}/download`,
    { responseType: "blob" }
  )

  return response.data
}
