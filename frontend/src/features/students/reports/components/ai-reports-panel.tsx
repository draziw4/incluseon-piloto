import { useEffect, useState } from "react"

import {
  AlertCircle,
  FileText,
  Loader2,
  Sparkles
} from "lucide-react"

import { useQueryClient } from "@tanstack/react-query"

import { getApiErrorMessage } from "@/routes/utils/get-api-error-message"

import { useGenerateCaseStudy } from "../hooks/use-generate-case-study"
import { useTaskStatus } from "../hooks/use-task-status"
import { useStudentAIReports } from "../hooks/use-student-id-reports"
import { useAIUsage } from "../hooks/use-ai-usage"

import { AIUsageCard } from "./ai-usage-card"
import { SavedAIReportCard } from "./saved-ai-report-card"
import { EditAIReportModal } from "./edit-ai-report-modal"
import type { SavedAIReport } from "../types/saved-ai-report"
import { downloadAIReport } from "../api/download-ai-report"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useStudentProfessionals } from "../../team/hooks/use-student-professionals"
import { useStudent } from "../../hooks/use-student"
import { useAssessments } from "../../assessments/hooks/use-assessments"
import {
  instrumentDefinitions,
  instrumentTypes,
} from "../../assessments/instrument-definitions"

type Props = {
  studentId: string
}

