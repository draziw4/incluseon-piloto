import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"

import {
  createStudentSchema,
  type CreateStudentData,
  type CreateStudentFormData
} from "../schemas/create-student-schema"

import { useCreateStudent } from "../hooks/use-create-student"
import { useUpdateStudent } from "../hooks/use-update-student"
import type { Student } from "../types/student"
import { classGroupOptions, schoolGradeOptions } from "../classroom-options"
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

type Props = {
  open: boolean
  onClose: () => void
  student?: Student | null
}

export function StudentFormModal({ open, onClose, student }: Props) {
  const createMutation = useCreateStudent()
  const updateMutation = useUpdateStudent()
  const [actionError, setActionError] = useState<string | null>(null)
  const isEditing = Boolean(student)

const {
  register,
  handleSubmit,
  reset,
  control,
  formState: { errors }
} = useForm<CreateStudentFormData, unknown, CreateStudentData>({
  resolver: zodResolver(createStudentSchema),
  defaultValues: getStudentFormValues(student)
})

const birthDate = useWatch({ control, name: "birth_date" })
const takesMedication = useWatch({ control, name: "takes_medication" })
const calculatedAge = calculateAge(birthDate)

useEffect(() => {
  if (open) {
    reset(getStudentFormValues(student))
  }
}, [open, reset, student])

function handleClose() {
  setActionError(null)
  onClose()
}

async function onSubmit(data: CreateStudentData) {
  try {
    setActionError(null)

    if (student) {
      await updateMutation.mutateAsync({
        studentId: student.id,
        data
      })
    } else {
      await createMutation.mutateAsync(data)
    }

    reset()
    handleClose()
  } catch (error) {
    setActionError(getApiErrorMessage(error))
  }
}

  const isPending = createMutation.isPending || updateMutation.isPending

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-950">
              {isEditing ? "Editar aluno" : "Cadastrar novo aluno"}
            </h2>

            <p className="text-sm text-zinc-500">
              {isEditing
                ? "Atualize os dados cadastrais e de acompanhamento."
                : "Preencha os dados iniciais do acompanhamento."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            Fechar
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {actionError && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 md:col-span-2">
              {actionError}
            </div>
          )}
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Nome do aluno
            </label>

            <input
              {...register("name")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Ex: João Silva"
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-500">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Data de nascimento
            </label>

            <input
              type="date"
              {...register("birth_date")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
            />

            {errors.birth_date && (
              <p className="mt-1 text-sm text-red-500">
                {errors.birth_date.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Idade atual
            </label>

            <div className="w-full rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-zinc-700">
              {calculatedAge === null
                ? "Calculada pela data de nascimento"
                : `${calculatedAge} ${calculatedAge === 1 ? "ano" : "anos"}`}
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              Atualizada automaticamente.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Diagnóstico
            </label>

            <input
              {...register("diagnosis")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Ex: TEA, DI, TDAH..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Potencialidades
            </label>

            <textarea
              {...register("strengths")}
              className="min-h-24 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Habilidades, interesses, facilidades e situações em que o aluno se destaca."
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Dificuldades
            </label>

            <textarea
              {...register("difficulties")}
              className="min-h-24 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Barreiras, necessidades de apoio e situações que exigem mais acompanhamento."
            />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 md:col-span-2">
            <label className="flex items-center gap-3 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                {...register("takes_medication")}
                className="h-4 w-4 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
              />
              O aluno faz uso de medicação atualmente
            </label>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Quais medicamentos?
              </label>

              <textarea
                {...register("medications")}
                disabled={!takesMedication}
                className="min-h-20 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                placeholder={takesMedication ? "Informe nome, dosagem e horários, quando conhecidos." : "Marque a opção acima para informar os medicamentos."}
              />

              {errors.medications && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.medications.message}
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Escola
            </label>

            <input
              {...register("school_name")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Nome da escola"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Ano ou série escolar
            </label>

            <select
              {...register("school_grade")}
              className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Selecione o ano ou série</option>
              {schoolGradeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            {errors.school_grade && (
              <p className="mt-1 text-sm text-red-500">
                {errors.school_grade.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Turma
            </label>

            <select
              {...register("class_group")}
              className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Selecione a turma</option>
              {classGroupOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            {errors.class_group && (
              <p className="mt-1 text-sm text-red-500">
                {errors.class_group.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Responsável
            </label>

            <input
              {...register("guardian_name")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Nome do responsável"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Telefone do responsável
            </label>

            <input
              {...register("guardian_phone")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Comunicação
            </label>

            <textarea
              {...register("communication_notes")}
              className="min-h-24 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Como o aluno se comunica? Usa fala, gestos, PECS, comunicação alternativa?"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Sensibilidade sensorial
            </label>

            <textarea
              {...register("sensory_notes")}
              className="min-h-24 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Sensibilidades auditivas, visuais, táteis, alimentares..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Observações gerais
            </label>

            <textarea
              {...register("general_observations")}
              className="min-h-24 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Informações importantes para o acompanhamento."
            />
          </div>

          <div className="mt-2 flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Cadastrar aluno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function getStudentFormValues(student?: Student | null): CreateStudentFormData {
  return {
    name: student?.name ?? "",
    birth_date: student?.birth_date ?? "",
    diagnosis: student?.diagnosis ?? "",
    strengths: student?.strengths ?? "",
    difficulties: student?.difficulties ?? "",
    takes_medication: student?.takes_medication ?? false,
    medications: student?.medications ?? "",
    school_name: student?.school_name ?? "",
    school_grade: student?.school_grade ?? "",
    class_group: student?.class_group ?? "",
    guardian_name: student?.guardian_name ?? "",
    guardian_phone: student?.guardian_phone ?? "",
    communication_notes: student?.communication_notes ?? "",
    sensory_notes: student?.sensory_notes ?? "",
    general_observations: student?.general_observations ?? ""
  }
}

function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null

  const [year, month, day] = birthDate.split("-").map(Number)
  if (!year || !month || !day) return null

  const today = new Date()
  let age = today.getFullYear() - year
  if (
    today.getMonth() + 1 < month
    || (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age -= 1
  }

  return age >= 0 ? age : null
}
