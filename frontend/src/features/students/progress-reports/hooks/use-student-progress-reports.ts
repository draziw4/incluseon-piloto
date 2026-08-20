import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createStudentProgressReport,
  deleteStudentProgressReport,
  getStudentProgressReports,
  reviewStudentProgressReport,
  updateStudentProgressReport,
  type StudentProgressReportFilters,
} from "../api/student-progress-reports"
import type { StudentProgressReportData, StudentProgressReportReviewData } from "../schemas/student-progress-report-schema"

export function useStudentProgressReports(studentId: string, filters: StudentProgressReportFilters = {}) {
  return useQuery({
    queryKey: ["student-progress-reports", studentId, filters],
    queryFn: () => getStudentProgressReports(studentId, filters),
    enabled: Boolean(studentId),
  })
}

export function useStudentProgressReportMutations(studentId: string) {
  const queryClient = useQueryClient()
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["student-progress-reports", studentId] }),
    queryClient.invalidateQueries({ queryKey: ["student-timeline", studentId] }),
    queryClient.invalidateQueries({ queryKey: ["student-behavior-analytics", studentId] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
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
  const reviewMutation = useMutation({
    mutationFn: ({ reportId, data }: { reportId: number; data: StudentProgressReportReviewData }) =>
      reviewStudentProgressReport(studentId, reportId, data),
    onSuccess: invalidate,
  })

  return { createMutation, updateMutation, deleteMutation, reviewMutation }
}
