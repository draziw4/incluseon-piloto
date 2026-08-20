import {
  CheckCircle2,
  Pencil,
  ShieldCheck,
  Trash2,
  XCircle
} from "lucide-react"

import type {
  StudentProfessional
} from "../types/student-professional"

type Props = {
  professional: StudentProfessional
  canManage: boolean
  onEdit: (professional: StudentProfessional) => void
  onRemove: (professional: StudentProfessional) => void
}

export function StudentProfessionalCard({
  professional,
  canManage,
  onEdit,
  onRemove
}: Props) {
  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-blue-600">
            <ShieldCheck size={18} />

            <span className="text-sm font-semibold">
              Profissional vinculado
            </span>
          </div>

          <h3 className="text-lg font-bold text-blue-950">
            {professional.user?.name ||
              `Usuário #${professional.user_id}`}
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            {professional.user?.email ||
              "Email não informado"}
          </p>

          <p className="mt-1 text-sm font-medium text-blue-600">
            {formatRole(professional.role_in_student)}
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {professional.can_view ? "Ativo" : "Sem acesso"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PermissionItem
          label="Ver aluno"
          enabled={professional.can_view}
        />

        <PermissionItem
          label="Registrar observações"
          enabled={professional.can_register_aba}
        />

        <PermissionItem
          label="Criar avaliação"
          enabled={professional.can_create_assessment}
        />

        <PermissionItem
          label="Criar PAEE"
          enabled={professional.can_create_pei}
        />

        <PermissionItem
          label="Gerar relatório IA"
          enabled={professional.can_generate_ai_report}
        />

        <PermissionItem
          label="Ver relatórios"
          enabled={professional.can_view_reports}
        />
      </div>

      {canManage && professional.role_in_student !== "owner" ? <div className="mt-5 flex flex-col gap-3 border-t border-blue-50 pt-4 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={() => onEdit(professional)}
          className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          <Pencil size={16} />
          Editar permissões
        </button>

        <button
          type="button"
          onClick={() => onRemove(professional)}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 size={16} />
          Remover
        </button>
      </div> : null}
    </article>
  )
}

function PermissionItem({
  label,
  enabled
}: {
  label: string
  enabled: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
      <span className="text-sm text-zinc-700">
        {label}
      </span>

      {enabled ? (
        <CheckCircle2
          size={18}
          className="text-emerald-600"
        />
      ) : (
        <XCircle
          size={18}
          className="text-zinc-300"
        />
      )}
    </div>
  )
}

function formatRole(role: string) {
  const labels: Record<string, string> = {
    owner: "Responsável principal",
    aee: "Profissional AEE",
    support: "Profissional de apoio",
    psychologist: "Psicólogo",
    supervisor: "Supervisor",
    viewer: "Visualizador"
  }

  return labels[role] || role
}
