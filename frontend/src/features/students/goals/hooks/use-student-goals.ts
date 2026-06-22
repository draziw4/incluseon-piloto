import { useQuery } from "@tanstack/react-query"

import { getStudentGoals } from "../api/get-student-goals"

export function useStudentGoals(studentId: string) {
  return useQuery({
    queryKey: ["student-goals", studentId],
    queryFn: () => getStudentGoals(studentId),
    enabled: !!studentId
  })
}
