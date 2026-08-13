from enum import Enum

from models.models import UserRole


class ToolAccess(str, Enum):
    DASHBOARD = "dashboard"
    STUDENTS = "students"
    STUDENT_MANAGEMENT = "student_management"
    APPOINTMENTS = "appointments"
    BEHAVIOR_RECORDS = "behavior_records"
    ASSESSMENTS = "assessments"
    INTERVIEWS = "interviews"
    TIMELINE = "timeline"
    GOALS = "goals"
    AI_CASE_STUDIES = "ai_case_studies"
    REPORTS = "reports"
    ANALYTICS = "analytics"
    TEAM_MANAGEMENT = "team_management"
    PILOT_FEEDBACK = "pilot_feedback"
    ADMIN_PROFESSIONALS = "admin_professionals"


PUBLIC_PROFESSIONAL_ROLES = frozenset(
    {
        UserRole.PSYCHOLOGIST,
        UserRole.SUPERVISOR,
        UserRole.AEE,
        UserRole.SUPPORT_PROFESSIONAL,
    }
)

ROLE_LABELS = {
    UserRole.ADMIN: "Administrador",
    UserRole.PSYCHOLOGIST: "Psicólogo(a)",
    UserRole.SUPERVISOR: "Supervisor(a)",
    UserRole.AEE: "Profissional de AEE",
    UserRole.SUPPORT_PROFESSIONAL: "Profissional de apoio",
    UserRole.SCHOOL: "Equipe escolar",
    UserRole.GUARDIAN: "Responsável",
}

_FULL_PROFESSIONAL_ACCESS = frozenset(
    {
        ToolAccess.DASHBOARD,
        ToolAccess.STUDENTS,
        ToolAccess.STUDENT_MANAGEMENT,
        ToolAccess.APPOINTMENTS,
        ToolAccess.BEHAVIOR_RECORDS,
        ToolAccess.ASSESSMENTS,
        ToolAccess.INTERVIEWS,
        ToolAccess.TIMELINE,
        ToolAccess.GOALS,
        ToolAccess.AI_CASE_STUDIES,
        ToolAccess.REPORTS,
        ToolAccess.ANALYTICS,
        ToolAccess.TEAM_MANAGEMENT,
        ToolAccess.PILOT_FEEDBACK,
    }
)

ROLE_TOOL_ACCESS: dict[UserRole, frozenset[ToolAccess]] = {
    UserRole.ADMIN: frozenset(ToolAccess),
    UserRole.PSYCHOLOGIST: _FULL_PROFESSIONAL_ACCESS,
    UserRole.SUPERVISOR: _FULL_PROFESSIONAL_ACCESS,
    UserRole.AEE: frozenset(
        {
            ToolAccess.DASHBOARD,
            ToolAccess.STUDENTS,
            ToolAccess.APPOINTMENTS,
            ToolAccess.ASSESSMENTS,
            ToolAccess.INTERVIEWS,
            ToolAccess.GOALS,
            ToolAccess.AI_CASE_STUDIES,
            ToolAccess.REPORTS,
            ToolAccess.PILOT_FEEDBACK,
        }
    ),
    UserRole.SUPPORT_PROFESSIONAL: frozenset(
        {
            ToolAccess.DASHBOARD,
            ToolAccess.STUDENTS,
            ToolAccess.APPOINTMENTS,
            ToolAccess.BEHAVIOR_RECORDS,
            ToolAccess.PILOT_FEEDBACK,
        }
    ),
    UserRole.SCHOOL: frozenset(
        {
            ToolAccess.DASHBOARD,
            ToolAccess.STUDENTS,
            ToolAccess.APPOINTMENTS,
            ToolAccess.PILOT_FEEDBACK,
        }
    ),
    UserRole.GUARDIAN: frozenset(
        {
            ToolAccess.DASHBOARD,
            ToolAccess.STUDENTS,
            ToolAccess.PILOT_FEEDBACK,
        }
    ),
}

STUDENT_PERMISSION_TO_TOOL = {
    "can_view": ToolAccess.STUDENTS,
    "can_register_aba": ToolAccess.BEHAVIOR_RECORDS,
    "can_create_assessment": ToolAccess.ASSESSMENTS,
    "can_create_pei": ToolAccess.GOALS,
    "can_generate_ai_report": ToolAccess.AI_CASE_STUDIES,
    "can_view_reports": ToolAccess.REPORTS,
}


def tools_for_role(role: UserRole) -> list[str]:
    return sorted(tool.value for tool in ROLE_TOOL_ACCESS.get(role, frozenset()))


def role_has_tool(role: UserRole, tool: ToolAccess) -> bool:
    return tool in ROLE_TOOL_ACCESS.get(role, frozenset())


def normalize_student_permissions(role: UserRole, permissions: dict[str, bool]) -> dict[str, bool]:
    return {
        permission: bool(value) and role_has_tool(role, STUDENT_PERMISSION_TO_TOOL[permission])
        for permission, value in permissions.items()
        if permission in STUDENT_PERMISSION_TO_TOOL
    }
