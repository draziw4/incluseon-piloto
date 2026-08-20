import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  createBehaviorRecordSchema,
  type CreateBehaviorRecordData,
  type CreateBehaviorRecordFormData,
} from "../schemas/create-behavior-record-schema";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { BehaviorRecord } from "../types/behavior-record";
import { AlertCircle } from "lucide-react";
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message";
import { useCreateBehaviorRecord } from "../hooks/use-create-behavior-record";
import {
  ANTECEDENT_CATEGORIES,
  BEHAVIOR_CATEGORIES,
  FUNCTION_HYPOTHESES,
  SCHOOL_ENVIRONMENTS,
  STRATEGY_OPTIONS,
} from "../constants/behavior-record-options";

type Props = {
  studentId: string;
  open: boolean;
  onClose: () => void;
  record?: BehaviorRecord | null;
};

export function CreateBehaviorRecordModal({ studentId, open, onClose, record }: Props) {
  const mutation = useCreateBehaviorRecord(studentId);
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (data: CreateBehaviorRecordData) => api.patch(`/behavior-records/student/${studentId}/${record?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["behavior-records", studentId] })
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBehaviorRecordFormData, unknown, CreateBehaviorRecordData>({
    resolver: zodResolver(createBehaviorRecordSchema),
  });

  useEffect(() => {
    if (open && record) reset({
      ...record,
      strategy_effective: record.strategy_effective === null || record.strategy_effective === undefined ? "" : String(record.strategy_effective),
      environment: record.environment ?? undefined,
      intensity: record.intensity ?? undefined,
      duration_minutes: record.duration_minutes ?? undefined
    } as unknown as CreateBehaviorRecordFormData);
    if (open && !record) reset({});
  }, [open, record, reset]);

  async function onSubmit(data: CreateBehaviorRecordData) {
    try {
      setActionError(null);

      if (record) await updateMutation.mutateAsync(data);
      else await mutation.mutateAsync({ studentId, data });

      reset();
      onClose();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-950">
              {record ? "Editar observação comportamental" : "Nova observação comportamental"}
            </h2>

            <p className="text-sm text-zinc-500">
              Registre antecedente, comportamento, consequência e manejo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
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
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />

                <p>{actionError}</p>
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Antecedente / gatilho
            </label>

            <select
              {...register("antecedent")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Selecione o antecedente</option>

              {ANTECEDENT_CATEGORIES.map((antecedent) => (
                <option key={antecedent} value={antecedent}>
                  {antecedent}
                </option>
              ))}
            </select>

            {errors.antecedent && (
              <p className="mt-1 text-sm text-red-500">
                {errors.antecedent.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Comportamento observado
            </label>

            <select
              {...register("behavior")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Selecione o comportamento</option>

              {BEHAVIOR_CATEGORIES.map((behavior) => (
                <option key={behavior} value={behavior}>
                  {behavior}
                </option>
              ))}
            </select>

            {errors.behavior && (
              <p className="mt-1 text-sm text-red-500">
                {errors.behavior.message}
              </p>
            )}
          </div>

          <TextAreaField
            label="Consequência"
            error={errors.consequence?.message}
            placeholder="O que aconteceu depois? Como a equipe respondeu?"
            register={register("consequence")}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Estratégia utilizada
            </label>

            <select
              {...register("strategy_used")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Selecione a estratégia</option>

              {STRATEGY_OPTIONS.map((strategy) => (
                <option key={strategy} value={strategy}>
                  {strategy}
                </option>
              ))}
            </select>

            {errors.strategy_used && (
              <p className="mt-1 text-sm text-red-500">
                {errors.strategy_used.message}
              </p>
            )}
          </div>

          <div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Ambiente
              </label>

              <select
                {...register("environment")}
                className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Selecione o ambiente</option>

                {SCHOOL_ENVIRONMENTS.map((environment) => (
                  <option key={environment} value={environment}>
                    {environment}
                  </option>
                ))}
              </select>

              {errors.environment && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.environment.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Pessoas presentes
            </label>

            <input
              {...register("people_present")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Professor, colegas, cuidador..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Intensidade de 1 a 10
            </label>

            <input
              type="number"
              min={1}
              max={10}
              {...register("intensity")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Ex: 7"
            />

            {errors.intensity && (
              <p className="mt-1 text-sm text-red-500">
                {errors.intensity.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Duração em minutos
            </label>

            <input
              type="number"
              min={0}
              {...register("duration_minutes")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Ex: 12"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Hipótese da função do comportamento
            </label>

            <select
              {...register("function_hypothesis")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Selecione a hipótese</option>

              {FUNCTION_HYPOTHESES.map((hypothesis) => (
                <option key={hypothesis} value={hypothesis}>
                  {hypothesis}
                </option>
              ))}
            </select>

            {errors.function_hypothesis && (
              <p className="mt-1 text-sm text-red-500">
                {errors.function_hypothesis.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Observações
            </label>

            <textarea
              {...register("observations")}
              className="min-h-24 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Informações adicionais importantes."
            />
          </div>

          <div className="mt-2 flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={mutation.isPending || updateMutation.isPending}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type TextAreaFieldProps = {
  label: string;
  placeholder?: string;
  error?: string;
  register: ReturnType<
    typeof useForm<CreateBehaviorRecordFormData>
  >["register"] extends (...args: never[]) => infer R
    ? R
    : never;
};

function TextAreaField({
  label,
  placeholder,
  error,
  register,
}: TextAreaFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
      </label>

      <textarea
        {...register}
        className="min-h-28 w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
        placeholder={placeholder}
      />

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
