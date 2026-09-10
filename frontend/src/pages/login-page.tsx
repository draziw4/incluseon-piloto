import { useCallback, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Brain,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  loginSchema,
  type LoginData,
} from "@/features/auth/schemas/login-schema";

import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  getAuthCapabilities,
  loginWithGoogle,
} from "@/features/auth/api/public-auth";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message";
import { login } from "../api/login";

export function LoginPage() {
  const auth = useAuth();
  const refreshAuthenticatedUser = auth.login;
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [googlePending, setGooglePending] = useState(false);
  const capabilities = useQuery({
    queryKey: ["auth-capabilities"],
    queryFn: getAuthCapabilities,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      try {
        setGooglePending(true);
        setLoginError("");
        const result = await loginWithGoogle(credential);
        if (!result.authenticated) {
          setLoginError(result.message);
          return;
        }
        await refreshAuthenticatedUser();
        navigate("/");
      } catch (error) {
        setLoginError(getApiErrorMessage(error));
      } finally {
        setGooglePending(false);
      }
    },
    [navigate, refreshAuthenticatedUser],
  );

  const handleGoogleError = useCallback(() => {
    setLoginError("Não foi possível carregar o login do Google.");
  }, []);

  const googleClientId = capabilities.data?.google_client_id;

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50 text-blue-700">
        Carregando...
      </div>
    );
  }

  if (auth.user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(data: LoginData) {
    try {
      setLoginError("");

      await login(data);

      await refreshAuthenticatedUser();

      navigate("/");
    } catch (error) {
      setLoginError(getApiErrorMessage(error));
    }
  }

  return (
    <div className="motion-page min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="motion-auth-visual hidden flex-col justify-between bg-blue-950 p-10 text-white lg:flex">
          <div className="motion-auth-stagger">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500">
                <Brain size={26} />
              </div>

              <div>
                <h1 className="text-2xl font-bold">IncluseON</h1>

                <p className="text-sm text-blue-200">
                  Acompanhamento neuroeducacional
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-900 px-4 py-2 text-sm text-blue-100">
                <Sparkles size={16} />
                Plataforma inteligente para psicólogos e escolas
              </span>

              <h2 className="mt-8 text-5xl font-bold leading-tight">
                Monitore, compreenda e acompanhe cada aluno de forma
                individualizada.
              </h2>

              <p className="mt-6 text-lg leading-relaxed text-blue-100">
                Registre avaliações, entrevistas, observações comportamentais, evolução
                comportamental e gere estudos de caso com apoio de IA.
              </p>
            </div>
          </div>

          <div className="motion-auth-stagger grid grid-cols-3 gap-4">
            <FeatureCard
              title="Acompanhamento"
              description="Observações ABC e manejo comportamental"
            />

            <FeatureCard
              title="IA"
              description="Estudos de caso e relatórios inteligentes"
            />

            <FeatureCard
              title="PAEE"
              description="Base para acompanhamento pedagógico"
            />
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <div className="motion-auth-card w-full max-w-md">
            <div className="mb-10 text-center lg:hidden">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Brain size={28} />
              </div>

              <h1 className="mt-4 text-2xl font-bold text-blue-950">
                IncluseON
              </h1>

              <p className="text-sm text-zinc-500">
                Acompanhamento neuroeducacional
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-100/60">
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ShieldCheck size={24} />
                </div>

                <h2 className="text-3xl font-bold text-blue-950">
                  Entrar na conta
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Acesse o painel para acompanhar alunos, avaliações e
                  registros.
                </p>
              </div>

              {loginError && (
                <div role="alert" className="motion-notice mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loginError}
                </div>
              )}

              {capabilities.data?.google_enabled && googleClientId ? (
                <>
                  <GoogleSignInButton
                    clientId={googleClientId}
                    onCredential={handleGoogleCredential}
                    onError={handleGoogleError}
                    busy={googlePending}
                  />
                  <p className="mt-3 text-center text-xs leading-relaxed text-zinc-500">
                    Ao continuar, você aceita os <Link className="text-blue-600" to="/terms">Termos de Uso</Link> e a <Link className="text-blue-600" to="/privacy">Política de Privacidade</Link>.
                  </p>
                  <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-400">
                    <span className="h-px flex-1 bg-zinc-200" />
                    ou continue com e-mail
                    <span className="h-px flex-1 bg-zinc-200" />
                  </div>
                </>
              ) : null}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Email
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-blue-100 px-4 py-3 transition-[border-color,box-shadow] duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                    <Mail size={18} className="text-zinc-400" />

                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="seuemail@email.com"
                      {...register("email")}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>

                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Senha
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-blue-100 px-4 py-3 transition-[border-color,box-shadow] duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                    <Lock size={18} className="text-zinc-400" />

                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      {...register("password")}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />

                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-400 hover:text-blue-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-zinc-500">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600"
                    />
                    Lembrar acesso
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Esqueci minha senha
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </button>
              </form>

              {capabilities.data?.registration_enabled ? (
                <p className="mt-6 text-center text-sm text-zinc-500">
                  Ainda não tem acesso?{" "}
                  <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                    Criar conta
                  </Link>
                </p>
              ) : null}

              <div className="mt-8 rounded-2xl bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-950">
                  Ambiente seguro
                </p>

                <p className="mt-1 text-xs leading-relaxed text-blue-700">
                  Os dados são protegidos e cada profissional acessa apenas os
                  alunos vinculados à sua conta.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500">
              IncluseON © 2026 — Plataforma de acompanhamento neuroeducacional
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="interactive-card rounded-2xl border border-blue-800 bg-blue-900/60 p-4 hover:border-blue-700 hover:bg-blue-900/80">
      <p className="font-bold text-white">{title}</p>

      <p className="mt-1 text-sm leading-relaxed text-blue-200">
        {description}
      </p>
    </div>
  );
}
