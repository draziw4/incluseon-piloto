import { useState } from "react"

import { Plus, Search, Users } from "lucide-react"

import { useStudents } from "../hooks/use-students"
import { StudentCard } from "../components/student-card"
import { StudentFormModal } from "../components/create-student-modal"
import { DeleteStudentModal } from "../components/delete-student-modal"
import type { Student } from "../types/student"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { hasTool } from "@/features/auth/access"

export function StudentsPage() {
  const [search, setSearch] = useState("")
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const { user } = useAuth()
  const canManageStudents = hasTool(user, "student_management")

  const {
    data,
    isLoading,
    isError
  } = useStudents({ 
    page: 1,
    per_page: 20,
    search
  })

  const students = data?.items ?? []

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              canManage={canManageStudents && (user?.role === "admin" || student.psychologist_id === user?.id)}
              onEdit={setEditingStudent}
              onDelete={setDeletingStudent}
            />
          ))}
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
