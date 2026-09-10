import { useState, type FormEvent } from "react"
import { Check, ChevronDown, ChevronRight, Folder, FolderOpen, Pencil, Trash2, X } from "lucide-react"

import type { StudentFolderView } from "../folders/types"
import { StudentCard } from "./student-card"


type Props = {
  folder: StudentFolderView
  canManageStudents: boolean
  currentUserId?: number
  isAdmin: boolean
  onEditStudent: (student: StudentFolderView["students"][number]) => void
  onDeleteStudent: (student: StudentFolderView["students"][number]) => void
  onRename: (folderId: number, name: string) => Promise<boolean>
  onDeleteFolder: (folderId: number, name: string) => Promise<void>
}

export function StudentFolderSection({
  folder,
  canManageStudents,
  currentUserId,
  isAdmin,
  onEditStudent,
  onDeleteStudent,
  onRename,
  onDeleteFolder,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftName, setDraftName] = useState(folder.label)
  const [isSaving, setIsSaving] = useState(false)

  async function submitRename(event: FormEvent) {
    event.preventDefault()
    const name = draftName.trim()
    if (!folder.folderId || !name) return
    if (name === folder.label) {
      setIsRenaming(false)
      return
    }

    try {
      setIsSaving(true)
      const wasRenamed = await onRename(folder.folderId, name)
      if (wasRenamed) setIsRenaming(false)
    } finally {
      setIsSaving(false)
    }
  }

  function cancelRename() {
    setDraftName(folder.label)
    setIsRenaming(false)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/40 shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-label={isExpanded ? `Fechar pasta ${folder.label}` : `Abrir pasta ${folder.label}`}
          aria-expanded={isExpanded}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          {isExpanded ? <FolderOpen size={22} /> : <Folder size={22} />}
        </button>

        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <form onSubmit={submitRename} className="motion-notice flex max-w-md items-center gap-2">
              <input
                autoFocus
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && cancelRename()}
                maxLength={100}
                aria-label="Novo nome da pasta"
                className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-950 outline-none focus:border-blue-500"
              />
              <button type="submit" disabled={isSaving || !draftName.trim()} aria-label="Salvar nome" className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50">
                <Check size={17} />
              </button>
              <button type="button" onClick={cancelRename} aria-label="Cancelar renomeação" className="rounded-lg p-2 text-zinc-500 hover:bg-white">
                <X size={17} />
              </button>
            </form>
          ) : folder.isCustom && folder.canManage ? (
            <button
              type="button"
              onClick={() => setIsRenaming(true)}
              title="Clique para renomear"
              className="group flex max-w-full items-center gap-2 text-left font-bold text-blue-950 hover:text-blue-700"
            >
              <span className="truncate">{folder.label}</span>
              <Pencil size={14} className="shrink-0 opacity-60 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100" />
            </button>
          ) : (
            <p className="truncate font-bold text-blue-950">{folder.label}</p>
          )}
          <p className="truncate text-sm text-zinc-500">{folder.description}</p>
        </div>

        <span className="hidden shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 sm:inline">
          {folder.students.length} {folder.students.length === 1 ? "aluno" : "alunos"}
        </span>

        {folder.isCustom && folder.canManage && folder.folderId ? (
          <button
            type="button"
            onClick={() => {
              if (folder.folderId) void onDeleteFolder(folder.folderId, folder.label)
            }}
            aria-label={`Excluir pasta ${folder.label}`}
            title="Excluir pasta sem apagar os alunos"
            className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={17} />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-label={isExpanded ? "Recolher conteúdo" : "Mostrar conteúdo"}
          className="rounded-lg p-2 text-blue-600 hover:bg-blue-100"
        >
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded ? (
        <div className="motion-reveal border-t border-blue-100 bg-white p-4">
          {folder.students.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {folder.students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  canManage={canManageStudents && (isAdmin || student.psychologist_id === currentUserId)}
                  onEdit={onEditStudent}
                  onDelete={onDeleteStudent}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 px-4 text-center text-sm text-zinc-500">
              Pasta vazia. Selecione esta pasta ao cadastrar ou editar um aluno.
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
