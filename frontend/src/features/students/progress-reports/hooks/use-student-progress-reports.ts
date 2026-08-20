import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createStudentProgressReport,
  deleteStudentProgressReport,
  getStudentProgressReports,
  updateStudentProgressReport,
} from "../api/student-progress-reports"
import type { StudentProgressReportData } from "../schemas/student-progress-report-schema"
import type { StudentProgressReportType } from "../types/student-progress-report"

export function useStudentProgressReports(studentId: string, reportType?: StudentProgressReportType) {
  return useQuery({
    queryKey: ["student-progress-reports", studentId, reportType ?? "all"],
    queryFn: () => getStudentProgressReports(studentId, reportType),
    enabled: Boolean(studentId),
  })
}

export function useStudentProgressReportMutations(studentId: string) {
  const queryClient = useQueryClient()
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["student-progress-reports", studentId] }),
    queryClient.invalidateQueries({ queryKey: ["student-timeline", studentId] }),
  ])

  const createMutation = useMutation({
    mutationFn: (data: StudentProgressReportData) => createStudentProgressReport(studentId, data),
    onSuccess: invalidate,
  })
  const updateMutation = useMutation({
    mutationFn: ({ reportId, data }: { reportId: number; data: StudentProgressReportData }) =>
      updateStudentProgressReport(studentId, reportId, data),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({
    mutationFn: (reportId: number) => deleteStudentProgressReport(studentId, reportId),
    onSuccess: invalidate,
  })

  return { createMutation, updateMutation, deleteMutation }
}
