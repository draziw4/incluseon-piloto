import { useState } from "react"
import { Activity, BookOpenText } from "lucide-react"

import { BehaviorRecordsPanel } from "../../behavior/components/behavior-records-panel"
import { StudentProgressReportsPanel } from "./student-progress-reports-panel"

type Props = {
  studentId: string
  canManageBehavior: boolean
  canManageProgressReports: boolean
}

export function StudentReportsPanel({ studentId, canManageBehavior, canManageProgressReports }: Props) {
  const [activeSection, setActiveSection] = useState<"progress" | "behavior">("progress")

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm sm:grid-cols-2">
        <button type="button" onClick={() => setActiveSection("progress")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${activeSection === "progress" ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-50"}`}>
          <BookOpenText size={18} /> Diários e semanais
        </button>
        <button type="button" onClick={() => setActiveSection("behavior")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${activeSection === "behavior" ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-50"}`}>
          <Activity size={18} /> Observações comportamentais
        </button>
      </div>

      {activeSection === "progress" ? (
        <StudentProgressReportsPanel studentId={studentId} canManage={canManageProgressReports} />
      ) : (
        <BehaviorRecordsPanel studentId={studentId} canManage={canManageBehavior} />
      )}
    </div>
  )
}
