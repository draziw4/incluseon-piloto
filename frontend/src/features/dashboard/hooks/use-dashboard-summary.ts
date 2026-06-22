import { useQuery } from "@tanstack/react-query"

import { getDashboardSummary } from "../api/get-dashboard-summary"

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    staleTime: 1000 * 60
  })
}
