import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, BadgeCheck, Ban, Clock3, Search, ShieldCheck, Trash2, UserCheck, UserX, X } from "lucide-react"
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

type DeletionImpact = {
  user_id: number
  user_name: string
  owned_students: Array<{ id: number; name: string }>
  linked_students_count: number
  historical_records_count: number
  future_appointments_count: number
  replacement_candidates: Array<{ id: number; name: string; email: string; role: string }>
}

async function getDeletionImpact(userId: number) {
  const response = await api.get<DeletionImpact>(`/users/${userId}/deletion-impact`)
  return response.data
}

async function deleteProfessional(input: { userId: number; replacementUserId?: number }) {
  await api.delete(`/users/${input.userId}`, {
    params: input.replacementUserId ? { replacement_user_id: input.replacementUserId } : undefined,
  })
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
  const [deletionTarget, setDeletionTarget] = useState<User | null>(null)
  const professionalsQuery = useQuery({
    queryKey: ["admin-professionals"],
    queryFn: getProfessionals,
  })
  const accessMatrixQuery = useQuery({
    queryKey: ["admin-access-matrix"],
    queryFn: getAccessMatrix,
  })
  const deletionImpactQuery = useQuery({
    queryKey: ["professional-deletion-impact", deletionTarget?.id],
    queryFn: () => getDeletionImpact(deletionTarget!.id),
    enabled: deletionTarget !== null,
  })
  const reviewMutation = useMutation({
    mutationFn: reviewProfessional,
    onSuccess: async () => {
      setActionError("")
      await queryClient.invalidateQueries({ queryKey: ["admin-professionals"] })
    },
    onError: (error) => setActionError(getApiErrorMessage(error)),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteProfessional,
    onSuccess: async () => {
      setDeletionTarget(null)
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
            onDelete={() => { setActionError(""); setDeletionTarget(professional) }}
          />
        ))}
      </div>

      {deletionTarget ? <ProfessionalDeletionModal
        key={deletionTarget.id}
        professional={deletionTarget}
        impact={deletionImpactQuery.data}
        loading={deletionImpactQuery.isLoading}
        loadError={deletionImpactQuery.isError ? getApiErrorMessage(deletionImpactQuery.error) : ""}
        saving={deleteMutation.isPending}
        actionError={deleteMutation.isError ? getApiErrorMessage(deleteMutation.error) : ""}
        onClose={() => { if (!deleteMutation.isPending) setDeletionTarget(null) }}
        onConfirm={(replacementUserId) => deleteMutation.mutate({ userId: deletionTarget.id, replacementUserId })}
      /> : null}
    </div>
  )
}

function ProfessionalReviewCard({ professional, accessMatrix, saving, onReview, onDelete }: { professional: User; accessMatrix: RoleAccess[]; saving: boolean; onReview: (input: ReviewInput) => void; onDelete: () => void }) {
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
        <button type="button" disabled={saving} onClick={onDelete} className="flex items-center gap-2 rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-800 disabled:opacity-60"><Trash2 size={17} />Excluir definitivamente</button>
      </div>
    </article>
  )
}

function ProfessionalDeletionModal({ professional, impact, loading, loadError, saving, actionError, onClose, onConfirm }: {
  professional: User
  impact?: DeletionImpact
  loading: boolean
  loadError: string
  saving: boolean
  actionError: string
  onClose: () => void
  onConfirm: (replacementUserId?: number) => void
}) {
  const [replacementUserId, setReplacementUserId] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const requiresReplacement = Boolean(impact?.owned_students.length)
  const hasReplacement = !requiresReplacement || Boolean(replacementUserId)
  const canDelete = impact && confirmation === "EXCLUIR" && hasReplacement && !saving

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-professional-title">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-red-100 p-3 text-red-700"><AlertTriangle size={22} /></div>
            <div>
              <h2 id="delete-professional-title" className="text-xl font-bold text-blue-950">Excluir profissional definitivamente</h2>
              <p className="mt-1 text-sm text-zinc-600">A conta de <strong>{professional.name}</strong> será removida do banco e não poderá ser recuperada.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Fechar" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50"><X size={19} /></button>
        </div>

        {loading ? <div className="mt-6 rounded-2xl bg-blue-50 p-5 text-sm text-blue-700">Verificando alunos, vínculos e históricos...</div> : null}
        {loadError ? <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-sm text-red-700">{loadError}</div> : null}

        {impact ? <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ImpactMetric label="Alunos vinculados" value={impact.linked_students_count} />
            <ImpactMetric label="Referências históricas preservadas" value={impact.historical_records_count} />
            <ImpactMetric label="Atendimentos futuros cancelados" value={impact.future_appointments_count} />
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            Os alunos e seus históricos não serão apagados. As observações comportamentais manterão o nome e o perfil histórico do autor, mesmo após a exclusão da conta.
          </div>

          {requiresReplacement ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="font-bold text-amber-950">Transferência obrigatória</h3>
            <p className="mt-1 text-sm text-amber-900">Este profissional é responsável por {impact.owned_students.length} aluno(s): {impact.owned_students.map((student) => student.name).join(", ")}.</p>
            <label className="mt-4 block text-sm font-medium text-amber-950">Novo responsável para esses alunos
              <select value={replacementUserId} onChange={(event) => setReplacementUserId(event.target.value)} className="mt-2 w-full rounded-xl border border-amber-300 bg-white px-4 py-3 outline-none focus:border-amber-600">
                <option value="">Selecione um profissional ativo</option>
                {impact.replacement_candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} — {roleLabels[candidate.role] ?? candidate.role}</option>)}
              </select>
            </label>
            {impact.replacement_candidates.length === 0 ? <p role="alert" className="mt-3 text-sm font-semibold text-red-700">Não existe outro profissional habilitado para receber esses alunos. Cadastre ou aprove um responsável antes de continuar.</p> : null}
          </div> : null}

          <label className="block text-sm font-medium text-zinc-700">Digite <strong>EXCLUIR</strong> para confirmar
            <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-red-500" />
          </label>
          {actionError ? <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{actionError}</div> : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 disabled:opacity-50">Cancelar</button>
            <button type="button" disabled={!canDelete || (requiresReplacement && impact.replacement_candidates.length === 0)} onClick={() => onConfirm(replacementUserId ? Number(replacementUserId) : undefined)} className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Excluindo..." : "Excluir conta definitivamente"}</button>
          </div>
        </div> : null}
      </div>
    </div>
  )
}

function ImpactMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 text-2xl font-bold text-blue-950">{value}</p></div>
}
