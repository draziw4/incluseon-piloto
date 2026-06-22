import {
  Activity,
  BarChart3,
  Brain,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Sparkles,
  Target,
  Users,
  type LucideIcon
} from "lucide-react"

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  { label: "Painel", path: "/", icon: LayoutDashboard },
  { label: "Meus Alunos", path: "/students", icon: Users },
  { label: "Atendimentos", path: "/appointments", icon: CalendarDays },
  { label: "Registros ABA", path: "/behavior-records", icon: Activity },
  { label: "Avaliações", path: "/assessments", icon: Brain },
  { label: "Entrevistas", path: "/interviews", icon: ClipboardList },
  { label: "PEI e Metas", path: "/goals", icon: Target },
  { label: "Estudos de Caso IA", path: "/case-studies", icon: Sparkles },
  { label: "Relatórios", path: "/reports", icon: FileText },
  { label: "Analytics", path: "/analytics", icon: BarChart3 }
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

  return matchingItem?.label ?? "IncluseON"
}
