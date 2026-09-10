import { useMemo, useState } from "react"

import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, Search, Users } from "lucide-react"

import { useStudents } from "../hooks/use-students"
import { StudentCard } from "../components/student-card"
import { StudentFormModal } from "../components/create-student-modal"
import { DeleteStudentModal } from "../components/delete-student-modal"
import type { Student } from "../types/student"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { hasTool } from "@/features/auth/access"
import { formatStudentClassroom } from "../classroom-options"

export function StudentsPage() {
  const [search, setSearch] = useState("")
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => new Set())
  const { user } = useAuth()
  const canManageStudents = hasTool(user, "student_management")

  const {
    data,
    isLoading,
    isError
  } = useStudents({ 
    page: 1,
    per_page: 100,
    search
  })

  const students = useMemo(() => data?.items ?? [], [data?.items])
  const classroomFolders = useMemo(() => groupStudentsByClassroom(students), [students])

  function toggleFolder(folderKey: string) {
    setCollapsedFolders((current) => {
      const updated = new Set(current)
      if (updated.has(folderKey)) updated.delete(folderKey)
      else updated.add(folderKey)
      return updated
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-950">
            Meus alunos
          </h1>

          <p className="text-sm text-zinc-500">
            Gerencie os alunos acompanhados e acesse seus perfis clínicos.
          </p>
        </div>

        {canManageStudents ? <button
          onClick={() => setOpenCreateModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Novo aluno
        </button> : null}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 px-4 py-3">
          <Search size={18} className="text-zinc-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar aluno pelo nome..."
            className="w-full outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">
          Carregando alunos...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
          Não foi possível carregar os alunos.
        </div>
      )}

      {!isLoading && !isError && students.length > 0 && (
        <div className="space-y-4">
          {classroomFolders.map((folder) => {
            const isExpanded = !collapsedFolders.has(folder.key)

            return (
              <section key={folder.key} className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/40 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.key)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-blue-50"
                  aria-expanded={isExpanded}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      {isExpanded ? <FolderOpen size={22} /> : <Folder size={22} />}
                    </span>

                    <span className="min-w-0">
                      <span className="block font-bold text-blue-950">{folder.label}</span>
                      <span className="block truncate text-sm text-zinc-500">{folder.schoolName}</span>
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700">
                      {folder.students.length} {folder.students.length === 1 ? "aluno" : "alunos"}
                    </span>
                    {isExpanded ? <ChevronDown size={20} className="text-blue-600" /> : <ChevronRight size={20} className="text-blue-600" />}
                  </span>
                </button>

                {isExpanded ? (
                  <div className="grid grid-cols-1 gap-4 border-t border-blue-100 bg-white p-4 md:grid-cols-2 xl:grid-cols-3">
                    {folder.students.map((student) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        canManage={canManageStudents && (user?.role === "admin" || student.psychologist_id === user?.id)}
                        onEdit={setEditingStudent}
                        onDelete={setDeletingStudent}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      )}

      {!isLoading && !isError && students.length === 0 && (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users size={28} />
          </div>

          <h2 className="text-lg font-bold text-blue-950">
            Nenhum aluno encontrado
          </h2>

          <p className="mt-1 max-w-md text-sm text-zinc-500">
            Cadastre o primeiro aluno para iniciar avaliações, relatórios,
            entrevistas e geração de estudos de caso com IA.
          </p>

          {canManageStudents ? <button
            onClick={() => setOpenCreateModal(true)}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Cadastrar primeiro aluno
          </button> : null}
        </div>
      )}

      {canManageStudents ? <StudentFormModal
        open={openCreateModal || Boolean(editingStudent)}
        student={editingStudent}
        onClose={() => {
          setOpenCreateModal(false)
          setEditingStudent(null)
        }}
      /> : null}

      {canManageStudents ? <DeleteStudentModal student={deletingStudent} onClose={() => setDeletingStudent(null)} /> : null}
    </div>
  )
}

type ClassroomFolder = {
  key: string
  label: string
  schoolName: string
  students: Student[]
  isUnassigned: boolean
}

function groupStudentsByClassroom(students: Student[]): ClassroomFolder[] {
  const folders = new Map<string, ClassroomFolder>()

  for (const student of students) {
    const schoolName = student.school_name?.trim() || "Escola não informada"
    const schoolGrade = student.school_grade?.trim() || null
    const classGroup = student.class_group?.trim() || null
    const key = [schoolName, schoolGrade || "", classGroup || ""]
      .map((value) => value.toLocaleLowerCase("pt-BR"))
      .join("::")

    const folder = folders.get(key) ?? {
      key,
      label: formatStudentClassroom(schoolGrade, classGroup),
      schoolName,
      students: [],
      isUnassigned: !schoolGrade && !classGroup,
    }

    folder.students.push(student)
    folders.set(key, folder)
  }

  return [...folders.values()].sort((first, second) => {
    if (first.isUnassigned !== second.isUnassigned) return first.isUnassigned ? 1 : -1

    const schoolComparison = first.schoolName.localeCompare(second.schoolName, "pt-BR")
    if (schoolComparison !== 0) return schoolComparison
    return first.label.localeCompare(second.label, "pt-BR", { numeric: true })
  })
}
