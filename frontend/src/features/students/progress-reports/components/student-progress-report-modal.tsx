import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle } from "lucide-react"

import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import { useStudentProgressReportMutations } from "../hooks/use-student-progress-reports"
import {
  studentProgressReportSchema,
  type StudentProgressReportData,
  type StudentProgressReportFormData,
} from "../schemas/student-progress-report-schema"
import type { StudentProgressProfessionalType, StudentProgressReport, StudentProgressReportType } from "../types/student-progress-report"

type Props = {
  studentId: string
  open: boolean
  report?: StudentProgressReport | null
  professionalType: StudentProgressProfessionalType
  onClose: () => void
}

const aeeFields = [
  ["activities", "Atividades desenvolvidas", "Quais atividades, propostas ou recursos foram trabalhados?"],
  ["participation_engagement", "Participação e engajamento", "Como o estudante iniciou, manteve e concluiu as atividades?"],
  ["progress", "Avanços observados", "Registre avanços com evidências observáveis."],
  ["difficulties", "Dificuldades e barreiras", "Quais dificuldades ou barreiras surgiram no período?"],
  ["strategies_and_resources", "Estratégias e recursos utilizados", "O que foi utilizado e quais resultados foram observados?"],
  ["communication_socialization", "Comunicação e socialização", "Interações, formas de comunicação e participação com pares e adultos."],
  ["autonomy_functionality", "Autonomia e funcionalidade", "Alimentação, higiene, mobilidade, organização, rotina e autorregulação."],
  ["family_school_notes", "Articulação com família e escola", "Orientações, devolutivas ou informações compartilhadas."],
  ["next_steps", "Próximos passos", "Ajustes, continuidade e ações previstas para o próximo período."],
] as const

const supportFields = [
  ["activities", "Atividades acompanhadas", "Quais atividades o estudante realizou durante o dia?"],
  ["participation_engagement", "Participação e resposta do estudante", "Como o estudante participou e respondeu às propostas?"],
  ["difficulties", "Intercorrências, barreiras ou riscos", "Registre ocorrências relevantes, barreiras, crises, quedas ou riscos observados."],
  ["strategies_and_resources", "Apoios e estratégias utilizados", "Que ajuda, recurso ou estratégia foi utilizada e qual foi a resposta?"],
  ["communication_socialization", "Comunicação e interação", "Como se comunicou e interagiu com colegas e adultos?"],
  ["autonomy_functionality", "Autonomia e cuidados", "Registre alimentação, higiene, mobilidade, organização e autorregulação."],
  ["family_school_notes", "Informações importantes para o AEE", "Destaque fatos que o profissional do AEE precisa analisar."],
  ["next_steps", "Pontos para acompanhamento", "O que precisa ser retomado ou observado no próximo dia?"],
] as const

const indicatorFields = [
  ["participation_level", "Participação", "1 = não participa", "5 = participa com constância"],
  ["autonomy_level", "Autonomia", "1 = apoio integral", "5 = realiza com independência"],
  ["communication_level", "Comunicação funcional", "1 = comunicação muito restrita", "5 = comunica-se em diferentes contextos"],
  ["regulation_level", "Autorregulação", "1 = necessita mediação constante", "5 = regula-se com independência"],
  ["support_level", "Necessidade de apoio", "1 = apoio ocasional", "5 = apoio contínuo e intensivo"],
] as const

