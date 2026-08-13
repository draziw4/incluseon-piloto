import type { ToolAccess } from "@/features/auth/access"

import type { StudentProfessionalRole } from "./types/student-professional"

export type StudentPermissionKey =
  | "can_view"
  | "can_register_aba"
  | "can_create_assessment"
  | "can_create_pei"
  | "can_generate_ai_report"
  | "can_view_reports"

export const studentPermissionTools: Record<StudentPermissionKey, ToolAccess> = {
  can_view: "students",
  can_register_aba: "behavior_entry",
  can_create_assessment: "assessments",
  can_create_pei: "goals",
  can_generate_ai_report: "ai_case_studies",
  can_view_reports: "reports",
}

const rolePresets: Record<StudentProfessionalRole, Record<StudentPermissionKey, boolean>> = {
  owner: { can_view: true, can_register_aba: true, can_create_assessment: true, can_create_pei: true, can_generate_ai_report: true, can_view_reports: true },
  psychologist: { can_view: true, can_register_aba: true, can_create_assessment: true, can_create_pei: true, can_generate_ai_report: true, can_view_reports: true },
  supervisor: { can_view: true, can_register_aba: true, can_create_assessment: true, can_create_pei: true, can_generate_ai_report: true, can_view_reports: true },
  aee: { can_view: true, can_register_aba: false, can_create_assessment: true, can_create_pei: true, can_generate_ai_report: true, can_view_reports: true },
  support: { can_view: true, can_register_aba: true, can_create_assessment: false, can_create_pei: false, can_generate_ai_report: false, can_view_reports: false },
  viewer: { can_view: true, can_register_aba: false, can_create_assessment: false, can_create_pei: false, can_generate_ai_report: false, can_view_reports: false },
}

export function isStudentPermissionAllowed(allowedTools: string[] | undefined, permission: StudentPermissionKey) {
  return allowedTools?.includes(studentPermissionTools[permission]) === true
}

export function getStudentRolePreset(role: StudentProfessionalRole, allowedTools: string[] | undefined) {
  return Object.fromEntries(
    (Object.keys(studentPermissionTools) as StudentPermissionKey[]).map((permission) => [
      permission,
      rolePresets[role][permission] && isStudentPermissionAllowed(allowedTools, permission),
    ]),
  ) as Record<StudentPermissionKey, boolean>
}
