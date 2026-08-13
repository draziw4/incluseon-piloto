import { useState } from "react"
import { AlertCircle, CheckCircle2, ClipboardCheck, MessageSquareText, RefreshCw } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import { usePilotFeedback, useUpdatePilotFeedback } from "../hooks"
import type { FeedbackCategory, FeedbackStatus, PilotFeedback } from "../types"


const statusLabels: Record<FeedbackStatus, string> = {
  received: "Recebido",
  in_review: "Em análise",
  implemented: "Implementado",
  awaiting_validation: "Aguardando validação",
  approved: "Aprovado"
}

const categoryLabels: Record<FeedbackCategory, string> = {
  defect: "Defeito",
  improvement: "Melhoria",
  question: "Dúvida"
}

export function PilotFeedbackPage() {
  const { user } = useAuth()
  const feedbackQuery = usePilotFeedback()
  const isAdmin = user?.role === "admin"

  return (
    <div className="space-y-6 pb-20">
      <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-950 to-blue-700 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div><p className="text-sm font-semibold text-blue-200">Ciclo de homologação</p><h1 className="mt-1 text-2xl font-bold">Feedback do piloto</h1><p className="mt-2 max-w-2xl text-sm text-blue-100">Registre ajustes durante o uso e acompanhe cada item até a validação final. Utilize somente os dados fictícios fornecidos.</p></div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3"><ClipboardCheck size={22} /><div><p className="text-xs text-blue-200">Visão atual</p><p className="font-semibold">{isAdmin ? "Todos os avaliadores" : "Seus feedbacks"}</p></div></div>
        </div>
      </section>

      {feedbackQuery.isLoading && <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">Carregando feedbacks...</div>}
      {feedbackQuery.isError && <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700"><AlertCircle size={20} /><span>{getApiErrorMessage(feedbackQuery.error)}</span></div>}

      {feedbackQuery.data?.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center">
          <MessageSquareText className="text-blue-500" size={34} /><h2 className="mt-4 font-bold text-blue-950">Nenhum feedback registrado</h2><p className="mt-1 max-w-md text-sm text-zinc-500">Use o botão “Enviar feedback” no canto da tela quando encontrar algo que precisa ser corrigido ou melhorado.</p>
        </div>
      )}

      {feedbackQuery.data && feedbackQuery.data.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><p className="text-sm text-zinc-500">{feedbackQuery.data.length} item(ns) registrado(s)</p><button type="button" onClick={() => feedbackQuery.refetch()} className="flex items-center gap-2 text-sm font-semibold text-blue-700"><RefreshCw size={16} />Atualizar</button></div>
          {feedbackQuery.data.map((feedback) => <FeedbackCard key={feedback.id} feedback={feedback} isAdmin={isAdmin} />)}
        </div>
      )}
    </div>
  )
}

function FeedbackCard({ feedback, isAdmin }: { feedback: PilotFeedback; isAdmin: boolean }) {
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status)
  const [adminNote, setAdminNote] = useState(feedback.admin_note ?? "")
  const updateMutation = useUpdatePilotFeedback()

  async function saveReview() {
    await updateMutation.mutateAsync({ id: feedback.id, status, admin_note: adminNote })
  }

  return (
    <article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{categoryLabels[feedback.category]}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{statusLabels[feedback.status]}</span></div><h2 className="mt-3 text-lg font-bold text-blue-950">{feedback.title}</h2><p className="mt-1 text-xs text-zinc-400">Tela: {feedback.page_path} · {new Date(feedback.created_at).toLocaleString("pt-BR")}</p></div>
        {isAdmin && <div className="text-sm md:text-right"><p className="font-semibold text-zinc-700">{feedback.author_name}</p><p className="text-xs text-zinc-500">{feedback.author_email}</p></div>}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Relato</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{feedback.details}</p></div><div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-500">Resultado esperado</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-950">{feedback.expected_result || "Não informado"}</p></div></div>

      {isAdmin ? (
        <div className="mt-5 rounded-2xl border border-blue-100 p-4"><p className="font-semibold text-blue-950">Tratamento do feedback</p><div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr_auto]"><select value={status} onChange={(event) => setStatus(event.target.value as FeedbackStatus)} className="rounded-xl border border-blue-100 px-3 py-2 text-sm"><option value="received">Recebido</option><option value="in_review">Em análise</option><option value="implemented">Implementado</option><option value="awaiting_validation">Aguardando validação</option><option value="approved">Aprovado</option></select><input value={adminNote} onChange={(event) => setAdminNote(event.target.value)} maxLength={2000} placeholder="Resposta ou orientação ao avaliador" className="rounded-xl border border-blue-100 px-3 py-2 text-sm" /><button type="button" onClick={saveReview} disabled={updateMutation.isPending} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{updateMutation.isPending ? "Salvando..." : "Salvar"}</button></div>{updateMutation.isError && <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(updateMutation.error)}</p>}</div>
      ) : feedback.admin_note ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="mt-0.5 shrink-0" size={20} /><div><p className="font-semibold">Retorno da equipe</p><p className="mt-1 whitespace-pre-wrap text-sm">{feedback.admin_note}</p></div></div>
      ) : null}
    </article>
  )
}