export function StudentProgressReportModal({ studentId, open, report, professionalType, onClose }: Props) {
  const [actionError, setActionError] = useState<string | null>(null)
  const { createMutation, updateMutation } = useStudentProgressReportMutations(studentId)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<StudentProgressReportFormData, unknown, StudentProgressReportData>({
    resolver: zodResolver(studentProgressReportSchema),
  })
  const reportType = useWatch({ control, name: "report_type" })
  const periodStart = useWatch({ control, name: "period_start" })
  const effectiveProfessionalType = report?.professional_type ?? professionalType
  const optionalFields = effectiveProfessionalType === "support" ? supportFields : aeeFields

  useEffect(() => {
    if (!open) return
    if (report) {
      reset({
        professional_type: report.professional_type,
        report_type: report.report_type,
        period_start: report.period_start,
        period_end: report.period_end,
        title: report.title,
        summary: report.summary,
        activities: report.activities ?? "",
        participation_engagement: report.participation_engagement ?? "",
        progress: report.progress ?? "",
        difficulties: report.difficulties ?? "",
        strategies_and_resources: report.strategies_and_resources ?? "",
        communication_socialization: report.communication_socialization ?? "",
        autonomy_functionality: report.autonomy_functionality ?? "",
        family_school_notes: report.family_school_notes ?? "",
        next_steps: report.next_steps ?? "",
        participation_level: report.participation_level ?? undefined,
        autonomy_level: report.autonomy_level ?? undefined,
        communication_level: report.communication_level ?? undefined,
        regulation_level: report.regulation_level ?? undefined,
        support_level: report.support_level ?? undefined,
      })
      return
    }

    const today = localDateString(new Date())
    reset({
      professional_type: effectiveProfessionalType,
      report_type: "daily",
      period_start: today,
      period_end: today,
      title: defaultTitle(effectiveProfessionalType, "daily", today),
      summary: "",
      activities: "",
      participation_engagement: "",
      progress: "",
      difficulties: "",
      strategies_and_resources: "",
      communication_socialization: "",
      autonomy_functionality: "",
      family_school_notes: "",
      next_steps: "",
      participation_level: undefined,
      autonomy_level: undefined,
      communication_level: undefined,
      regulation_level: undefined,
      support_level: undefined,
    })
  }, [effectiveProfessionalType, open, report, reset])

  function changeReportType(nextType: StudentProgressReportType) {
    const start = periodStart || localDateString(new Date())
    setValue("report_type", nextType, { shouldValidate: true })
    setValue("period_end", nextType === "daily" ? start : addDays(start, 6), { shouldValidate: true })
    if (!report) setValue("title", defaultTitle(effectiveProfessionalType, nextType, start), { shouldValidate: true })
  }

  function changeStartDate(nextStart: string) {
    setValue("period_start", nextStart, { shouldValidate: true })
    setValue("period_end", reportType === "weekly" ? addDays(nextStart, 6) : nextStart, { shouldValidate: true })
    if (!report) setValue("title", defaultTitle(effectiveProfessionalType, reportType ?? "daily", nextStart), { shouldValidate: true })
  }

  async function onSubmit(data: StudentProgressReportData) {
    try {
      setActionError(null)
      if (report) await updateMutation.mutateAsync({ reportId: report.id, data })
      else await createMutation.mutateAsync(data)
      closeModal()
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }

  function closeModal() {
    setActionError(null)
    onClose()
  }

  if (!open) return null
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-5">
      <div role="dialog" aria-modal="true" aria-labelledby="progress-report-title" className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-blue-100 bg-white px-6 py-5">
          <div>
            <h2 id="progress-report-title" className="text-2xl font-bold text-blue-950">{report ? "Editar relatório" : effectiveProfessionalType === "support" ? "Novo relatório diário do PA" : "Novo relatório do AEE"}</h2>
            <p className="mt-1 text-sm text-zinc-500">{effectiveProfessionalType === "support" ? "Registro objetivo do acompanhamento cotidiano para avaliação posterior do AEE." : "Registro pedagógico detalhado elaborado pelo profissional do AEE."}</p>
          </div>
          <button type="button" onClick={closeModal} className="rounded-xl px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100">Fechar</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
          {actionError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{actionError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 md:grid-cols-3">
            {effectiveProfessionalType === "aee" ? <Field label="Periodicidade" error={errors.report_type?.message}>
              <select value={reportType ?? "daily"} onChange={(event) => changeReportType(event.target.value as StudentProgressReportType)} className={inputClass}>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
              </select>
            </Field> : <div className="rounded-xl bg-white px-4 py-3 text-sm text-blue-800"><span className="block text-xs font-semibold uppercase tracking-wide text-blue-500">Tipo</span>Relatório diário do PA</div>}
            <Field label={reportType === "weekly" ? "Início da semana" : "Data do acompanhamento"} error={errors.period_start?.message}>
              <input type="date" value={periodStart ?? ""} onChange={(event) => changeStartDate(event.target.value)} className={inputClass} />
            </Field>
            {reportType === "weekly" && (
              <Field label="Fim da semana" error={errors.period_end?.message}>
                <input type="date" {...register("period_end")} className={inputClass} />
              </Field>
            )}
          </div>

          <Field label="Título" error={errors.title?.message}>
            <input {...register("title")} className={inputClass} />
          </Field>

          <TextAreaField
            label={effectiveProfessionalType === "support" ? "Síntese do dia" : "Síntese do acompanhamento"}
            placeholder={effectiveProfessionalType === "support" ? "Resuma objetivamente como foi o acompanhamento do estudante hoje." : "Descreva, de forma objetiva e detalhada, como foi o acompanhamento no período."}
            error={errors.summary?.message}
            register={register("summary")}
            required
          />

          <section className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5">
            <div>
              <h3 className="font-bold text-cyan-950">Indicadores para métricas e análise</h3>
              <p className="mt-1 text-sm leading-6 text-cyan-800">
                Preenchimento recomendado. Use a escala de 1 a 5 com base no que foi observado neste período, sem transformar o indicador em diagnóstico.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {indicatorFields.map(([name, label, lowLabel, highLabel]) => (
                <IndicatorField
                  key={name}
                  label={label}
                  lowLabel={lowLabel}
                  highLabel={highLabel}
                  error={errors[name]?.message}
                  register={register(name, {
                    setValueAs: (value) => value === "" ? undefined : Number(value),
                  })}
                />
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {optionalFields.map(([name, label, placeholder]) => (
              <TextAreaField
                key={name}
                label={label}
                placeholder={placeholder}
                error={errors[name]?.message}
                register={register(name)}
              />
            ))}
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-blue-100 bg-white py-4">
            <button type="button" onClick={closeModal} className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
            <button type="submit" disabled={isSaving} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isSaving ? "Salvando..." : "Salvar relatório"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-sm font-medium text-zinc-700">{label}</label>{children}{error && <p className="mt-1 text-sm text-red-500">{error}</p>}</div>
}

function TextAreaField({ label, placeholder, error, register, required = false }: { label: string; placeholder: string; error?: string; register: Record<string, unknown>; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{label}{required ? " *" : ""}</label>
      <textarea {...register} placeholder={placeholder} className="min-h-32 w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500" />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}

function IndicatorField({ label, lowLabel, highLabel, error, register }: { label: string; lowLabel: string; highLabel: string; error?: string; register: Record<string, unknown> }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <label className="block text-sm font-semibold text-cyan-950">{label}</label>
      <select {...register} defaultValue="" className="mt-3 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500">
        <option value="">Não informado</option>
        {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <p className="mt-2 text-xs leading-4 text-cyan-700">{lowLabel}<br />{highLabel}</p>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputClass = "w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"

function localDateString(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`)
  date.setDate(date.getDate() + days)
  return localDateString(date)
}

function defaultTitle(professionalType: StudentProgressProfessionalType, type: StudentProgressReportType, dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`).toLocaleDateString("pt-BR")
  const authorLabel = professionalType === "support" ? "PA" : "AEE"
  return `Relatório ${type === "daily" ? "diário" : "semanal"} do ${authorLabel} - ${date}`
}
