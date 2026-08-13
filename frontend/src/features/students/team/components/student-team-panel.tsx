import { useState } from "react";

import { Plus, Users, AlertCircle } from "lucide-react";
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message";

import { useStudentProfessionals } from "../hooks/use-student-professionals";

import { useRemoveStudentProfessional } from "../hooks/use-remove-student-professional";
import type { StudentProfessional } from "../types/student-professional";

import { StudentProfessionalCard } from "./student-professional-card";

import { AddStudentProfessionalModal } from "./add-student-professional-modal";

import { EditStudentProfessionalModal } from "./edit-student-professional-modal";

type Props = {
  studentId: string;
  canManage: boolean;
};

export function StudentTeamPanel({ studentId, canManage }: Props) {
  const [openAddModal, setOpenAddModal] = useState(false);

  const [editingProfessional, setEditingProfessional] =
    useState<StudentProfessional | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: professionals,
    isLoading,
    isError,
  } = useStudentProfessionals(studentId);

  const removeMutation = useRemoveStudentProfessional(studentId);

  async function handleRemove(professional: StudentProfessional) {
    const confirmed = window.confirm(
      `Deseja remover ${
        professional.user?.name || `Usuário #${professional.user_id}`
      } da equipe deste aluno?`,
    );

    if (!confirmed) return;

    try {
      setActionError(null);

      await removeMutation.mutateAsync({
        studentId,
        linkId: professional.id,
      });
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold text-blue-950">
            Equipe e permissões
          </h2>

          <p className="text-sm text-zinc-500">
            {canManage
              ? "Gerencie quais profissionais têm acesso a este aluno e o que cada um pode fazer."
              : "Consulte os profissionais vinculados e as permissões definidas pela equipe responsável."}
          </p>
        </div>

        {canManage ? <button
          type="button"
          onClick={() => setOpenAddModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Vincular profissional
        </button> : null}
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">
          Carregando equipe...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
          Não foi possível carregar a equipe.
        </div>
      )}
      {actionError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div>
              <h3 className="font-bold">Não foi possível concluir a ação</h3>

              <p className="mt-1 text-sm">{actionError}</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError && professionals && professionals.length > 0 && (
        <div className="space-y-4">
          {professionals.map((professional) => (
            <StudentProfessionalCard
              key={professional.id}
              professional={professional}
              canManage={canManage}
              onEdit={setEditingProfessional}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && professionals?.length === 0 && (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users size={28} />
          </div>

          <h3 className="text-lg font-bold text-blue-950">
            Nenhum profissional vinculado
          </h3>

          <p className="mt-1 max-w-md text-sm text-zinc-500">
            Vincule profissionais de apoio, AEE, psicólogos ou supervisores para
            trabalho colaborativo.
          </p>

          {canManage ? <button
            type="button"
            onClick={() => setOpenAddModal(true)}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Vincular primeiro profissional
          </button> : null}
        </div>
      )}

      {canManage ? <AddStudentProfessionalModal
        studentId={studentId}
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
      /> : null}

      {canManage ? <EditStudentProfessionalModal
        studentId={studentId}
        professional={editingProfessional}
        open={!!editingProfessional}
        onClose={() => setEditingProfessional(null)}
      /> : null}
    </div>
  );
}
