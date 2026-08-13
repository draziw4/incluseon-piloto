from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from database import get_db
from access_policy import ToolAccess, role_has_tool
from permissions import require_tool
from dependencies import get_current_user
from models.models import (
    AIReport,
    Appointment,
    AppointmentStatus,
    Assessment,
    BehaviorRecord,
    Student,
    StudentGoal,
    StudentGoalStatus,
    StudentProfessional,
    User,
    UserRole
)
from schemas.dashboard import DashboardReminder, DashboardSummary


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(require_tool(ToolAccess.DASHBOARD))],
)


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    visible_student_ids = get_visible_student_ids_query(current_user).subquery()
    visible_ids_select = select(visible_student_ids.c.id)

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)
    next_week = now + timedelta(days=7)
    seven_days_ago = now - timedelta(days=7)

    students_count = await scalar_count(
        db,
        select(func.count()).select_from(visible_student_ids)
    )

    behavior_records_last_7_days = await scalar_count(
        db,
        select(func.count()).select_from(BehaviorRecord).where(
            BehaviorRecord.student_id.in_(visible_ids_select),
            BehaviorRecord.created_at >= seven_days_ago
        )
    ) if role_has_tool(current_user.role, ToolAccess.BEHAVIOR_RECORDS) else 0

    assessments_count = await scalar_count(
        db,
        select(func.count()).select_from(Assessment).where(
            Assessment.student_id.in_(visible_ids_select)
        )
    ) if role_has_tool(current_user.role, ToolAccess.ASSESSMENTS) else 0

    ai_reports_count = await scalar_count(
        db,
        select(func.count()).select_from(AIReport).where(
            AIReport.student_id.in_(visible_ids_select)
        )
    ) if role_has_tool(current_user.role, ToolAccess.REPORTS) else 0

    appointments_today = await scalar_count(
        db,
        select(func.count()).select_from(Appointment).where(
            Appointment.student_id.in_(visible_ids_select),
            Appointment.scheduled_at >= today_start,
            Appointment.scheduled_at < tomorrow_start,
            Appointment.status.in_([
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.PENDING
            ])
        )
    ) if role_has_tool(current_user.role, ToolAccess.APPOINTMENTS) else 0

    upcoming_appointments = await scalar_count(
        db,
        select(func.count()).select_from(Appointment).where(
            Appointment.student_id.in_(visible_ids_select),
            Appointment.scheduled_at >= now,
            Appointment.scheduled_at <= next_week,
            Appointment.status.in_([
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.PENDING
            ])
        )
    ) if role_has_tool(current_user.role, ToolAccess.APPOINTMENTS) else 0

    reminders: list[DashboardReminder] = []
    if role_has_tool(current_user.role, ToolAccess.APPOINTMENTS):
        reminders.extend(await get_upcoming_appointment_reminders(db, visible_ids_select, now, next_week))
    if role_has_tool(current_user.role, ToolAccess.BEHAVIOR_RECORDS):
        reminders.extend(await get_student_without_recent_behavior_reminders(db, visible_ids_select, seven_days_ago))
    if role_has_tool(current_user.role, ToolAccess.ASSESSMENTS):
        reminders.extend(await get_student_without_assessment_reminders(db, visible_ids_select))
    if role_has_tool(current_user.role, ToolAccess.REPORTS):
        reminders.extend(await get_unreviewed_report_reminders(db, visible_ids_select))
    if role_has_tool(current_user.role, ToolAccess.GOALS):
        reminders.extend(await get_goal_deadline_reminders(db, visible_ids_select, now))

    return {
        "metrics": {
            "students_count": students_count,
            "behavior_records_last_7_days": behavior_records_last_7_days,
            "assessments_count": assessments_count,
            "ai_reports_count": ai_reports_count,
            "appointments_today": appointments_today,
            "upcoming_appointments": upcoming_appointments
        },
        "reminders": reminders[:10]
    }


def get_visible_student_ids_query(user: User):
    query = select(Student.id).outerjoin(
        StudentProfessional,
        StudentProfessional.student_id == Student.id
    )

    if user.role != UserRole.ADMIN:
        query = query.where(
            or_(
                Student.psychologist_id == user.id,
                StudentProfessional.user_id == user.id
            )
        )

    return query.distinct()