export function AIReportsPanel({ studentId }: Props) {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editingReport, setEditingReport] = useState<SavedAIReport | null>(null)
  const [downloadingReportId, setDownloadingReportId] = useState<number | null>(null)
  const { user } = useAuth()
  const { data: student } = useStudent(studentId)
  const { data: professionals } = useStudentProfessionals(studentId)
  const { data: assessmentsData, isLoading: isLoadingAssessments } = useAssessments(studentId)
  const assessments = Array.isArray(assessmentsData) ? assessmentsData : assessmentsData?.items ?? []
  const completedInstrumentTypes = new Set(assessments.map((assessment) => assessment.assessment_type))
  const missingInstrumentTypes = instrumentTypes.filter((type) => !completedInstrumentTypes.has(type))
  const hasAllInstruments = missingInstrumentTypes.length === 0

  const queryClient = useQueryClient()

  const generateMutation = useGenerateCaseStudy()

  const { data: taskStatus } = useTaskStatus(taskId)

  const {
    data: savedReports,
    isLoading: isLoadingSavedReports,
    isError: isErrorSavedReports
  } = useStudentAIReports(studentId)

  const {
    data: aiUsage,
    isLoading: isLoadingAIUsage
  } = useAIUsage()

  const isProcessing =
    taskStatus?.status === "PENDING" ||
    taskStatus?.status === "STARTED"

  const hasReachedLimit =
    aiUsage ? aiUsage.remaining <= 0 : false

  const hasFailure =
    taskStatus?.status === "FAILURE" ||
    generateMutation.isError

  const hasSuccess =
    taskStatus?.status === "SUCCESS"

  const currentUserLink = professionals?.find(
    (professional) => professional.user_id === user?.id
  )
  const canEditReports =
    user?.role === "admin" ||
    student?.psychologist_id === user?.id ||
    Boolean(currentUserLink?.can_generate_ai_report)

  useEffect(() => {
    if (taskStatus?.status === "SUCCESS") {
      queryClient.invalidateQueries({
        queryKey: ["student-ai-reports", studentId]
      })

      queryClient.invalidateQueries({
        queryKey: ["ai-usage"]
      })
    }
  }, [taskStatus?.status, queryClient, studentId])

  async function handleGenerateReport() {
    try {
      setActionError(null)

      const response =
        await generateMutation.mutateAsync(studentId)

      if (response.already_generated) {
        queryClient.invalidateQueries({
          queryKey: ["student-ai-reports", studentId]
        })

        queryClient.invalidateQueries({
          queryKey: ["ai-usage"]
        })

        return
      }

      if (response.task_id) {
        setTaskId(response.task_id)
      }
    } catch (error) {
      const message = getApiErrorMessage(error)

      setActionError(message)
    }
  }

  async function handleDownload(report: SavedAIReport) {
    try {
      setActionError(null)
      setDownloadingReportId(report.id)
      const file = await downloadAIReport(report.id)
      const url = URL.createObjectURL(file)
      const link = document.createElement("a")
      link.href = url
      link.download = `estudo-de-caso-${report.student_id}-${report.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    } finally {
      setDownloadingReportId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-600">
              <Sparkles size={20} />

              <span className="text-sm font-semibold">
                Inteligência artificial
              </span>
            </div>

            <h2 className="text-xl font-bold text-blue-950">
              Estudo de caso com IA
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Consolide os três instrumentais no padrão 5.4.1 a 5.4.8. O documento gerado subsidia a elaboração posterior do PAEE.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={
              generateMutation.isPending ||
              isProcessing ||
              hasReachedLimit ||
              isLoadingAssessments ||
              !hasAllInstruments
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {!hasAllInstruments ? (
              "Preencha os instrumentais"
            ) : hasReachedLimit ? (
              "Limite mensal atingido"
            ) : generateMutation.isPending || isProcessing ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Gerar estudo de caso
              </>
            )}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-blue-950">Fontes obrigatórias do estudo de caso</h3>
        <p className="mt-1 text-sm text-zinc-500">
          A versão mais recente de cada instrumental será usada. Observações comportamentais, metas, PAEE e PEI não entram como fonte deste estudo de caso.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {instrumentTypes.map((type) => {
            const completed = completedInstrumentTypes.has(type)
            return (
              <div key={type} className={`rounded-xl border p-4 ${completed ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${completed ? "text-emerald-700" : "text-amber-700"}`}>
                  {completed ? "Preenchido" : "Pendente"}
                </p>
                <p className="mt-1 text-sm font-semibold text-blue-950">{instrumentDefinitions[type].label}</p>
              </div>
            )
          })}
        </div>
        {!hasAllInstruments && !isLoadingAssessments && (
          <p className="mt-4 text-sm text-amber-800">
            Complete os três instrumentais na aba Entrevistas e Avaliações para liberar a geração.
          </p>
        )}
      </section>

      {actionError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0"
            />

            <div>
              <h3 className="font-bold">
                Ação não permitida
              </h3>

              <p className="mt-1 text-sm">
                {actionError}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoadingAIUsage && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">
          Carregando uso da IA...
        </div>
      )}

      {aiUsage && (
        <AIUsageCard usage={aiUsage} />
      )}

      {hasReachedLimit && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6 text-orange-700">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} />

            <div>
              <h3 className="font-bold">
                Limite mensal atingido
              </h3>

              <p className="text-sm">
                Você já utilizou todos os relatórios IA disponíveis neste mês.
              </p>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-blue-800">
          <div className="flex items-center gap-3">
            <Loader2
              size={22}
              className="animate-spin"
            />

            <div>
              <h3 className="font-bold">
                Relatório em processamento
              </h3>

              <p className="text-sm">
                A IA está analisando os dados do aluno. Isso pode levar alguns
                segundos.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasFailure && !actionError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} />

            <div>
              <h3 className="font-bold">
                Erro ao gerar relatório
              </h3>

              <p className="text-sm">
                {taskStatus?.error ||
                  "Não foi possível gerar o relatório."}
              </p>
            </div>
          </div>
        </div>
      )}

      {hasSuccess && taskStatus?.report && (
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-blue-950">
              Estudo de caso gerado nesta sessão
            </h3>

            <p className="text-sm text-zinc-500">
              O relatório também foi salvo no histórico abaixo.
            </p>
          </div>

          <div className="max-h-[600px] overflow-y-auto rounded-2xl bg-slate-50 p-5">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {taskStatus.report}
            </pre>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-blue-950">
            Histórico de relatórios
          </h3>

          <p className="text-sm text-zinc-500">
            Relatórios já gerados para este aluno.
          </p>
        </div>

        {isLoadingSavedReports && (
          <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">
            Carregando histórico de relatórios...
          </div>
        )}

        {isErrorSavedReports && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
            Não foi possível carregar o histórico de relatórios.
          </div>
        )}

        {!isLoadingSavedReports &&
          !isErrorSavedReports &&
          savedReports &&
          savedReports.length > 0 && (
            <div className="space-y-4">
              {savedReports.map((report) => (
                <SavedAIReportCard
                  key={report.id}
                  report={report}
                  canEdit={canEditReports}
                  isDownloading={downloadingReportId === report.id}
                  onEdit={() => setEditingReport(report)}
                  onDownload={() => handleDownload(report)}
                />
              ))}
            </div>
          )}

        {!isLoadingSavedReports &&
          !isErrorSavedReports &&
          savedReports?.length === 0 && (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FileText size={28} />
              </div>

              <h4 className="font-bold text-blue-950">
                Nenhum relatório salvo ainda
              </h4>

              <p className="mt-1 max-w-md text-sm text-zinc-500">
                Gere o primeiro estudo de caso para criar o histórico do aluno.
              </p>
            </div>
          )}
      </section>

      {editingReport && (
        <EditAIReportModal
          key={editingReport.id}
          report={editingReport}
          studentId={studentId}
          onClose={() => setEditingReport(null)}
        />
      )}
    </div>
  )
}
