import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { BadgeCheck, Brain, Eye, EyeOff, IdCard, Lock, Mail, ShieldCheck, UserRound } from "lucide-react"
import { useCallback, useState, type ReactNode } from "react"
import { useForm, useWatch } from "react-hook-form"
import { Link, Navigate, useNavigate } from "react-router-dom"

import {
  getAuthCapabilities,
  loginWithGoogle,
  registerAccount,
} from "@/features/auth/api/public-auth"
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import {
  registerSchema,
  type RegisterData,
} from "@/features/auth/schemas/register-schema"
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

const inputContainerClass =
  "flex items-center gap-3 rounded-xl border border-blue-100 px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"

const fallbackProfessionalRoles = [
  { value: "psychologist", label: "Psicólogo(a)" },
  { value: "supervisor", label: "Supervisor(a)" },
  { value: "aee", label: "Profissional de AEE" },
  { value: "support_professional", label: "Profissional de apoio" },
] as const

export function RegisterPage() {
  const auth = useAuth()
  const refreshAuthenticatedUser = auth.login
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [googlePending, setGooglePending] = useState(false)
  const capabilities = useQuery({
    queryKey: ["auth-capabilities"],
    queryFn: getAuthCapabilities,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  })
  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      requestedRole: "psychologist",
      credentialReference: "",
      acceptedTerms: false,
    },
  })
  const credentialReference = useWatch({ control, name: "credentialReference" }) ?? ""

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      try {
        setGooglePending(true)
        setFormError("")
        const result = await loginWithGoogle(credential, {
          requestedRole: getValues("requestedRole"),
          credentialReference: getValues("credentialReference"),
        })
        if (result.authenticated) {
          await refreshAuthenticatedUser()
          navigate("/")
          return
        }
        setSuccessMessage(result.message)
      } catch (error) {
        setFormError(getApiErrorMessage(error))
      } finally {
        setGooglePending(false)
      }
    },
    [getValues, navigate, refreshAuthenticatedUser],
  )

  const handleGoogleError = useCallback(() => {
    setFormError("Não foi possível carregar o login do Google.")
  }, [])

  if (auth.loading) {
    return <div className="flex min-h-screen items-center justify-center bg-blue-50 text-blue-700">Carregando...</div>
  }
  if (auth.user) return <Navigate to="/" replace />

  async function onSubmit(data: RegisterData) {
    try {
      setFormError("")
      const result = await registerAccount(data)
      setSuccessMessage(result.message)
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    }
  }

  const googleClientId = capabilities.data?.google_client_id
  const registrationEnabled = capabilities.data?.registration_enabled === true
  const professionalRoles = capabilities.data?.professional_roles.length
    ? capabilities.data.professional_roles
    : fallbackProfessionalRoles

  return (
    <div className="motion-page min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 px-5 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="motion-auth-stagger mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Brain size={28} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-blue-950">Criar conta no IncluseON</h1>
          <p className="mt-1 text-sm text-zinc-500">Cadastre seu acesso profissional para começar.</p>
        </div>

        <div className="motion-auth-card rounded-3xl border border-blue-100 bg-white p-7 shadow-xl shadow-blue-100/60 sm:p-9">
          {!registrationEnabled && !capabilities.isLoading ? (
            <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-900">
              A criação de contas está temporariamente indisponível.
            </div>
          ) : (
            <>
              {successMessage ? (
                <div className="motion-notice rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <BadgeCheck className="mx-auto text-emerald-600" size={32} />
                  <h2 className="mt-3 font-bold text-emerald-950">Cadastro recebido</h2>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-800">{successMessage}</p>
                  <p className="mt-2 text-xs text-emerald-700">Você poderá entrar depois que o administrador validar seu perfil e sua identificação profissional.</p>
                  <Link to="/login" className="mt-5 inline-flex rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white">Voltar para o login</Link>
                </div>
              ) : (
              <>
              <div className="mb-6 grid gap-5">
                <AuthField label="Perfil profissional solicitado" error={errors.requestedRole?.message}>
                  <div className={inputContainerClass}>
                    <UserRound size={18} className="text-zinc-400" />
                    <select
                      form="registration-form"
                      {...register("requestedRole")}
                      className="w-full bg-transparent text-sm outline-none"
                    >
                      {professionalRoles.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </AuthField>

                <AuthField label="Registro, matrícula ou vínculo profissional" error={errors.credentialReference?.message}>
                  <div className={inputContainerClass}>
                    <IdCard size={18} className="text-zinc-400" />
                    <input
                      form="registration-form"
                      type="text"
                      placeholder="Ex.: CRP, matrícula da escola ou instituição"
                      {...register("credentialReference")}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">O administrador usará esta referência para validar seu perfil antes de liberar o acesso.</p>
                </AuthField>
              </div>

              {capabilities.data?.google_enabled && googleClientId && credentialReference.trim().length >= 3 ? (
                <>
                  <GoogleSignInButton
                    clientId={googleClientId}
                    onCredential={handleGoogleCredential}
                    onError={handleGoogleError}
                    busy={googlePending}
                  />
                  <p className="mt-3 text-center text-xs leading-relaxed text-zinc-500">
                    Ao continuar com Google, você aceita os <Link className="text-blue-600" to="/terms">Termos de Uso</Link> e a <Link className="text-blue-600" to="/privacy">Política de Privacidade</Link>.
                  </p>
                  <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-400">
                    <span className="h-px flex-1 bg-zinc-200" />
                    ou cadastre com e-mail
                    <span className="h-px flex-1 bg-zinc-200" />
                  </div>
                </>
              ) : capabilities.data?.google_enabled && googleClientId ? (
                <p className="mb-6 rounded-xl bg-blue-50 px-4 py-3 text-center text-xs text-blue-700">Informe sua identificação profissional acima para liberar o cadastro com Google.</p>
              ) : null}

              {formError ? (
                <div role="alert" className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              ) : null}

              <form id="registration-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <AuthField label="Nome completo" error={errors.name?.message}>
                  <div className={inputContainerClass}>
                    <UserRound size={18} className="text-zinc-400" />
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Seu nome completo"
                      {...register("name")}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </AuthField>

                <AuthField label="E-mail" error={errors.email?.message}>
                  <div className={inputContainerClass}>
                    <Mail size={18} className="text-zinc-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="seuemail@email.com"
                      {...register("email")}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </AuthField>

                <AuthField label="Senha" error={errors.password?.message}>
                  <div className={inputContainerClass}>
                    <Lock size={18} className="text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Mínimo de 12 caracteres"
                      {...register("password")}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="text-zinc-400 hover:text-blue-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </AuthField>

                <AuthField label="Confirmar senha" error={errors.passwordConfirmation?.message}>
                  <div className={inputContainerClass}>
                    <ShieldCheck size={18} className="text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repita a senha"
                      {...register("passwordConfirmation")}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </AuthField>

                <div>
                  <label className="flex items-start gap-3 text-sm leading-relaxed text-zinc-600">
                    <input type="checkbox" {...register("acceptedTerms")} className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600" />
                    <span>
                      Li e aceito os <Link className="font-medium text-blue-600" to="/terms">Termos de Uso</Link> e a <Link className="font-medium text-blue-600" to="/privacy">Política de Privacidade</Link>.
                    </span>
                  </label>
                  {errors.acceptedTerms ? <p className="mt-1 text-sm text-red-500">{errors.acceptedTerms.message}</p> : null}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || capabilities.isLoading}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Criando conta..." : "Criar conta"}
                </button>
              </form>
              </>
              )}
            </>
          )}

          <p className="mt-7 text-center text-sm text-zinc-500">
            Já possui acesso? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

type AuthFieldProps = {
  label: string
  error?: string
  children: ReactNode
}

function AuthField({ label, error, children }: AuthFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-700">{label}</label>
      {children}
      {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
    </div>
  )
}
