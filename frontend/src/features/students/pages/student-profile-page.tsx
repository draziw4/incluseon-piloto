import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  Activity,
  Brain,
  FileText,
  Sparkles,
  BarChart3,
  UserCog,
  Target,
} from "lucide-react";

import { useStudent } from "../hooks/use-student";

import { StudentHeader } from "../components/student-header";
import { StudentOverview } from "../components/student-overview";
import { AssessmentsPanel } from "../assessments/components/assessments-panel";
import { BehaviorRecordsPanel } from "../behavior/components/behavior-records-panel";
import { StudentTimelinePanel } from "../timeline/components/student-timeline-panel";
import { StudentAnalyticsPanel } from "../analytics/components/student-analytics-panel";
import { AIReportsPanel } from "../reports/components/ai-reports-panel";
import { StudentTeamPanel } from "../team/components/student-team-panel";
import { StudentFormModal } from "../components/create-student-modal";
import { DeleteStudentModal } from "../components/delete-student-modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { hasTool, type ToolAccess } from "@/features/auth/access";
import { StudentGoalsPanel } from "../goals/components/student-goals-panel";
import { useStudentProfessionals } from "../team/hooks/use-student-professionals";

type StudentProfileTab =
  | "overview"
  | "behavior"
  | "assessments"
  | "timeline"
  | "analytics"
  | "reports"
  | "goals"
  | "team";

const tabTools: Partial<Record<StudentProfileTab, ToolAccess>> = {
  behavior: "behavior_records",
  assessments: "assessments",
  timeline: "timeline",
  analytics: "analytics",
  reports: "reports",
  goals: "goals",
};

export function StudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const validTabs: StudentProfileTab[] = ["overview", "behavior", "assessments", "timeline", "analytics", "reports", "goals", "team"]
    .filter((tab) => !tabTools[tab as StudentProfileTab] || hasTool(user, tabTools[tab as StudentProfileTab]!)) as StudentProfileTab[];
  const activeTab: StudentProfileTab = validTabs.includes(requestedTab as StudentProfileTab)
    ? requestedTab as StudentProfileTab
    : "overview";

  function selectTab(tab: StudentProfileTab) {
    setSearchParams(tab === "overview" ? {} : { tab });
  }

  const { data: student, isLoading, isError } = useStudent(id || "");
  const { data: professionals } = useStudentProfessionals(id || "");

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">
        Carregando perfil do aluno...
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
        Não foi possível carregar o aluno.
      </div>
    );
  }

  const canManage = hasTool(user, "student_management") && (user?.role === "admin" || student.psychologist_id === user?.id);
  const currentUserLink = professionals?.find((professional) => professional.user_id === user?.id);
  const canManageBehavior = hasTool(user, "behavior_entry") && (canManage || Boolean(currentUserLink?.can_register_aba));
  const canManageGoals = hasTool(user, "goals") && (canManage || Boolean(currentUserLink?.can_create_pei));
  const canManageTeam = hasTool(user, "team_management") && canManage;

  return (
    <div className="space-y-6">
      <StudentHeader
        student={student}
        canManage={canManage}
        onEdit={() => setEditing(true)}
        onDelete={() => setDeleting(true)}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <aside className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm xl:col-span-1">
          <nav className="space-y-2">
            <StudentProfileNavButton
              active={activeTab === "overview"}
              icon={<Brain size={18} />}
              label="Visão geral"
              onClick={() => selectTab("overview")}
            />

            {hasTool(user, "behavior_records") ? <StudentProfileNavButton
              active={activeTab === "behavior"}
              icon={<Activity size={18} />}
              label="Registros ABA"
              onClick={() => selectTab("behavior")}
            /> : null}

            {hasTool(user, "assessments") ? <StudentProfileNavButton
              active={activeTab === "assessments"}
              icon={<FileText size={18} />}
              label="Entrevistas e Avaliações"
              onClick={() => selectTab("assessments")}
            /> : null}

            {hasTool(user, "timeline") ? <StudentProfileNavButton
              active={activeTab === "timeline"}
              icon={<Sparkles size={18} />}
              label="Timeline"
              onClick={() => selectTab("timeline")}
            /> : null}
            {hasTool(user, "analytics") ? <StudentProfileNavButton
              active={activeTab === "analytics"}
              icon={<BarChart3 size={18} />}
              label="Análise"
              onClick={() => selectTab("analytics")}
            /> : null}

            {hasTool(user, "goals") ? <StudentProfileNavButton
              active={activeTab === "goals"}
              icon={<Target size={18} />}
              label="PEI e Metas"
              onClick={() => selectTab("goals")}
            /> : null}
            {hasTool(user, "reports") ? <StudentProfileNavButton
              active={activeTab === "reports"}
              icon={<FileText size={18} />}
              label="Relatórios IA"
              onClick={() => selectTab("reports")}
            /> : null}
            <StudentProfileNavButton
              active={activeTab === "team"}
              icon={<UserCog size={18} />}
              label="Equipe"
              onClick={() => selectTab("team")}
            />
          </nav>
        </aside>

        <main className="xl:col-span-3">
          {activeTab === "overview" && <StudentOverview student={student} />}

          {activeTab === "behavior" && (
            <BehaviorRecordsPanel studentId={student.id.toString()} canManage={canManageBehavior} />
          )}

          {activeTab === "assessments" && (
            <AssessmentsPanel studentId={student.id.toString()} />
          )}

          {activeTab === "timeline" && (
            <StudentTimelinePanel studentId={student.id.toString()} />
          )}

          {activeTab === "analytics" && (
            <StudentAnalyticsPanel studentId={student.id.toString()} />
          )}

          {activeTab === "reports" && (
            <AIReportsPanel studentId={student.id.toString()} />
          )}
          {activeTab === "goals" && (
            <StudentGoalsPanel studentId={student.id.toString()} canManage={canManageGoals} />
          )}
          {activeTab === "team" && (
            <StudentTeamPanel studentId={student.id.toString()} canManage={canManageTeam} />
          )}
        </main>
      </div>

      <StudentFormModal open={editing} student={student} onClose={() => setEditing(false)} />
      <DeleteStudentModal
        student={deleting ? student : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => navigate("/students", { replace: true })}
      />
    </div>
  );
}

function StudentProfileNavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition",
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-zinc-600 hover:bg-blue-50 hover:text-blue-700",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}