async def scalar_count(db: AsyncSession, query) -> int:
    result = await db.execute(query)
    return result.scalar() or 0


async def get_upcoming_appointment_reminders(db, visible_ids_select, now, next_week):
    result = await db.execute(
        select(Appointment, Student)
        .join(Student, Student.id == Appointment.student_id)
        .where(
            Appointment.student_id.in_(visible_ids_select),
            Appointment.scheduled_at >= now,
            Appointment.scheduled_at <= next_week,
            Appointment.status.in_([
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.PENDING
            ])
        )
        .order_by(Appointment.scheduled_at.asc())
        .limit(3)
    )

    return [
        DashboardReminder(
            type="appointment",
            title="Atendimento próximo",
            description=f"{student.name} possui atendimento agendado.",
            to="/appointments",
            priority="high",
            due_at=appointment.scheduled_at
        )
        for appointment, student in result.all()
    ]


async def get_student_without_recent_behavior_reminders(db, visible_ids_select, seven_days_ago):
    recent_behavior_student_ids = select(BehaviorRecord.student_id).where(
        BehaviorRecord.created_at >= seven_days_ago
    )

    result = await db.execute(
        select(Student)
        .where(
            Student.id.in_(visible_ids_select),
            Student.id.not_in(recent_behavior_student_ids)
        )
        .order_by(Student.created_at.desc())
        .limit(3)
    )

    return [
        DashboardReminder(
            type="behavior",
            title="Registrar evolução comportamental",
            description=f"{student.name} não possui registro ABA nos últimos 7 dias.",
            to=f"/students/{student.id}?tab=behavior",
            priority="medium"
        )
        for student in result.scalars().all()
    ]


async def get_student_without_assessment_reminders(db, visible_ids_select):
    assessed_student_ids = select(Assessment.student_id)

    result = await db.execute(
        select(Student)
        .where(
            Student.id.in_(visible_ids_select),
            Student.id.not_in(assessed_student_ids)
        )
        .order_by(Student.created_at.desc())
        .limit(2)
    )

    return [
        DashboardReminder(
            type="assessment",
            title="Avaliação inicial pendente",
            description=f"{student.name} ainda não possui avaliação registrada.",
            to=f"/students/{student.id}?tab=assessments",
            priority="medium"
        )
        for student in result.scalars().all()
    ]


async def get_unreviewed_report_reminders(db, visible_ids_select):
    result = await db.execute(
        select(AIReport, Student)
        .join(Student, Student.id == AIReport.student_id)
        .where(
            AIReport.student_id.in_(visible_ids_select),
            AIReport.revision == 1
        )
        .order_by(AIReport.created_at.desc())
        .limit(2)
    )

    return [
        DashboardReminder(
            type="report",
            title="Revisar relatório IA",
            description=f"{student.name} possui relatório gerado aguardando revisão profissional.",
            to=f"/students/{student.id}?tab=reports",
            priority="high"
        )
        for _report, student in result.all()
    ]


async def get_goal_deadline_reminders(db, visible_ids_select, now):
    today = now.date()
    soon = today + timedelta(days=7)

    result = await db.execute(
        select(StudentGoal, Student)
        .join(Student, Student.id == StudentGoal.student_id)
        .where(
            StudentGoal.student_id.in_(visible_ids_select),
            StudentGoal.status != StudentGoalStatus.COMPLETED,
            StudentGoal.target_date.is_not(None),
            StudentGoal.target_date <= soon
        )
        .order_by(StudentGoal.target_date.asc())
        .limit(3)
    )

    reminders = []

    for goal, student in result.all():
        is_overdue = goal.target_date < today if goal.target_date else False

        reminders.append(
            DashboardReminder(
                type="goal",
                title="Meta PEI vencida" if is_overdue else "Meta PEI próxima do prazo",
                description=f"{student.name}: {goal.title}",
                to=f"/students/{student.id}?tab=goals",
                priority="high" if is_overdue else "medium"
            )
        )

    return reminders
