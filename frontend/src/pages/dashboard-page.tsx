import {
  Users,
  Brain,
  Activity,
  FileText,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { Link } from "react-router-dom"

import { useStudents } from "@/features/students/hooks/use-students"
import { useDashboardSummary } from "@/features/dashboard/hooks/use-dashboard-summary"
import type { DashboardReminder } from "@/features/dashboard/types/dashboard-summary"
import { hasTool } from "@/features/auth/access"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function DashboardPage() {
  const { user } = useAuth()
  const {
    data: studentsData,
    isLoading: isLoadingStudents
  } = useStudents({
    page: 1,
    per_page: 5
  })
  const {
    data: dashboardSummary,
    isLoading: isLoadingDashboard,
    isError: isDashboardError
  } = useDashboardSummary()

  const totalStudents = studentsData?.total ?? 0
  const recentStudents = studentsData?.items ?? []
  const metrics = dashboardSummary?.metrics

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Sparkles size={22} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-blue-950">
              Bem-vindo ao IncluseON
            </h1>

            <p className="text-sm text-blue-700">
              Acompanhe seus alunos e utilize as ferramentas liberadas para seu perfil.
            </p>
          </div>
        </div>

        {hasTool(user, "ai_case_studies") ? <Link to="/case-studies" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Gerar estudo de caso IA
        </Link> : null}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Alunos ativos"
          value={isLoadingStudents ? "..." : String(totalStudents)}
          subtitle="alunos cadastrados"
          icon={<Users size={22} />}
        />

        {hasTool(user, "behavior_records") ? <DashboardCard
          title="Registros ABA"
          value={isLoadingDashboard ? "..." : String(metrics?.behavior_records_last_7_days ?? 0)}
          subtitle="nos últimos 7 dias"
          icon={<Activity size={22} />}
        /> : null}

        {hasTool(user, "assessments") ? <DashboardCard
          title="Avaliações"
          value={isLoadingDashboard ? "..." : String(metrics?.assessments_count ?? 0)}
          subtitle="instrumentos preenchidos"
          icon={<Brain size={22} />}
        /> : null}

        {hasTool(user, "reports") ? <DashboardCard
          title="Relatórios IA"
          value={isLoadingDashboard ? "..." : String(metrics?.ai_reports_count ?? 0)}
          subtitle="estudos de caso gerados"
          icon={<FileText size={22} />}
        /> : null}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-blue-950">
              Pendências profissionais
            </h2>

            <span className="text-sm font-medium text-blue-600">
              {dashboardSummary?.reminders.length ?? 0} item(ns)
            </span>
          </div>

          {isLoadingDashboard ? (
            <p className="text-sm text-zinc-500">Carregando pendências...</p>
          ) : isDashboardError ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              Não foi possível carregar o resumo profissional.
            </div>
          ) : dashboardSummary && dashboardSummary.reminders.length > 0 ? (
            <div className="space-y-4">
              {dashboardSummary.reminders.map((reminder, index) => (
                <ReminderItem key={`${reminder.type}-${index}`} reminder={reminder} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-blue-50/60 p-6 text-center">
              <CheckCircle2 size={28} className="text-emerald-600" />
              <h3 className="mt-3 font-bold text-blue-950">Tudo em dia</h3>
              <p className="mt-1 max-w-md text-sm text-zinc-500">
                Não encontramos pendências urgentes para seus alunos acompanhados.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-blue-950">
            Ações rápidas
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {hasTool(user, "student_management") ? <QuickAction
              icon={<Users size={20} />}
              title="Novo aluno"
              subtitle="Cadastrar"
              color="bg-blue-50 text-blue-700"
              to="/students"
            /> : null}

            {hasTool(user, "behavior_records") ? <QuickAction
              icon={<Activity size={20} />}
              title={hasTool(user, "behavior_entry") ? "Registro ABA" : "Acompanhamento"}
              subtitle={hasTool(user, "behavior_entry") ? "Nova ocorrência" : "Consultar registros"}
              color="bg-emerald-50 text-emerald-700"
              to="/behavior-records"
            /> : null}

            {hasTool(user, "assessments") ? <QuickAction
              icon={<Brain size={20} />}
              title="Avaliação"
              subtitle="Instrumento"
              color="bg-purple-50 text-purple-700"
              to="/assessments"
            /> : null}

            {hasTool(user, "appointments") ? <QuickAction
              icon={<Calendar size={20} />}
              title="Agenda"
              subtitle="Atendimento"
              color="bg-orange-50 text-orange-700"
              to="/appointments"
            /> : null}
          </div>
        </div>
      </section>

      {hasTool(user, "appointments") ? <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DashboardCard
          title="Atendimentos hoje"
          value={isLoadingDashboard ? "..." : String(metrics?.appointments_today ?? 0)}
          subtitle="agendados ou pendentes"
          icon={<Calendar size={22} />}
        />

        <DashboardCard
          title="Próximos 7 dias"
          value={isLoadingDashboard ? "..." : String(metrics?.upcoming_appointments ?? 0)}
          subtitle="atendimentos futuros"
          icon={<AlertCircle size={22} />}
        />
      </section> : null}

      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-blue-950">
            Meus alunos
          </h2>

          <Link
            to="/students"
            className="text-sm font-medium text-blue-600"
          >
            Ver todos →
          </Link>
        </div>

        {isLoadingStudents ? (
          <p className="text-sm text-zinc-500">
            Carregando alunos...
          </p>
        ) : recentStudents.length > 0 ? (
          <div className="space-y-3">
            {recentStudents.map((student) => (
              <Link
                key={student.id}
                to={`/students/${student.id}`}
                className="flex items-center justify-between rounded-xl border border-blue-100 p-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div>
                  <h3 className="font-semibold text-blue-950">
                    {student.name}
                  </h3>

                  <p className="text-sm text-zinc-500">
                    {student.diagnosis || "Sem diagnóstico"} •{" "}
                    {student.school_name || "Sem escola informada"}
                  </p>
                </div>

                <span className="text-sm font-medium text-blue-600">
                  Abrir →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Users size={24} />
            </div>

            <p className="text-sm text-zinc-500">
              Nenhum aluno cadastrado ainda.
            </p>

            {hasTool(user, "student_management") ? <Link
              to="/students"
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Cadastrar primeiro aluno
            </Link> : null}
          </div>
        )}
      </section>
    </div>
  )
}

function DashboardCard({
  title,
  value,
  subtitle,
  icon
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          {title}
        </p>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>

      <h3 className="text-4xl font-bold text-blue-950">
        {value}
      </h3>

      <p className="mt-1 text-sm text-zinc-500">
        {subtitle}
      </p>
    </div>
  )
}

function ReminderItem({ reminder }: { reminder: DashboardReminder }) {
  const priorityClass = reminder.priority === "high"
    ? "bg-red-50 text-red-700"
    : "bg-blue-50 text-blue-700"

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${priorityClass}`}>
          <AlertCircle size={20} />
        </div>

        <div>
          <h3 className="font-semibold text-blue-950">
            {reminder.title}
          </h3>

          <p className="text-sm text-zinc-500">
            {reminder.description}
          </p>

          {reminder.due_at && (
            <p className="mt-1 text-xs text-zinc-400">
              {new Date(reminder.due_at).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      </div>

      <Link to={reminder.to} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Abrir
      </Link>
    </div>
  )
}

function QuickAction({
  icon,
  title,
  subtitle,
  color,
  to
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  to: string
}) {
  return (
    <Link to={to} className={`rounded-2xl p-4 text-left ${color}`}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/70">
        {icon}
      </div>

      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="text-sm opacity-80">
        {subtitle}
      </p>
    </Link>
  )
}
