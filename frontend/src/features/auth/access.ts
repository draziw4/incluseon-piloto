import type { User } from "./types/user"

export type ToolAccess =
  | "dashboard"
  | "students"
  | "student_management"
  | "appointments"
  | "behavior_records"
  | "assessments"
  | "interviews"
  | "timeline"
  | "goals"
  | "ai_case_studies"
  | "reports"
  | "analytics"
  | "team_management"
  | "pilot_feedback"
  | "admin_professionals"

export const roleLabels: Record<string, string> = {
  admin: "Administrador",
  psychologist: "Psicólogo(a)",
  supervisor: "Supervisor(a)",
  aee: "Profissional de AEE",
  support_professional: "Profissional de apoio",
  school: "Equipe escolar",
  guardian: "Responsável",
}

export const toolLabels: Record<ToolAccess, string> = {
  dashboard: "Painel",
  students: "Visualizar alunos vinculados",
  student_management: "Cadastrar, editar e excluir alunos",
  appointments: "Atendimentos",
  behavior_records: "Registros ABA",
  assessments: "Avaliações",
  interviews: "Entrevistas",
  timeline: "Timeline clínica integrada",
  goals: "PEI e metas",
  ai_case_studies: "Estudos de caso com IA",
  reports: "Relatórios",
  analytics: "Análises",
  team_management: "Gerenciar equipe e permissões",
  pilot_feedback: "Feedback do piloto",
  admin_professionals: "Aprovar profissionais",
}

export function hasTool(user: User | null | undefined, tool: ToolAccess) {
  return user?.allowed_tools.includes(tool) === true
}
