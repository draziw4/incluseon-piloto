import { useState, type FormEvent } from "react"
import { KeyRound, ShieldCheck, UserRound } from "lucide-react"

import { api } from "@/api/client"
import { useAuth } from "@/features/auth/hooks/use-auth"
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-blue-700"><UserRound size={20} /><h2 className="font-bold text-blue-950">Sua conta</h2></div>
          <dl className="mt-5 space-y-4 text-sm">
            <div><dt className="text-zinc-500">Nome</dt><dd className="mt-1 font-medium text-blue-950">{user?.name}</dd></div>
            <div><dt className="text-zinc-500">E-mail</dt><dd className="mt-1 font-medium text-blue-950">{user?.email}</dd></div>
            <div><dt className="text-zinc-500">Perfil</dt><dd className="mt-1 font-medium capitalize text-blue-950">{user?.role?.replaceAll("_", " ")}</dd></div>
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
    </div>
  )
}

function PasswordInput({ label, value, onChange, minLength = 6 }: { label: string; value: string; onChange: (value: string) => void; minLength?: number }) {
  return <label className="block text-sm font-medium text-zinc-700">{label}<input type="password" required minLength={minLength} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500" /></label>
}
