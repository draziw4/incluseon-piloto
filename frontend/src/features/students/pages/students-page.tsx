import { useMemo, useState, type FormEvent } from "react"

import { Check, FolderPlus, Plus, Search, Users, X } from "lucide-react"

import { hasTool } from "@/features/auth/access"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"
import { StudentFormModal } from "../components/create-student-modal"
import { DeleteStudentModal } from "../components/delete-student-modal"
import { StudentFolderSection } from "../components/student-folder-section"
import { groupStudentsIntoFolders } from "../folders/group-students"
import { useStudentFolderMutations, useStudentFolders } from "../folders/hooks"
import { useStudents } from "../hooks/use-students"
import type { Student } from "../types/student"

export function StudentsPage() {
  const [search, setSearch] = useState("")
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [showFolderCreator, setShowFolderCreator] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [folderActionError, setFolderActionError] = useState("")
  const { user } = useAuth()
  const canManageStudents = hasTool(user, "student_management")
  const isAdmin = user?.role === "admin"

  const {
    data,
    isLoading,
    isError,
  } = useStudents({
    page: 1,
    per_page: 100,
    search,
  })
  const {
    data: customFolders = [],
    isLoading: isLoadingFolders,
    isError: isFolderLoadError,
  } = useStudentFolders()
  const { createMutation, renameMutation, deleteMutation } = useStudentFolderMutations()

  const students = useMemo(() => data?.items ?? [], [data?.items])
  const folderViews = useMemo(
    () => groupStudentsIntoFolders(students, customFolders),
    [students, customFolders],
  )

  function cancelFolderCreation() {
    setNewFolderName("")
    setShowFolderCreator(false)
    setFolderActionError("")
  }

  async function createFolder(event: FormEvent) {
    event.preventDefault()
    const name = newFolderName.trim()
    if (!name) return

    try {
      setFolderActionError("")
      await createMutation.mutateAsync(name)
      setNewFolderName("")
      setShowFolderCreator(false)
    } catch (error) {
      setFolderActionError(getApiErrorMessage(error))
    }
  }

  async function renameFolder(folderId: number, name: string) {
    try {
      setFolderActionError("")
      await renameMutation.mutateAsync({ folderId, name })
      return true
    } catch (error) {
      setFolderActionError(getApiErrorMessage(error))
      return false
    }
  }

  async function deleteFolder(folderId: number, name: string) {
    const confirmed = window.confirm(
      `Excluir a pasta “${name}”? Os alunos não serão excluídos e voltarão para a organização automática por turma.`,
    )
    if (!confirmed) return

    try {
      setFolderActionError("")
      await deleteMutation.mutateAsync(folderId)
    } catch (error) {
      setFolderActionError(getApiErrorMessage(error))
    }
  }

  const isLoadingPage = isLoading || isLoadingFolders
  const hasLoadError = isError || isFolderLoadError

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-950">Meus alunos</h1>
          <p className="text-sm text-zinc-500">
            Organize seus alunos em pastas e acesse os perfis de acompanhamento.
          </p>
        </div>

        {canManageStudents ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setFolderActionError("")
                setShowFolderCreator(true)
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md"
            >
              <FolderPlus size={18} />
              Nova pasta
            </button>
            <button
              type="button"
              onClick={() => setOpenCreateModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              <Plus size={18} />
              Novo aluno
            </button>
          </div>
        ) : null}
      </div>

      {showFolderCreator ? (
        <form
          onSubmit={createFolder}
          className="motion-notice flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <FolderPlus size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <label htmlFor="new-folder-name" className="mb-1 block text-sm font-semibold text-blue-950">
              Nome da nova pasta
            </label>
            <input
              id="new-folder-name"
              autoFocus
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => event.key === "Escape" && cancelFolderCreation()}
              maxLength={100}
              placeholder="Ex: Atendimento de terça-feira"
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 sm:self-end">
            <button
              type="submit"
              disabled={createMutation.isPending || !newFolderName.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <Check size={17} />
              {createMutation.isPending ? "Criando..." : "Criar pasta"}
            </button>
            <button
              type="button"
              onClick={cancelFolderCreation}
              aria-label="Cancelar criação da pasta"
              className="rounded-xl border border-blue-200 bg-white p-2.5 text-zinc-500 hover:bg-zinc-50"
            >
              <X size={18} />
            </button>
          </div>
        </form>
      ) : null}

      {folderActionError ? (
        <div role="alert" className="motion-notice rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {folderActionError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 px-4 py-3 transition-colors focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <Search size={18} className="text-zinc-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar aluno pelo nome..."
            className="w-full outline-none"
          />
        </div>
      </div>

      {isLoadingPage ? (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">
          Carregando alunos e pastas...
        </div>
      ) : null}

      {hasLoadError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
          Não foi possível carregar os alunos e as pastas.
        </div>
      ) : null}

      {!isLoadingPage && !hasLoadError && folderViews.length > 0 ? (
        <div className="space-y-4">
          {folderViews.map((folder) => (
            <StudentFolderSection
              key={folder.key}
              folder={folder}
              canManageStudents={canManageStudents}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              onEditStudent={setEditingStudent}
              onDeleteStudent={setDeletingStudent}
              onRename={renameFolder}
              onDeleteFolder={deleteFolder}
            />
          ))}
        </div>
      ) : null}

      {!isLoadingPage && !hasLoadError && folderViews.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users size={28} />
          </div>
          <h2 className="text-lg font-bold text-blue-950">Nenhum aluno ou pasta encontrado</h2>
          <p className="mt-1 max-w-md text-sm text-zinc-500">
            Crie uma pasta de organização ou cadastre o primeiro aluno para iniciar o acompanhamento.
          </p>
          {canManageStudents ? (
            <button
              type="button"
              onClick={() => setOpenCreateModal(true)}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Cadastrar primeiro aluno
            </button>
          ) : null}
        </div>
      ) : null}

      {canManageStudents ? (
        <StudentFormModal
          open={openCreateModal || Boolean(editingStudent)}
          student={editingStudent}
          onClose={() => {
            setOpenCreateModal(false)
            setEditingStudent(null)
          }}
        />
      ) : null}

      {canManageStudents ? (
        <DeleteStudentModal student={deletingStudent} onClose={() => setDeletingStudent(null)} />
      ) : null}
    </div>
  )
}
