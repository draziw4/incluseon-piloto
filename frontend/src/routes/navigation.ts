import {
  Activity,
  BarChart3,
  Brain,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  Target,
  UserCheck,
  Users,
  type LucideIcon
} from "lucide-react"
import { isPilotMode } from "@/config/pilot"
import type { ToolAccess } from "@/features/auth/access"

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
  tool: ToolAccess
}

export const navigationItems: NavigationItem[] = [
  { label: "Painel", path: "/", icon: LayoutDashboard, tool: "dashboard" },
  { label: "Meus Alunos", path: "/students", icon: Users, tool: "students" },
  { label: "Atendimentos", path: "/appointments", icon: CalendarDays, tool: "appointments" },
  { label: "Registros ABA", path: "/behavior-records", icon: Activity, tool: "behavior_records" },
  { label: "Avaliações", path: "/assessments", icon: Brain, tool: "assessments" },
  { label: "Entrevistas", path: "/interviews", icon: ClipboardList, tool: "interviews" },
  { label: "PEI e Metas", path: "/goals", icon: Target, tool: "goals" },
  { label: "Estudos de Caso IA", path: "/case-studies", icon: Sparkles, tool: "ai_case_studies" },
  { label: "Relatórios", path: "/reports", icon: FileText, tool: "reports" },
  { label: "Analytics", path: "/analytics", icon: BarChart3, tool: "analytics" },
  { label: "Profissionais", path: "/admin/professionals", icon: UserCheck, tool: "admin_professionals" },
  ...(isPilotMode
    ? [{ label: "Feedback do piloto", path: "/pilot-feedback", icon: MessageSquareText, tool: "pilot_feedback" as ToolAccess }]
    : [])
]

export function getNavigationTitle(pathname: string) {
  const matchingItem = [...navigationItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) =>
      item.path === "/"
        ? pathname === "/"
        : pathname === item.path || pathname.startsWith(`${item.path}/`)
    )

  if (pathname.startsWith("/students/")) return "Perfil do aluno"
  if (pathname === "/settings") return "Configurações"
  if (pathname === "/pilot-feedback") return "Feedback do piloto"
  if (pathname === "/admin/professionals") return "Profissionais"

  return matchingItem?.label ?? "IncluseON"
}
