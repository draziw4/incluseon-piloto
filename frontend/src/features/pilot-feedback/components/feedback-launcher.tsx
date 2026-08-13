import { useState, type FormEvent } from "react"
import { CheckCircle2, MessageSquarePlus, ShieldAlert, X } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import { useCreatePilotFeedback } from "../hooks"
import type { FeedbackCategory } from "../types"


export function FeedbackLauncher() {
  const { pathname, search } = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>("improvement")
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [expectedResult, setExpectedResult] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const mutation = useCreatePilotFeedback()

  function closeModal() {
    setIsOpen(false)
    setSubmitted(false)
    mutation.reset()
  }

  async function submitFeedback(event: FormEvent) {
    event.preventDefault()
    await mutation.mutateAsync({
      page_path: `${pathname}${search}`,
      category,
      title,
      details,
      expected_result: expectedResult || undefined
    })
    setTitle("")
    setDetails("")
    setExpectedResult("")
    setSubmitted(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
      >
        <MessageSquarePlus size={19} />
        Enviar feedback
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <section role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">Validação do piloto</p>
                <h2 id="feedback-title" className="mt-1 text-2xl font-bold text-blue-950">Conte o que precisa mudar</h2>
              </div>
              <button type="button" onClick={closeModal} aria-label="Fechar formulário" className="rounded-xl p-2 text-zinc-500 hover:bg-slate-100"><X size={20} /></button>
            </div>

            {submitted ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0" size={22} /><div><p className="font-bold">Feedback registrado</p><p className="mt-1 text-sm">Você pode acompanhar a análise e a resposta na área de feedback.</p><Link to="/pilot-feedback" onClick={closeModal} className="mt-3 inline-block text-sm font-semibold underline">Acompanhar feedbacks</Link></div></div>
              </div>
            ) : (
              <form onSubmit={submitFeedback} className="mt-6 space-y-5">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 shrink-0" size={19} /><p>Não informe nomes reais, diagnósticos, telefones ou qualquer dado pessoal. A tela atual será registrada automaticamente.</p></div>
                </div>

                <label className="block text-sm font-semibold text-zinc-700">Tipo
                  <select value={category} onChange={(event) => setCategory(event.target.value as FeedbackCategory)} className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-4 py-3 outline-none focus:border-blue-500">
                    <option value="defect">Algo não funcionou</option>
                    <option value="improvement">Sugestão de melhoria</option>
                    <option value="question">Dúvida de uso</option>
                  </select>
                </label>

                <label className="block text-sm font-semibold text-zinc-700">Resumo
                  <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={5} maxLength={160} placeholder="Ex.: Preciso visualizar as metas por período" className="mt-2 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500" />
                </label>

                <label className="block text-sm font-semibold text-zinc-700">O que aconteceu ou precisa ser alterado?
                  <textarea value={details} onChange={(event) => setDetails(event.target.value)} required minLength={10} maxLength={4000} rows={5} className="mt-2 w-full resize-y rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500" />
                </label>

                <label className="block text-sm font-semibold text-zinc-700">Qual resultado você esperava? <span className="font-normal text-zinc-400">(opcional)</span>
                  <textarea value={expectedResult} onChange={(event) => setExpectedResult(event.target.value)} maxLength={2000} rows={3} className="mt-2 w-full resize-y rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500" />
                </label>

                {mutation.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{getApiErrorMessage(mutation.error)}</p>}

                <button type="submit" disabled={mutation.isPending} className="w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                  {mutation.isPending ? "Enviando..." : "Registrar feedback"}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  )
}
