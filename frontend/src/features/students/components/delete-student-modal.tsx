import { AlertTriangle } from "lucide-react"
import { useState } from "react"

import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import { useDeleteStudent } from "../hooks/use-delete-student"
import type { Student } from "../types/student"

type Props = {
  student: Student | null
  onClose: () => void
  onDeleted?: () => void
}

export function DeleteStudentModal({ student, onClose, onDeleted }: Props) {
  const [confirmation, setConfirmation] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)
  const mutation = useDeleteStudent()

  if (!student) return null

  const studentId = student.id
  const studentName = student.name
  const isConfirmed = confirmation.trim() === studentName

  function handleClose() {
    setConfirmation("")
    setActionError(null)
    onClose()
  }

  async function handleDelete() {
    if (!isConfirmed) return

    try {
      setActionError(null)
      await mutation.mutateAsync(studentId)
      onDeleted?.()
      handleClose()
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div role="dialog" aria-modal="true" aria-labelledby="delete-student-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 id="delete-student-title" className="text-xl font-bold text-blue-950">Remover aluno</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Esta ação remove o aluno e seus registros vinculados. Ela não pode ser desfeita.
            </p>
          </div>
        </div>

        <label className="mt-6 block text-sm font-medium text-zinc-700">
          Digite <strong>{studentName}</strong> para confirmar
          <input
            autoFocus
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="mt-2 w-full rounded-xl border border-red-100 px-4 py-3 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
          />
        </label>

        {actionError && (
          <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{actionError}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={handleClose} className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
            Cancelar
          </button>
          <button type="button" onClick={handleDelete} disabled={!isConfirmed || mutation.isPending} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            {mutation.isPending ? "Removendo..." : "Remover definitivamente"}
          </button>
        </div>
      </div>
    </div>
  )
}
