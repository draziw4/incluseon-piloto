import type { User } from "./types/user"

export type ToolAccess =
  | "dashboard"
  | "students"
  | "student_management"
  | "appointments"
  | "behavior_records"
  | "behavior_entry"
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
  aee: "AEE — Atendimento Educacional Especializado",
  support_professional: "PA — Profissional de apoio",
  school: "Equipe escolar",
  guardian: "Responsável",
}

export const permissionLevelLabels: Record<string, string> = {
  admin: "Administrador",
  psychologist: "Psicólogo",
  supervisor: "Supervisor",
  aee: "AEE",
  support_professional: "PA",
  school: "Equipe escolar",
  guardian: "Responsável",
}

export const roleDescriptions: Record<string, string> = {
  admin: "Administra profissionais, perfis, permissões e todos os recursos do sistema.",
  psychologist: "Realiza avaliações, registros técnicos, planos e relatórios dos alunos vinculados.",
  supervisor: "Supervisiona o acompanhamento e acessa os recursos técnicos dos alunos vinculados.",
  aee: "Cadastra alunos, vincula a equipe, acompanha os registros e consolida relatórios.",
  support_professional: "Registra o acompanhamento cotidiano dos alunos aos quais foi vinculado.",
  school: "Consulta informações escolares autorizadas dos alunos vinculados.",
  guardian: "Consulta informações autorizadas do aluno sob sua responsabilidade.",
}

export const toolLabels: Record<ToolAccess, string> = {
  dashboard: "Painel",
  students: "Visualizar alunos vinculados",
  student_management: "Cadastrar, editar e excluir alunos",
  appointments: "Atendimentos",
  behavior_records: "Consultar registros de acompanhamento",
  behavior_entry: "Criar e atualizar registros de acompanhamento",
  assessments: "Avaliações",
  interviews: "Entrevistas",
  timeline: "Timeline clínica integrada",
  goals: "PAEE e metas",
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
