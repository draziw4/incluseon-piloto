import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BadgeCheck, Ban, Clock3, Search, ShieldCheck, UserCheck, UserX } from "lucide-react"
import { useMemo, useState } from "react"

import { api } from "@/api/client"
import { roleLabels, toolLabels, type ToolAccess } from "@/features/auth/access"
import type { AccountStatus, User } from "@/features/auth/types/user"
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

const professionalRoles = [
  "psychologist",
  "supervisor",
  "aee",
  "support_professional",
  "school",
  "guardian",
] as const

const statusLabels: Record<AccountStatus, string> = {
  pending: "Aguardando análise",
  active: "Ativo",
  rejected: "Não aprovado",
  suspended: "Suspenso",
}

async function getProfessionals() {
  const response = await api.get<User[]>("/users")
  return response.data.filter((user) => user.role !== "admin")
}

type RoleAccess = { role: string; label: string; allowed_tools: ToolAccess[] }

async function getAccessMatrix() {
  const response = await api.get<RoleAccess[]>("/users/access-matrix")
  return response.data
}

type ReviewInput = {
  userId: number
  status: Exclude<AccountStatus, "pending">
  role: string
  reviewNote: string
}

async function reviewProfessional(input: ReviewInput) {
  const response = await api.patch<User>(`/users/${input.userId}/review`, {
    status: input.status,
    role: input.role,
    review_note: input.reviewNote.trim() || null,
  })
  return response.data
}

export function AdminProfessionalsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("pending")
  const [search, setSearch] = useState("")
  const [actionError, setActionError] = useState("")
  const professionalsQuery = useQuery({
    queryKey: ["admin-professionals"],
    queryFn: getProfessionals,
  })
  const accessMatrixQuery = useQuery({
    queryKey: ["admin-access-matrix"],
    queryFn: getAccessMatrix,
  })
  const reviewMutation = useMutation({
    mutationFn: reviewProfessional,
    onSuccess: async () => {
      setActionError("")
      await queryClient.invalidateQueries({ queryKey: ["admin-professionals"] })
    },
    onError: (error) => setActionError(getApiErrorMessage(error)),
  })

  const professionals = useMemo(() => professionalsQuery.data ?? [], [professionalsQuery.data])
  const pendingCount = professionals.filter((user) => user.account_status === "pending").length
  const visibleProfessionals = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR")
    return professionals.filter((user) => {
      const matchesStatus = statusFilter === "all" || user.account_status === statusFilter
      const matchesSearch = !normalizedSearch || `${user.name} ${user.email} ${user.credential_reference ?? ""}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
      return matchesStatus && matchesSearch
    })
  }, [professionals, search, statusFilter])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600"><ShieldCheck size={18} />Controle de acesso</div>
            <h1 className="mt-2 text-3xl font-bold text-blue-950">Verificação de profissionais</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">Valide a identificação informada, confirme o perfil correto e só então libere a conta. O perfil aprovado define quais ferramentas aparecem e quais APIs podem ser utilizadas.</p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-5 py-4 text-amber-900">
            <p className="text-xs font-medium uppercase tracking-wide">Pendentes</p>
            <p className="mt-1 text-3xl font-bold">{pendingCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-3 rounded-xl border border-blue-100 px-4 py-3">
            <Search size={18} className="text-zinc-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail ou registro..." className="w-full bg-transparent text-sm outline-none" />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["pending", "active", "rejected", "suspended", "all"] as const).map((status) => (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-xl px-4 py-3 text-sm font-medium ${statusFilter === status ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}>
                {status === "all" ? "Todos" : statusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {actionError ? <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{actionError}</div> : null}
      {professionalsQuery.isLoading ? <div className="rounded-2xl bg-white p-6 text-sm text-zinc-500">Carregando profissionais...</div> : null}
      {professionalsQuery.isError ? <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">Não foi possível carregar os cadastros.</div> : null}

      {!professionalsQuery.isLoading && !professionalsQuery.isError && visibleProfessionals.length === 0 ? (
        <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center text-sm text-zinc-500">Nenhum profissional encontrado neste filtro.</div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {visibleProfessionals.map((professional) => (
          <ProfessionalReviewCard
            key={`${professional.id}-${professional.account_status}-${professional.role}`}
            professional={professional}
            accessMatrix={accessMatrixQuery.data ?? []}
            saving={reviewMutation.isPending && reviewMutation.variables?.userId === professional.id}
            onReview={(input) => reviewMutation.mutate(input)}
          />
        ))}
      </div>
    </div>
  )
}

function ProfessionalReviewCard({ professional, accessMatrix, saving, onReview }: { professional: User; accessMatrix: RoleAccess[]; saving: boolean; onReview: (input: ReviewInput) => void }) {
  const [role, setRole] = useState(professional.requested_role ?? professional.role)
  const [reviewNote, setReviewNote] = useState(professional.review_note ?? "")
  const statusIcon = professional.account_status === "active" ? <BadgeCheck size={18} /> : professional.account_status === "pending" ? <Clock3 size={18} /> : <Ban size={18} />
  const selectedAccess = accessMatrix.find((item) => item.role === role)?.allowed_tools ?? []

  function submit(status: ReviewInput["status"]) {
    onReview({ userId: professional.id, status, role, reviewNote })
  }

  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-blue-950">{professional.name}</h2>
          <p className="truncate text-sm text-zinc-500">{professional.email}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{statusIcon}{statusLabels[professional.account_status]}</span>
      </div>

      <dl className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-zinc-400">Perfil solicitado</dt><dd className="mt-1 font-semibold text-blue-950">{roleLabels[professional.requested_role ?? professional.role] ?? professional.role}</dd></div>
        <div><dt className="text-xs text-zinc-400">Identificação informada</dt><dd className="mt-1 break-words font-semibold text-blue-950">{professional.credential_reference || "Não informada"}</dd></div>
        <div><dt className="text-xs text-zinc-400">Forma de cadastro</dt><dd className="mt-1 font-medium text-zinc-700">{professional.auth_provider.includes("google") ? "Google" : "E-mail e senha"}</dd></div>
        <div><dt className="text-xs text-zinc-400">Perfil atual</dt><dd className="mt-1 font-medium text-zinc-700">{roleLabels[professional.role] ?? professional.role}</dd></div>
      </dl>

      <div className="mt-5 grid gap-4">
        <label className="text-sm font-medium text-zinc-700">Perfil que será aplicado
          <select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-4 py-3 outline-none focus:border-blue-500">
            {professionalRoles.map((roleValue) => <option key={roleValue} value={roleValue}>{roleLabels[roleValue]}</option>)}
          </select>
        </label>
        <div>
          <p className="text-sm font-medium text-zinc-700">Ferramentas que este perfil receberá</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedAccess.map((tool) => (
              <span key={tool} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">{toolLabels[tool]}</span>
            ))}
          </div>
        </div>
        <label className="text-sm font-medium text-zinc-700">Observação da análise
          <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} maxLength={500} rows={3} placeholder="Ex.: CRP conferido ou vínculo escolar confirmado" className="mt-2 w-full resize-none rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={saving} onClick={() => submit("active")} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"><UserCheck size={17} />Aprovar e liberar</button>
        <button type="button" disabled={saving} onClick={() => submit("rejected")} className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"><UserX size={17} />Não aprovar</button>
        {professional.account_status === "active" ? <button type="button" disabled={saving} onClick={() => submit("suspended")} className="flex items-center gap-2 rounded-xl border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700 disabled:opacity-60"><Ban size={17} />Suspender</button> : null}
      </div>
    </article>
  )
}
