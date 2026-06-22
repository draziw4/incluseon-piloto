import { useState } from "react"

import { Activity, Plus } from "lucide-react"

import { useBehaviorRecords } from "../hooks/use-behavior-records"
import { BehaviorRecordCard } from "./behavior-record-card"
import { CreateBehaviorRecordModal } from "./create-behavior-record-modal"
import type { BehaviorRecord } from "../types/behavior-record"
import { api } from "@/api/client"
import { useQueryClient } from "@tanstack/react-query"

type Props = {
  studentId: string
}

export function BehaviorRecordsPanel({ studentId }: Props) {
  const [openModal, setOpenModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<BehaviorRecord | null>(null)
  const queryClient = useQueryClient()

  async function deleteRecord(record: BehaviorRecord) {
    if (!window.confirm("Excluir este registro ABA? Esta ação não pode ser desfeita.")) return
    await api.delete(`/behavior-records/student/${studentId}/${record.id}`)
    await queryClient.invalidateQueries({ queryKey: ["behavior-records", studentId] })
  }

  const {
    data: records,
    isLoading,
    isError
  } = useBehaviorRecords(studentId)

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold text-blue-950">
            Registros ABA
          </h2>

          <p className="text-sm text-zinc-500">
            Acompanhe antecedentes, comportamentos, consequências e estratégias de manejo.
          </p>
        </div>

        <button
          onClick={() => { setEditingRecord(null); setOpenModal(true) }}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Novo registro
        </button>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">
          Carregando registros ABA...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
          Não foi possível carregar os registros.
        </div>
      )}

      {!isLoading && !isError && records && records.length > 0 && (
        <div className="space-y-4">
          {records.map((record) => (
            <BehaviorRecordCard
              key={record.id}
              record={record}
              onEdit={() => { setEditingRecord(record); setOpenModal(true) }}
              onDelete={() => void deleteRecord(record)}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && records?.length === 0 && (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Activity size={28} />
          </div>

          <h3 className="text-lg font-bold text-blue-950">
            Nenhum registro ABA ainda
          </h3>

          <p className="mt-1 max-w-md text-sm text-zinc-500">
            Registre o primeiro evento comportamental para começar a identificar padrões, gatilhos e estratégias eficazes.
          </p>

          <button
            onClick={() => { setEditingRecord(null); setOpenModal(true) }}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Criar primeiro registro
          </button>
        </div>
      )}

      <CreateBehaviorRecordModal
        studentId={studentId}
        open={openModal}
        onClose={() => { setOpenModal(false); setEditingRecord(null) }}
        record={editingRecord}
      />
    </div>
  )
}
