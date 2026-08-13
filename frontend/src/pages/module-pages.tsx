import { Activity, BarChart3, Brain, ClipboardList, FileText, Sparkles, Target } from "lucide-react"

import { ResourceHubPage } from "./resource-hub-page"
import { hasTool } from "@/features/auth/access"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function BehaviorRecordsPage() {
  const { user } = useAuth()
  const canEnterRecords = hasTool(user, "behavior_entry")

  return <ResourceHubPage title="Registros ABA" eyebrow="Acompanhamento comportamental" description={canEnterRecords ? "Registre antecedentes, comportamentos, consequências e estratégias utilizadas. Os registros pertencem ao contexto de um aluno, por isso a seleção acontece antes da edição." : "Acompanhe os registros inseridos pelos profissionais vinculados a cada aluno, sem alterar os dados de origem."} icon={Activity} tab="behavior" actionLabel={canEnterRecords ? "Ver e registrar" : "Acompanhar registros"} emptyHint="Escolha o aluno cujos registros comportamentais deseja acompanhar." />
}

export function AssessmentsPage() {
  return <ResourceHubPage title="Avaliações" eyebrow="Instrumentos e acompanhamento" description="Acesse avaliações cognitivas, pedagógicas e funcionais organizadas por aluno." icon={Brain} tab="assessments" actionLabel="Ver avaliações" emptyHint="Escolha um aluno para consultar ou preencher avaliações." />
}

export function InterviewsPage() {
  return <ResourceHubPage title="Entrevistas" eyebrow="Escuta e contexto" description="As entrevistas com responsáveis, estudantes e equipe escolar fazem parte do histórico de avaliações do aluno." icon={ClipboardList} tab="assessments" actionLabel="Ver entrevistas" emptyHint="Escolha um aluno para acessar suas entrevistas e avaliações." />
}

export function GoalsPage() {
  return <ResourceHubPage title="PEI e Metas" eyebrow="Plano individualizado" description="Organize objetivos, prazos, prioridades, progresso e evidências de evolução de cada aluno." icon={Target} tab="goals" actionLabel="Abrir PEI" emptyHint="Escolha o aluno para acompanhar seu plano individualizado." />
}

export function CaseStudiesPage() {
  return <ResourceHubPage title="Estudos de Caso IA" eyebrow="Apoio à análise profissional" description="Gere estudos de caso a partir dos dados já registrados. O conteúdo produzido por IA deve sempre passar por revisão profissional antes do uso." icon={Sparkles} tab="reports" actionLabel="Abrir estudos" emptyHint="Escolha o aluno para gerar ou consultar estudos de caso." />
}

export function ReportsPage() {
  return <ResourceHubPage title="Relatórios" eyebrow="Documentos e histórico" description="Consulte os relatórios gerados e seus documentos em PDF, sempre respeitando as permissões do vínculo profissional." icon={FileText} tab="reports" actionLabel="Ver relatórios" emptyHint="Escolha o aluno para acessar o histórico de relatórios." />
}

export function AnalyticsPage() {
  return <ResourceHubPage title="Analytics" eyebrow="Indicadores comportamentais" description="Visualize frequência, intensidade, ambientes recorrentes e efetividade das estratégias registradas." icon={BarChart3} tab="analytics" actionLabel="Ver análise" emptyHint="Escolha um aluno para analisar seus dados comportamentais." />
}
