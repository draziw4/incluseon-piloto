import { api } from "@/api/client"

import type { StudentProgressReportData, StudentProgressReportReviewData } from "../schemas/student-progress-report-schema"
import type { StudentProgressProfessionalType, StudentProgressReport, StudentProgressReportType, StudentProgressReviewStatus } from "../types/student-progress-report"

export type StudentProgressReportFilters = {
  reportType?: StudentProgressReportType
  professionalType?: StudentProgressProfessionalType
  reviewStatus?: StudentProgressReviewStatus
}

export async function getStudentProgressReports(studentId: string, filters: StudentProgressReportFilters = {}) {
  const response = await api.get<StudentProgressReport[]>(`/student-progress-reports/student/${studentId}`, {
    params: {
      report_type: filters.reportType,
      professional_type: filters.professionalType,
      review_status: filters.reviewStatus,
    },
  })
  return response.data
}

export async function createStudentProgressReport(studentId: string, data: StudentProgressReportData) {
  const response = await api.post<StudentProgressReport>(`/student-progress-reports/student/${studentId}`, data)
  return response.data
}

export async function updateStudentProgressReport(studentId: string, reportId: number, data: StudentProgressReportData) {
  const response = await api.patch<StudentProgressReport>(`/student-progress-reports/student/${studentId}/${reportId}`, data)
  return response.data
}

export async function deleteStudentProgressReport(studentId: string, reportId: number) {
  await api.delete(`/student-progress-reports/student/${studentId}/${reportId}`)
}

export async function reviewStudentProgressReport(studentId: string, reportId: number, data: StudentProgressReportReviewData) {
  const response = await api.patch<StudentProgressReport>(`/student-progress-reports/student/${studentId}/${reportId}/review`, data)
  return response.data
}
