import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, ClipboardList } from "lucide-react"

import { api } from "@/api/client"
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import type { Assessment } from "../types/assessment"
import {
  getInstrumentDefinition,
  instrumentDefinitions,
  instrumentTypes,
  type InstrumentAnswer,
  type InstrumentField,
  type InstrumentType,
} from "../instrument-definitions"
import {
  createAssessmentSchema,
  type CreateAssessmentData,
  type CreateAssessmentFormData,
} from "../schemas/create-assessment-schema"
import { useCreateAssessment } from "../hooks/use-create-assessment"

type Props = {
  studentId: string
  open: boolean
  onClose: () => void
  assessment?: Assessment | null
}

const emptyForm: CreateAssessmentFormData = {
  title: "",
  assessment_type: "" as InstrumentType,
  assessment_data: {},
}

export function CreateAssessmentModal({ studentId, open, onClose, assessment }: Props) {
  const mutation = useCreateAssessment(studentId)
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: (data: CreateAssessmentData) =>
      api.patch(`/assessments/student/${studentId}/${assessment?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assessments", studentId] }),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateAssessmentFormData, unknown, CreateAssessmentData>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: emptyForm,
  })

  const selectedType = useWatch({ control, name: "assessment_type" })
  const answers = useWatch({ control, name: "assessment_data" }) ?? {}
  const definition = getInstrumentDefinition(selectedType)

  useEffect(() => {
    if (!open) return

    if (assessment && getInstrumentDefinition(assessment.assessment_type)) {
      reset({
        title: assessment.title,
        assessment_type: assessment.assessment_type as InstrumentType,
        assessment_data: assessment.assessment_data as Record<string, InstrumentAnswer>,
      })
      return
    }

    reset(emptyForm)
  }, [open, assessment, reset])

  function handleTypeChange(nextType: InstrumentType) {
    setValue("assessment_type", nextType, { shouldValidate: true })
    setValue("assessment_data", {})
    setValue("title", instrumentDefinitions[nextType].defaultTitle, { shouldValidate: true })
  }

  async function onSubmit(data: CreateAssessmentData) {
    try {
      setActionError(null)

      const activeDefinition = getInstrumentDefinition(data.assessment_type)
      const sanitizedAnswers = Object.fromEntries(
        (activeDefinition?.sections.flatMap((section) => section.fields) ?? [])
          .filter((field) => shouldShowField(field, data.assessment_data))
          .map((field) => [field.name, data.assessment_data[field.name]])
          .filter(([, answer]) => Array.isArray(answer) ? answer.length > 0 : typeof answer === "string" && answer.trim().length > 0),
      )
      const payload = { ...data, assessment_data: sanitizedAnswers }

      if (assessment) await updateMutation.mutateAsync(payload)
      else await mutation.mutateAsync({ studentId, data: payload })

      reset(emptyForm)
      onClose()
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }

  if (!open) return null

  const isSaving = mutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-5">
      <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-blue-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-blue-950">
              {assessment ? "Editar instrumental" : "Novo instrumental"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Selecione o tipo para exibir somente o formulário correspondente.
            </p>
          </div>

          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100">
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {actionError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{actionError}</p>
            </div>
          )}

          <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <label className="mb-2 block text-sm font-semibold text-blue-950" htmlFor="instrument-type">
              Instrumental
            </label>
            <select
              id="instrument-type"
              value={selectedType ?? ""}
              disabled={Boolean(assessment)}
              onChange={(event) => handleTypeChange(event.target.value as InstrumentType)}
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:bg-zinc-100"
            >
              <option value="">Selecione</option>
              {instrumentTypes.map((type) => (
                <option key={type} value={type}>{instrumentDefinitions[type].label}</option>
              ))}
            </select>
            {errors.assessment_type && <p className="mt-1 text-sm text-red-500">{errors.assessment_type.message}</p>}
            {definition && <p className="mt-2 text-sm text-blue-800">{definition.description}</p>}
          </section>

          {definition && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="instrument-title">Título do registro</label>
                <input
                  id="instrument-title"
                  {...register("title")}
                  className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
              </div>

              {definition.sections.map((section) => (
                <section key={section.title} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <ClipboardList size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-950">{section.title}</h3>
                      {section.description && <p className="mt-1 text-sm text-zinc-500">{section.description}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {section.fields.map((field) =>
                      shouldShowField(field, answers) ? (
                        <InstrumentInput key={field.name} field={field} register={register} />
                      ) : null,
                    )}
                  </div>
                </section>
              ))}

              {errors.assessment_data && (
                <p className="text-sm text-red-500">Preencha ao menos uma resposta do instrumental.</p>
              )}
            </>
          )}

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-blue-100 bg-white py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!definition || isSaving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : "Salvar instrumental"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function shouldShowField(field: InstrumentField, answers: Record<string, InstrumentAnswer>) {
  if (!field.showWhen) return true

  const currentValue = answers[field.showWhen.field]
  if (field.showWhen.equals) return currentValue === field.showWhen.equals
  if (field.showWhen.includes) return Array.isArray(currentValue) && currentValue.includes(field.showWhen.includes)
  return true
}

type InstrumentInputProps = {
  field: InstrumentField
  register: ReturnType<typeof useForm<CreateAssessmentFormData>>["register"]
}

function InstrumentInput({ field, register }: InstrumentInputProps) {
  const fieldName = `assessment_data.${field.name}` as const
  const fullWidth = field.type === "textarea" || field.type === "checkbox-group"

  return (
    <div className={fullWidth ? "md:col-span-2" : undefined}>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{field.label}</label>

      {field.type === "textarea" && (
        <textarea
          {...register(fieldName)}
          className="min-h-28 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
          placeholder={field.placeholder}
        />
      )}

      {["text", "date", "number"].includes(field.type) && (
        <input
          {...register(fieldName)}
          type={field.type}
          min={field.type === "number" ? 0 : undefined}
          className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
          placeholder={field.placeholder}
        />
      )}

      {field.type === "select" && (
        <select {...register(fieldName)} className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500">
          <option value="">Selecione</option>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}

      {field.type === "checkbox-group" && (
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-blue-100 p-4 sm:grid-cols-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" value={option.value} {...register(fieldName)} className="h-4 w-4 rounded border-blue-200 text-blue-600" />
              {option.label}
            </label>
          ))}
        </div>
      )}

      {field.helpText && <p className="mt-1 text-xs text-zinc-500">{field.helpText}</p>}
    </div>
  )
}
