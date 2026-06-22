import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Assessment } from "../types/assessment";
import {
  createAssessmentSchema,
  type CreateAssessmentData,
  type CreateAssessmentFormData,
} from "../schemas/create-assessment-schema";

import { useCreateAssessment } from "../hooks/use-create-assessment";

type Props = {
  studentId: string;
  open: boolean;
  onClose: () => void;
  assessment?: Assessment | null;
};

export function CreateAssessmentModal({ studentId, open, onClose, assessment }: Props) {
  const mutation = useCreateAssessment(studentId);
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (data: CreateAssessmentData) => api.patch(`/assessments/student/${studentId}/${assessment?.id}`, {
      title: data.title,
      assessment_type: data.assessment_type,
      assessment_data: Object.fromEntries(Object.entries(data).filter(([key]) => !["title", "assessment_type"].includes(key)))
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assessments", studentId] })
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAssessmentFormData, unknown, CreateAssessmentData>({
    resolver: zodResolver(createAssessmentSchema),
  });

  useEffect(() => {
    if (open && assessment) reset({ title: assessment.title, assessment_type: assessment.assessment_type, ...assessment.assessment_data });
    if (open && !assessment) reset({});
  }, [open, assessment, reset]);

  async function onSubmit(data: CreateAssessmentData) {
    try {
      setActionError(null);

      if (assessment) await updateMutation.mutateAsync(data);
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
              {assessment ? "Editar avaliação / entrevista" : "Nova avaliação / entrevista"}
            </h2>

            <p className="text-sm text-zinc-500">
              Registre informações clínicas, pedagógicas e familiares do aluno.
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
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Título
            </label>

            <input
              {...register("title")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Ex: Entrevista inicial com responsáveis"
            />

            {errors.title && (
              <p className="mt-1 text-sm text-red-500">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Tipo
            </label>

            <select
              {...register("assessment_type")}
              className="w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Selecione</option>
              <option value="parent_interview">
                Entrevista com responsáveis
              </option>
              <option value="student_assessment">Avaliação do estudante</option>
              <option value="school_interview">
                Entrevista com equipe escolar
              </option>
              <option value="cognitive_assessment">Avaliação cognitiva</option>
              <option value="pei">PEI</option>
            </select>

            {errors.assessment_type && (
              <p className="mt-1 text-sm text-red-500">
                {errors.assessment_type.message}
              </p>
            )}
          </div>

          <TextArea
            label="Histórico do estudante"
            placeholder="Resumo do desenvolvimento, escolarização, saúde, rotina..."
            register={register("student_history")}
          />

          <TextArea
            label="Contexto familiar"
            placeholder="Informações da entrevista com pais ou responsáveis."
            register={register("family_context")}
          />

          <TextArea
            label="Contexto escolar"
            placeholder="Como o estudante participa das atividades escolares?"
            register={register("school_context")}
          />

          <TextArea
            label="Aspectos cognitivos"
            placeholder="Atenção, memória, percepção, linguagem, raciocínio..."
            register={register("cognitive_notes")}
          />

          <TextArea
            label="Comunicação"
            placeholder="Fala, gestos, comunicação alternativa, compreensão..."
            register={register("communication_notes")}
          />

          <TextArea
            label="Socialização"
            placeholder="Interação com colegas, adultos, participação..."
            register={register("social_notes")}
          />

          <TextArea
            label="Aspectos motores"
            placeholder="Coordenação motora, locomoção, equilíbrio, lateralidade..."
            register={register("motor_notes")}
          />

          <TextArea
            label="Aspectos emocionais"
            placeholder="Autorregulação, ansiedade, frustração, vínculo afetivo..."
            register={register("emotional_notes")}
          />

          <TextArea
            label="Dificuldades observadas"
            placeholder="Quais dificuldades são mais relevantes?"
            register={register("difficulties")}
          />

          <TextArea
            label="Potencialidades"
            placeholder="Interesses, habilidades, pontos fortes, reforçadores..."
            register={register("strengths")}
          />

          <div className="md:col-span-2">
            <TextArea
              label="Apoios recomendados"
              placeholder="Adaptações, recursos, estratégias pedagógicas, comunicação visual..."
              register={register("recommended_supports")}
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
              {mutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar avaliação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type TextAreaProps = {
  label: string;
  placeholder?: string;
  register: Record<string, unknown>;
};

function TextArea({ label, placeholder, register }: TextAreaProps) {
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
    </div>
  );
}
