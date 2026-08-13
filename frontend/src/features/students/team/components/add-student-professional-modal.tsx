import { useState } from "react";

import { useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { AlertCircle, Search, UserCheck } from "lucide-react";
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message";
import {
  addStudentProfessionalSchema,
  type AddStudentProfessionalData,
  type AddStudentProfessionalFormData,
} from "../schemas/add-student-professional-schema";

import { useAddStudentProfessional } from "../hooks/use-add-student-professional";

import { useSearchUsers } from "../../../users/hooks/use-search-users";

import type { UserSearchResult } from "../../../users/types/user-search-result";
import {
  getStudentRolePreset,
  isStudentPermissionAllowed,
  type StudentPermissionKey,
} from "../access";

type Props = {
  studentId: string;
  open: boolean;
  onClose: () => void;
};

export function AddStudentProfessionalModal({
  studentId,
  open,
  onClose,
}: Props) {
  const mutation = useAddStudentProfessional(studentId);
  const [actionError, setActionError] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );

  const { data: users = [], isLoading: isSearchingUsers } =
    useSearchUsers(userSearch);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<
    AddStudentProfessionalFormData,
    unknown,
    AddStudentProfessionalData
  >({
    resolver: zodResolver(addStudentProfessionalSchema),
    defaultValues: {
      can_view: true,
      can_register_aba: false,
      can_create_assessment: false,
      can_create_pei: false,
      can_generate_ai_report: false,
      can_view_reports: false,
    },
  });

  const role = useWatch({
    control,
    name: "role_in_student",
  });

  function applyRolePreset(
    selectedRole: AddStudentProfessionalData["role_in_student"],
    professional: UserSearchResult | null = selectedUser,
  ) {
    const preset = getStudentRolePreset(selectedRole, professional?.allowed_tools)
    for (const [permission, value] of Object.entries(preset)) {
      setValue(permission as StudentPermissionKey, value)
    }
  }

  async function onSubmit(data: AddStudentProfessionalData) {
    if (!selectedUser) {
      setActionError("Selecione um profissional antes de vincular.");
      return;
    }

    try {
      setActionError(null);

      await mutation.mutateAsync({
        studentId,
        data: {
          ...data,
          user_id: selectedUser.id,
        },
      });

      reset();
      setSelectedUser(null);
      setUserSearch("");
      onClose();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  function handleClose() {
    reset();
    setSelectedUser(null);
    setUserSearch("");
    setActionError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-950">
            Vincular profissional
          </h2>

          <p className="text-sm text-zinc-500">
            Defina qual profissional terá acesso ao aluno e quais ações ele
            poderá executar.
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
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Buscar profissional
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-blue-100 px-4 py-3 focus-within:border-blue-500">
              <Search size={18} className="text-zinc-400" />

              <input
                value={userSearch}
                onChange={(event) => {
                  setUserSearch(event.target.value);
                  setSelectedUser(null);
                }}
                className="w-full outline-none"
                placeholder="Digite nome ou email do profissional"
              />
            </div>

            {isSearchingUsers && (
              <p className="mt-2 text-sm text-zinc-500">Buscando usuários...</p>
            )}

            {!selectedUser && users.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-xl border border-blue-100 bg-white">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      const studentRole = studentRoleForUserRole(user.role);
                      setSelectedUser(user);
                      setUserSearch(`${user.name} — ${user.email}`);
                      if (studentRole) {
                        setValue("role_in_student", studentRole);
                        applyRolePreset(studentRole, user);
                      }
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-blue-50"
                  >
                    <div>
                      <p className="font-medium text-blue-950">{user.name}</p>

                      <p className="text-sm text-zinc-500">{user.email}</p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {formatUserRole(user.role)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <UserCheck size={18} />
                </div>

                <div>
                  <p className="font-semibold text-blue-950">
                    {selectedUser.name}
                  </p>

                  <p className="text-sm text-blue-700">{selectedUser.email}</p>
                </div>
              </div>
            )}

            {!selectedUser && (
              <p className="mt-2 text-xs text-zinc-500">
                Selecione um profissional antes de vincular.
              </p>
            )}

            {errors.user_id && (
              <p className="mt-1 text-sm text-red-500">
                {errors.user_id.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Papel no aluno
            </label>

            <select
              {...register("role_in_student")}
              value={role ?? ""}
              aria-disabled={Boolean(selectedUser)}
              onChange={(event) => {
                if (selectedUser) return;
                const value = event.target
                  .value as AddStudentProfessionalData["role_in_student"];

                setValue("role_in_student", value);
                applyRolePreset(value);
              }}
              className={`w-full rounded-xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-500 ${selectedUser ? "cursor-not-allowed bg-zinc-50 text-zinc-600" : ""}`}
            >
              <option value="">Selecione</option>

              <option value="support">Profissional de apoio</option>

              <option value="aee">Profissional AEE</option>

              <option value="psychologist">Psicólogo</option>

              <option value="supervisor">Supervisor</option>

              <option value="viewer">Visualizador</option>
            </select>

            {errors.role_in_student && (
              <p className="mt-1 text-sm text-red-500">
                {errors.role_in_student.message}
              </p>
            )}

            {role && (
              <p className="mt-2 text-xs text-blue-600">
                {selectedUser
                  ? "O papel corresponde ao nível profissional aprovado desta conta."
                  : "As permissões serão sugeridas com base no papel selecionado."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <PermissionCheckbox
              label="Ver aluno"
              inputProps={register("can_view")}
              disabled={!isStudentPermissionAllowed(selectedUser?.allowed_tools, "can_view")}
            />

            <PermissionCheckbox
              label="Registrar ABA"
              inputProps={register("can_register_aba")}
              disabled={!isStudentPermissionAllowed(selectedUser?.allowed_tools, "can_register_aba")}
            />

            <PermissionCheckbox
              label="Criar avaliação"
              inputProps={register("can_create_assessment")}
              disabled={!isStudentPermissionAllowed(selectedUser?.allowed_tools, "can_create_assessment")}
            />

            <PermissionCheckbox
              label="Criar PEI"
              inputProps={register("can_create_pei")}
              disabled={!isStudentPermissionAllowed(selectedUser?.allowed_tools, "can_create_pei")}
            />

            <PermissionCheckbox
              label="Gerar relatório IA"
              inputProps={register("can_generate_ai_report")}
              disabled={!isStudentPermissionAllowed(selectedUser?.allowed_tools, "can_generate_ai_report")}
            />

            <PermissionCheckbox
              label="Ver relatórios"
              inputProps={register("can_view_reports")}
              disabled={!isStudentPermissionAllowed(selectedUser?.allowed_tools, "can_view_reports")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={mutation.isPending || !selectedUser}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mutation.isPending ? "Vinculando..." : "Vincular profissional"}
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

function formatUserRole(role: string) {
  const labels: Record<string, string> = {
    admin: "Admin",
    psychologist: "Psicólogo",
    supervisor: "Supervisor",
    aee: "AEE",
    support_professional: "PA — Profissional de apoio",
    school: "Escola",
    guardian: "Responsável",
  };

  return labels[role] || role;
}

function studentRoleForUserRole(role: string): AddStudentProfessionalData["role_in_student"] | null {
  const roles: Record<string, AddStudentProfessionalData["role_in_student"]> = {
    psychologist: "psychologist",
    supervisor: "supervisor",
    aee: "aee",
    support_professional: "support",
    school: "viewer",
    guardian: "viewer",
  }

  return roles[role] ?? null
}
