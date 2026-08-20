import { api } from "@/api/client"

import type { StudentProgressReportData } from "../schemas/student-progress-report-schema"
import type { StudentProgressReport, StudentProgressReportType } from "../types/student-progress-report"

export async function getStudentProgressReports(studentId: string, reportType?: StudentProgressReportType) {
  const response = await api.get<StudentProgressReport[]>(`/student-progress-reports/student/${studentId}`, {
    params: reportType ? { report_type: reportType } : undefined,
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
