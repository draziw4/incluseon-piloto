import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { api } from "@/api/client"
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"


export function PasswordResetPage() {
  const [params] = useSearchParams()
  const token = params.get("token")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (token && password !== confirmation) {
      setMessage("A confirmação da senha não confere.")
      return
    }

    setSubmitting(true)
    setMessage("")
    try {
      if (token) {
        await api.post("/auth/password-reset/confirm", { token, new_password: password })
        setMessage("Senha redefinida. Você já pode entrar.")
      } else {
        await api.post("/auth/password-reset/request", { email })
        setMessage("Se o e-mail estiver cadastrado, enviaremos as instruções.")
      }
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="motion-page flex min-h-screen items-center justify-center bg-blue-50 px-6">
      <form onSubmit={submit} className="motion-auth-card w-full max-w-md rounded-3xl border border-blue-100 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-blue-950">{token ? "Criar nova senha" : "Recuperar acesso"}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {token ? "Escolha uma senha segura para sua conta." : "Informe o e-mail cadastrado para receber as instruções."}
        </p>

        <div className="mt-6 space-y-4">
          {token ? (
            <>
              <PasswordField label="Nova senha" value={password} onChange={setPassword} />
              <PasswordField label="Confirmar senha" value={confirmation} onChange={setConfirmation} />
            </>
          ) : (
            <label className="block text-sm font-medium text-zinc-700">
              E-mail
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500" />
            </label>
          )}
          {message && <p className="motion-notice rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</p>}
          <button disabled={submitting} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Enviando..." : token ? "Redefinir senha" : "Enviar instruções"}
          </button>
          <Link to="/login" className="block text-center text-sm font-medium text-blue-600">Voltar ao login</Link>
        </div>
      </form>
    </main>
  )
}


function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium text-zinc-700">{label}<input type="password" required minLength={8} maxLength={128} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500" /></label>
}
