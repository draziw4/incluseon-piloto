import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"

import {
  createStudentSchema,
  type CreateStudentData,
  type CreateStudentFormData
} from "../schemas/create-student-schema"

import { useCreateStudent } from "../hooks/use-create-student"
import { useUpdateStudent } from "../hooks/use-update-student"
import type { Student } from "../types/student"
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
  formState: { errors }
} = useForm<CreateStudentFormData, unknown, CreateStudentData>({
  resolver: zodResolver(createStudentSchema),
  defaultValues: getStudentFormValues(student)
})

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
              Idade
            </label>

            <input
              type="number"
              {...register("age")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Ex: 12"
            />

            {errors.age && (
              <p className="mt-1 text-sm text-red-500">
                {errors.age.message}
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
              Diagnóstico
            </label>

            <input
              {...register("diagnosis")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Ex: TEA, DI, TDAH..."
            />
          </div>

          <div>
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
    age: student?.age ?? "",
    birth_date: student?.birth_date ?? "",
    diagnosis: student?.diagnosis ?? "",
    school_name: student?.school_name ?? "",
    guardian_name: student?.guardian_name ?? "",
    guardian_phone: student?.guardian_phone ?? "",
    communication_notes: student?.communication_notes ?? "",
    sensory_notes: student?.sensory_notes ?? "",
    general_observations: student?.general_observations ?? ""
  }
}
