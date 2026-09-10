import type { LucideIcon } from "lucide-react"
import { ArrowRight, Search, Users } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { useStudents } from "@/features/students/hooks/use-students"

type Props = {
  title: string
  eyebrow: string
  description: string
  icon: LucideIcon
  tab: "behavior" | "assessments" | "analytics" | "reports" | "goals"
  actionLabel: string
  emptyHint: string
}

export function ResourceHubPage({
  title,
  eyebrow,
  description,
  icon: Icon,
  tab,
  actionLabel,
  emptyHint
}: Props) {
  const [search, setSearch] = useState("")
  const { data, isLoading, isError } = useStudents({
    page: 1,
    per_page: 100,
    search
  })

  const students = data?.items ?? []

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Icon size={22} />
          </div>

          <div>
            <p className="text-sm font-semibold text-blue-600">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-bold text-blue-950">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              {description}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-950">Selecione um aluno</h2>
            <p className="text-sm text-zinc-500">{emptyHint}</p>
          </div>

          <label className="flex w-full items-center gap-3 rounded-xl border border-blue-100 px-4 py-3 md:max-w-sm">
            <Search size={18} className="text-zinc-400" />
            <span className="sr-only">Buscar aluno</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome"
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </label>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-zinc-500">Carregando alunos...</p>
        ) : isError ? (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Não foi possível carregar os alunos.
          </p>
        ) : students.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center text-center">
            <Users size={28} className="text-blue-500" />
            <p className="mt-3 text-sm text-zinc-500">Nenhum aluno encontrado.</p>
            <Link to="/students" className="mt-4 text-sm font-semibold text-blue-600">
              Ir para Meus Alunos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {students.map((student) => (
              <Link
                key={student.id}
                to={`/students/${student.id}?tab=${tab}`}
                className="interactive-card group flex items-center justify-between rounded-2xl border border-blue-100 p-4 hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-blue-950">{student.name}</h3>
                  <p className="mt-1 truncate text-sm text-zinc-500">
                    {student.school_name || "Escola não informada"}
                  </p>
                </div>

                <span className="ml-4 flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-600">
                  {actionLabel}
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
