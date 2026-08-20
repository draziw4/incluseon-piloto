import type { ReactNode } from "react"

import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useStudentBehaviorAnalytics } from "../hooks/use-student-behavior-analytics"
import type { AnalyticsInsight, FieldCoverageItem, StudentBehaviorAnalytics } from "../types/student-behavior-analytics"

type Props = {
  studentId: string
}

const indicatorCards = [
  ["participation", "Participação", "envolvimento nas atividades"],
  ["autonomy", "Autonomia", "independência nas rotinas"],
  ["communication", "Comunicação", "comunicação funcional"],
  ["regulation", "Autorregulação", "regulação com autonomia"],
  ["support_need", "Necessidade de apoio", "1 baixa · 5 elevada"],
] as const

export function StudentAnalyticsPanel({ studentId }: Props) {
  const { data, isLoading, isError } = useStudentBehaviorAnalytics(studentId)

  if (isLoading) {
    return <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500 shadow-sm">Carregando métricas do acompanhamento...</div>
  }

  if (isError || !data) {
    return <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600 shadow-sm">Não foi possível carregar as métricas e análises do estudante.</div>
  }

  const reports = data.report_analytics
  const goals = data.goal_analytics

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">Acompanhamento integrado</p>
        <h2 className="mt-1 text-2xl font-bold text-blue-950">Métricas e análise para o AEE</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
          Indicadores produzidos a partir dos relatórios AEE e PA, avaliações do AEE, metas do PAEE e observações comportamentais estruturadas.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <AnalyticsSummaryCard
          icon={<ClipboardCheck size={20} />}
          title="Relatórios recentes"
          value={String(reports.reports_last_30_days)}
          description={`${reports.total_reports} no histórico completo`}
        />
        <AnalyticsSummaryCard
          icon={<ShieldCheck size={20} />}
          title="Revisão dos relatórios PA"
          value={reports.review_completion_rate !== null ? `${reports.review_completion_rate.toFixed(0)}%` : "-"}
          description={reports.support_reports ? `${reports.pending_reviews} pendente(s)` : "sem relatórios do PA"}
        />
        <AnalyticsSummaryCard
          icon={<TrendingUp size={20} />}
          title="Cobertura dos indicadores"
          value={`${reports.indicator_completion_rate.toFixed(0)}%`}
          description={`${reports.structured_reports} relatório(s) com escala`}
        />
        <AnalyticsSummaryCard
          icon={<Flag size={20} />}
          title="Progresso médio das metas"
          value={goals.average_progress !== null ? `${goals.average_progress.toFixed(0)}%` : "-"}
          description={goals.total_goals ? `${goals.total_goals} meta(s) · ${goals.overdue} vencida(s)` : "sem metas cadastradas"}
        />
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-blue-950">Insights para tomada de decisão</h3>
          <p className="mt-1 text-sm text-zinc-500">Leitura descritiva dos dados registrados, sem substituir a avaliação pedagógica do profissional.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.insights.map((insight) => <InsightCard key={`${insight.kind}-${insight.title}`} insight={insight} />)}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-blue-950">Evolução funcional</h3>
          <p className="mt-1 text-sm text-zinc-500">Escala de 1 a 5 preenchida nos relatórios. Compare períodos e registre evidências antes de concluir uma tendência.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {indicatorCards.map(([key, label, description]) => (
            <IndicatorAverageCard key={key} label={label} value={data.indicator_averages[key]} description={description} inverse={key === "support_need"} />
          ))}
        </div>

        <ChartCard title="Indicadores ao longo do tempo" description="Valores mais altos representam maior desenvolvimento, exceto necessidade de apoio, em que valores altos indicam maior suporte necessário." size="large">
          {data.indicator_evolution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.indicator_evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="participation" name="Participação" stroke="#2563eb" strokeWidth={2.5} connectNulls />
                <Line type="monotone" dataKey="autonomy" name="Autonomia" stroke="#059669" strokeWidth={2.5} connectNulls />
                <Line type="monotone" dataKey="communication" name="Comunicação" stroke="#7c3aed" strokeWidth={2.5} connectNulls />
                <Line type="monotone" dataKey="regulation" name="Autorregulação" stroke="#ea580c" strokeWidth={2.5} connectNulls />
                <Line type="monotone" dataKey="support_need" name="Necessidade de apoio" stroke="#e11d48" strokeWidth={2.5} strokeDasharray="6 4" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartMessage message="Os relatórios existentes continuam no histórico, mas ainda não possuem a nova escala. Preencha os indicadores nos próximos acompanhamentos para formar a linha de base." />
          )}
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-blue-950">Qualidade dos registros</h3>
          <p className="mt-1 text-sm text-zinc-500">Cobertura dos campos que sustentam a análise pedagógica.</p>
          <CoverageList items={data.field_coverage} />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-blue-950">Metas do PAEE</h3>
          <p className="mt-1 text-sm text-zinc-500">Situação das metas vinculadas ao acompanhamento.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <GoalStatus label="Não iniciadas" value={goals.not_started} tone="slate" />
            <GoalStatus label="Em andamento" value={goals.in_progress} tone="blue" />
            <GoalStatus label="Concluídas" value={goals.completed} tone="green" />
            <GoalStatus label="Pausadas" value={goals.paused} tone="amber" />
          </div>
          {goals.overdue > 0 && (
            <div className="mt-4 flex gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              {goals.overdue} meta(s) está(ão) com prazo vencido e precisa(m) ser revista(s).
            </div>
          )}
        </div>
      </section>

      <BehaviorAnalyticsSection data={data} />
    </div>
  )
}

