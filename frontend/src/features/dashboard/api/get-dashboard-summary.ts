import { api } from "@/api/client"

import type { DashboardSummary } from "../types/dashboard-summary"

export async function getDashboardSummary() {
  const response = await api.get<DashboardSummary>("/dashboard/summary")

  return response.data
}
