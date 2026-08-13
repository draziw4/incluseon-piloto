from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.models import Appointment, Assessment, BehaviorRecord, StudentGoal
from services.analytics_service import get_behavior_analytics_for_student


async def get_case_study_context(db: AsyncSession, student_id: int) -> dict:
    """Collect every supported source by student, regardless of which linked user created it."""
    assessments_result = await db.execute(
        select(Assessment)
        .options(selectinload(Assessment.psychologist))
        .where(Assessment.student_id == student_id)
        .order_by(Assessment.created_at.desc())
        .limit(10)
    )
    behavior_result = await db.execute(
        select(BehaviorRecord)
        .options(selectinload(BehaviorRecord.created_by))
        .where(BehaviorRecord.student_id == student_id)
        .order_by(BehaviorRecord.created_at.desc())
        .limit(30)
    )
    goals_result = await db.execute(
        select(StudentGoal)
        .options(selectinload(StudentGoal.created_by))
        .where(StudentGoal.student_id == student_id)
        .order_by(StudentGoal.updated_at.desc())
        .limit(20)
    )
    appointments_result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.professional))
        .where(Appointment.student_id == student_id)
        .order_by(Appointment.scheduled_at.desc())
        .limit(20)
    )

    return {
        "assessments": assessments_result.scalars().all(),
        "behavior_records": behavior_result.scalars().all(),
        "goals": goals_result.scalars().all(),
        "appointments": appointments_result.scalars().all(),
        "analytics": await get_behavior_analytics_for_student(db=db, student_id=student_id),
    }