function BehaviorAnalyticsSection({ data }: { data: StudentBehaviorAnalytics }) {
  if (data.records_count === 0) {
    return (
      <section className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
        <Info size={20} className="mt-0.5 shrink-0" />
        <div>
          <h3 className="font-bold">Análise comportamental específica ainda sem registros</h3>
          <p className="mt-1">As métricas de relatórios e metas acima já funcionam. Para analisar antecedentes, intensidade, ambientes e eficácia de estratégias, utilize também os registros comportamentais estruturados.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-blue-950">Análise comportamental complementar</h3>
        <p className="mt-1 text-sm text-zinc-500">Dados dos registros estruturados de antecedente, comportamento, consequência e intervenção.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <AnalyticsSummaryCard icon={<Activity size={20} />} title="Observações" value={String(data.records_count)} description="eventos registrados" />
        <AnalyticsSummaryCard icon={<BarChart3 size={20} />} title="Intensidade média" value={data.average_intensity !== null ? data.average_intensity.toFixed(1) : "-"} description="escala de 1 a 10" />
        <AnalyticsSummaryCard icon={<MapPin size={20} />} title="Ambiente recorrente" value={data.most_common_environment || "-"} description="mais frequente" />
        <AnalyticsSummaryCard icon={<Sparkles size={20} />} title="Estratégia eficaz" value={data.most_effective_strategy || "-"} description="mais recorrente" />
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <ChartCard title="Evolução da intensidade" description="Variação da intensidade ao longo do tempo.">
          {data.intensity_evolution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.intensity_evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="intensity" name="Intensidade" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChartMessage message="Não há intensidade suficiente para exibir a evolução." />}
        </ChartCard>

        <ChartCard title="Registros por ambiente" description="Locais com maior frequência de observações.">
          {data.environment_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.environment_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="environment" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" name="Registros" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChartMessage message="Não há ambientes suficientes para comparação." />}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <ChartCard title="Estratégias e eficácia" description="Respostas registradas para cada estratégia." size="large">
          <StrategyEffectivenessTable items={data.strategy_effectiveness} />
        </ChartCard>
        <ChartCard title="Comportamentos mais registrados" description="Frequência dos comportamentos observados." size="large">
          <RankingList items={data.behavior_frequency} labelKey="behavior" totalKey="total" emptyMessage="Não há comportamentos suficientes para comparação." />
        </ChartCard>
      </div>
    </section>
  )
}

function AnalyticsSummaryCard({ icon, title, value, description }: { icon: ReactNode; title: string; value: string; description: string }) {
  return (
    <div className="min-h-40 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</p>
      <h3 className="mt-2 line-clamp-2 text-2xl font-bold text-blue-950">{value}</h3>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </div>
  )
}

function InsightCard({ insight }: { insight: AnalyticsInsight }) {
  const styles = {
    positive: { box: "border-emerald-200 bg-emerald-50", icon: "text-emerald-700", Icon: CheckCircle2 },
    attention: { box: "border-amber-200 bg-amber-50", icon: "text-amber-700", Icon: TriangleAlert },
    info: { box: "border-blue-200 bg-blue-50", icon: "text-blue-700", Icon: Info },
  }[insight.kind]
  const Icon = styles.Icon

  return (
    <article className={["rounded-2xl border p-5", styles.box].join(" ")}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={["mt-0.5 shrink-0", styles.icon].join(" ")} />
        <div>
          <h4 className="font-bold text-slate-950">{insight.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">{insight.description}</p>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-900"><span className="font-bold">Próxima ação:</span> {insight.recommendation}</p>
        </div>
      </div>
    </article>
  )
}

function IndicatorAverageCard({ label, value, description, inverse = false }: { label: string; value: number | null; description: string; inverse?: boolean }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={["mt-2 text-2xl font-bold", inverse ? "text-rose-700" : "text-blue-950"].join(" ")}>{value !== null ? value.toFixed(1) : "-"}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
    </div>
  )
}

function CoverageList({ items }: { items: FieldCoverageItem[] }) {
  if (items.every((item) => item.total === 0)) return <p className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-zinc-600">Cadastre relatórios para avaliar a qualidade dos registros.</p>

  return (
    <div className="mt-5 space-y-4">
      {items.map((item) => (
        <div key={item.field}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="shrink-0 font-semibold text-blue-700">{item.percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-blue-50">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${item.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function GoalStatus({ label, value, tone }: { label: string; value: number; tone: "slate" | "blue" | "green" | "amber" }) {
  const colors = { slate: "bg-slate-50 text-slate-700", blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" }
  return <div className={["rounded-xl p-4", colors[tone]].join(" ")}><p className="text-sm font-medium">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>
}

function ChartCard({ title, description, children, size = "default" }: { title: string; description: string; children: ReactNode; size?: "default" | "large" }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4"><h3 className="font-bold text-blue-950">{title}</h3><p className="mt-1 text-sm text-zinc-500">{description}</p></div>
      <div className={size === "large" ? "min-h-96 w-full" : "h-80 w-full"}>{children}</div>
    </div>
  )
}

function RankingList({ items, labelKey, totalKey, emptyMessage }: { items: Record<string, string | number>[]; labelKey: string; totalKey: string; emptyMessage: string }) {
  if (!items.length) return <EmptyChartMessage message={emptyMessage} />
  const maxTotal = Math.max(...items.map((item) => Number(item[totalKey])))
  const totalSum = items.reduce((sum, item) => sum + Number(item[totalKey]), 0)

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const label = String(item[labelKey])
        const total = Number(item[totalKey])
        const percentage = totalSum ? Math.round(total / totalSum * 100) : 0
        return (
          <div key={label} className="space-y-2">
            <div className="flex items-center justify-between gap-3"><span className="line-clamp-1 text-sm font-medium text-blue-950">{label}</span><span className="shrink-0 text-sm font-semibold text-zinc-500">{total}x · {percentage}%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-blue-50"><div className="h-full rounded-full bg-blue-600" style={{ width: `${maxTotal ? total / maxTotal * 100 : 0}%` }} /></div>
          </div>
        )
      })}
    </div>
  )
}

function StrategyEffectivenessTable({ items }: { items: { strategy: string; effective: number; not_effective: number }[] }) {
  if (!items.length) return <EmptyChartMessage message="Ainda não há dados suficientes para comparar as estratégias." />

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const total = item.effective + item.not_effective
        const successRate = total ? Math.round(item.effective / total * 100) : 0
        return (
          <div key={item.strategy} className="rounded-2xl border border-blue-50 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3"><div><h4 className="font-bold text-blue-950">{item.strategy}</h4><p className="text-sm text-zinc-500">Usada {total} vez{total === 1 ? "" : "es"}</p></div><span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">{successRate}% eficaz</span></div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-red-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${successRate}%` }} /></div>
          </div>
        )
      })}
    </div>
  )
}

function EmptyChartMessage({ message }: { message: string }) {
  return <div className="flex h-full min-h-72 items-center justify-center rounded-xl bg-blue-50/50 p-6 text-center"><p className="max-w-lg text-sm leading-6 text-zinc-500">{message}</p></div>
}
