import { Activity, BarChart3, Brain, ClipboardList, FileText, Sparkles, Target } from "lucide-react"

import { ResourceHubPage } from "./resource-hub-page"
import { hasTool } from "@/features/auth/access"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function BehaviorRecordsPage() {
  const { user } = useAuth()
  const canEnterRecords = hasTool(user, "behavior_entry")
  const canCreateReports = user?.role === "admin" || user?.role === "aee" || user?.role === "support_professional"
  const canWorkWithReports = canEnterRecords || canCreateReports

  return <ResourceHubPage title="Relatórios" eyebrow="Acompanhamento do estudante" description={canWorkWithReports ? "Acesse relatórios detalhados do AEE, relatórios diários do PA e observações comportamentais vinculadas ao aluno." : "Acompanhe os relatórios do AEE e do PA inseridos pelos profissionais vinculados, sem alterar os dados de origem."} icon={Activity} tab="behavior" actionLabel={canWorkWithReports ? "Abrir relatórios" : "Acompanhar relatórios"} emptyHint="Escolha o aluno cujo histórico de acompanhamento deseja consultar." />
}

export function AssessmentsPage() {
  return <ResourceHubPage title="Avaliações" eyebrow="Instrumentos e acompanhamento" description="Acesse avaliações cognitivas, pedagógicas e funcionais organizadas por aluno." icon={Brain} tab="assessments" actionLabel="Ver avaliações" emptyHint="Escolha um aluno para consultar ou preencher avaliações." />
}

export function InterviewsPage() {
  return <ResourceHubPage title="Entrevistas" eyebrow="Escuta e contexto" description="As entrevistas com responsáveis, estudantes e equipe escolar fazem parte do histórico de avaliações do aluno." icon={ClipboardList} tab="assessments" actionLabel="Ver entrevistas" emptyHint="Escolha um aluno para acessar suas entrevistas e avaliações." />
}

export function GoalsPage() {
  return <ResourceHubPage title="PAEE e Metas" eyebrow="Plano de Atendimento Educacional Especializado" description="Elabore o PAEE com base no estudo de caso. Depois, o professor da sala regular poderá usar o PAEE como referência para produzir o PEI." icon={Target} tab="goals" actionLabel="Abrir PAEE" emptyHint="Escolha o aluno para acompanhar o Plano de AEE." />
}

export function CaseStudiesPage() {
  return <ResourceHubPage title="Estudos de Caso IA" eyebrow="Apoio à análise profissional" description="Gere estudos de caso a partir dos dados já registrados. O conteúdo produzido por IA deve sempre passar por revisão profissional antes do uso." icon={Sparkles} tab="reports" actionLabel="Abrir estudos" emptyHint="Escolha o aluno para gerar ou consultar estudos de caso." />
}

export function ReportsPage() {
  return <ResourceHubPage title="Histórico de Estudos" eyebrow="Documentos e histórico" description="Consulte os estudos de caso gerados e seus documentos em PDF, sempre respeitando as permissões do vínculo profissional." icon={FileText} tab="reports" actionLabel="Ver estudos" emptyHint="Escolha o aluno para acessar o histórico de estudos de caso." />
}

export function AnalyticsPage() {
  return <ResourceHubPage title="Métricas e análise" eyebrow="Indicadores integrados do acompanhamento" description="Acompanhe relatórios AEE e PA, evolução funcional, revisões, metas do PAEE e registros comportamentais." icon={BarChart3} tab="analytics" actionLabel="Ver análise" emptyHint="Escolha um aluno para analisar os dados do acompanhamento." />
}
