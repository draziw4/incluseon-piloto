import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import type {
  StudentProfessional,
  StudentProfessionalRole,
} from "../types/student-professional";

import { AlertCircle } from "lucide-react";
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message";

import { useUpdateStudentProfessional } from "../hooks/use-update-student-professional";
import {
  getStudentRolePreset,
  isStudentPermissionAllowed,
  type StudentPermissionKey,
} from "../access";

type FormData = {
  role_in_student: StudentProfessionalRole;
  can_view: boolean;
  can_register_aba: boolean;
  can_create_assessment: boolean;
  can_create_pei: boolean;
  can_generate_ai_report: boolean;
  can_view_reports: boolean;
};

type Props = {
  studentId: string;
  professional: StudentProfessional | null;
  open: boolean;
  onClose: () => void;
};

export function EditStudentProfessionalModal({
  studentId,
  professional,
  open,
  onClose,
}: Props) {
  const mutation = useUpdateStudentProfessional(studentId);

  const { register, handleSubmit, reset } = useForm<FormData>();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (professional) {
      const normalized = {
        role_in_student: professional.role_in_student,
        ...Object.fromEntries(
          (Object.keys(getStudentRolePreset(professional.role_in_student, professional.user?.allowed_tools)) as StudentPermissionKey[])
            .map((permission) => [
              permission,
              professional[permission] && isStudentPermissionAllowed(professional.user?.allowed_tools, permission),
            ]),
        ),
      } as FormData;
      reset(normalized);
    }
  }, [professional, reset]);

  async function onSubmit(data: FormData) {
    if (!professional) return;

    try {
      setActionError(null);

      await mutation.mutateAsync({
        studentId,
        linkId: professional.id,
        data,
      });

      onClose();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  if (!open || !professional) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-950">
            Editar permissões
          </h2>

          <p className="text-sm text-zinc-500">
            Altere as permissões deste profissional no aluno. O papel é definido pelo perfil aprovado da conta.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {actionError && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />

                <p>{actionError}</p>
              </div>
            </div>
          )}
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="font-semibold text-blue-950">
              {professional.user?.name || `Usuário #${professional.user_id}`}
            </p>

            <p className="text-sm text-blue-700">
              {professional.user?.email || "Email não informado"}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Papel no aluno
            </label>

            <input type="hidden" {...register("role_in_student")} />
            <div className="rounded-xl border border-blue-100 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700">
              {formatStudentRole(professional.role_in_student)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <PermissionCheckbox
              label="Ver aluno"
              inputProps={register("can_view")}
              disabled={!isStudentPermissionAllowed(professional.user?.allowed_tools, "can_view")}
            />

            <PermissionCheckbox
              label="Registrar ABA"
              inputProps={register("can_register_aba")}
              disabled={!isStudentPermissionAllowed(professional.user?.allowed_tools, "can_register_aba")}
            />

            <PermissionCheckbox
              label="Criar avaliação"
              inputProps={register("can_create_assessment")}
              disabled={!isStudentPermissionAllowed(professional.user?.allowed_tools, "can_create_assessment")}
            />

            <PermissionCheckbox
              label="Criar PEI"
              inputProps={register("can_create_pei")}
              disabled={!isStudentPermissionAllowed(professional.user?.allowed_tools, "can_create_pei")}
            />

            <PermissionCheckbox
              label="Gerar relatório IA"
              inputProps={register("can_generate_ai_report")}
              disabled={!isStudentPermissionAllowed(professional.user?.allowed_tools, "can_generate_ai_report")}
            />

            <PermissionCheckbox
              label="Ver relatórios"
              inputProps={register("can_view_reports")}
              disabled={!isStudentPermissionAllowed(professional.user?.allowed_tools, "can_view_reports")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                onClose();
              }}
              className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mutation.isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type PermissionCheckboxProps = {
  label: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  disabled: boolean;
};

function PermissionCheckbox({ label, inputProps, disabled }: PermissionCheckboxProps) {
  return (
    <label className={`flex items-center justify-between rounded-xl border border-blue-100 p-4 text-sm text-zinc-700 ${disabled ? "bg-zinc-50 opacity-60" : ""}`}>
      <span>{label}{disabled ? " — indisponível para o perfil" : ""}</span>

      <input
        type="checkbox"
        {...inputProps}
        disabled={disabled}
        className="h-4 w-4 rounded border-zinc-300 text-blue-600"
      />
    </label>
  );
}

function formatStudentRole(role: StudentProfessionalRole) {
  const labels: Record<StudentProfessionalRole, string> = {
    owner: "Responsável principal",
    support: "PA — Profissional de apoio",
    aee: "AEE — Atendimento Educacional Especializado",
    psychologist: "Psicólogo",
    supervisor: "Supervisor",
    viewer: "Visualizador",
  }

  return labels[role]
}
