import { useState, type FormEvent } from "react"
import { CheckCircle2, KeyRound, ShieldCheck, UserRound } from "lucide-react"

import { api } from "@/api/client"
import { useAuth } from "@/features/auth/hooks/use-auth"
import {
  permissionLevelLabels,
  roleDescriptions,
  roleLabels,
  toolLabels,
  type ToolAccess,
} from "@/features/auth/access"
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

export function SettingsPage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  async function changePassword(event: FormEvent) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage("A confirmação da nova senha não confere.")
      return
    }

    setSaving(true)
    setMessage("")
    try {
      await api.post("/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setMessage("Senha alterada com sucesso.")
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-950">Configurações</h1>
        <p className="mt-2 text-sm text-zinc-500">Gerencie sua conta e a segurança da sessão.</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-3"><ShieldCheck size={26} /></div>
            <div>
              <p className="text-sm font-medium text-blue-100">Nível de permissão da conta</p>
              <h2 className="mt-1 text-3xl font-bold">{user ? permissionLevelLabels[user.role] ?? user.role : ""}</h2>
              <p className="mt-2 max-w-2xl text-sm text-blue-100">{user ? roleDescriptions[user.role] : ""}</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-50 ring-1 ring-inset ring-emerald-200/40">
            Perfil aprovado
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-blue-700"><UserRound size={20} /><h2 className="font-bold text-blue-950">Sua conta</h2></div>
          <dl className="mt-5 space-y-4 text-sm">
            <div><dt className="text-zinc-500">Nome</dt><dd className="mt-1 font-medium text-blue-950">{user?.name}</dd></div>
            <div><dt className="text-zinc-500">E-mail</dt><dd className="mt-1 font-medium text-blue-950">{user?.email}</dd></div>
            <div><dt className="text-zinc-500">Função profissional</dt><dd className="mt-1 font-medium text-blue-950">{user ? roleLabels[user.role] ?? user.role : ""}</dd></div>
            {user?.credential_reference ? <div><dt className="text-zinc-500">Identificação profissional</dt><dd className="mt-1 font-medium text-blue-950">{user.credential_reference}</dd></div> : null}
          </dl>
        </div>

        <form onSubmit={changePassword} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-blue-700"><ShieldCheck size={20} /><h2 className="font-bold text-blue-950">Alterar senha</h2></div>
          <div className="mt-5 space-y-4">
            <PasswordInput label="Senha atual" value={currentPassword} onChange={setCurrentPassword} />
            <PasswordInput label="Nova senha" value={newPassword} onChange={setNewPassword} minLength={8} />
            <PasswordInput label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} minLength={8} />
            {message && <p className="text-sm text-blue-700">{message}</p>}
            <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              <KeyRound size={17} />{saving ? "Alterando..." : "Alterar senha"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-blue-700"><ShieldCheck size={20} /><h2 className="font-bold text-blue-950">Ferramentas liberadas para seu perfil</h2></div>
        <p className="mt-2 text-sm text-zinc-500">Além deste nível global, o acesso aos dados de cada aluno depende do vínculo e das permissões definidas pela equipe responsável.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(user?.allowed_tools ?? []).filter((tool): tool is ToolAccess => tool in toolLabels).map((tool) => (
            <div key={tool} className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"><CheckCircle2 size={18} className="shrink-0 text-emerald-600" />{toolLabels[tool]}</div>
          ))}
        </div>
      </section>
    </div>
  )
}

function PasswordInput({ label, value, onChange, minLength = 6 }: { label: string; value: string; onChange: (value: string) => void; minLength?: number }) {
  return <label className="block text-sm font-medium text-zinc-700">{label}<input type="password" required minLength={minLength} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500" /></label>
}
