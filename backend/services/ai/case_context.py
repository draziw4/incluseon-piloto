from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.models import Assessment
from services.assessment_instruments import REQUIRED_INSTRUMENT_TYPES


async def get_case_study_context(db: AsyncSession, student_id: int) -> dict:
    """Collect the three instrumentals that are authorized as case-study sources."""
    assessments_result = await db.execute(
        select(Assessment)
        .options(selectinload(Assessment.psychologist))
        .where(
            Assessment.student_id == student_id,
            Assessment.assessment_type.in_(REQUIRED_INSTRUMENT_TYPES),
        )
        .order_by(Assessment.created_at.desc())
    )

    return {
        "assessments": assessments_result.scalars().all(),
        "behavior_records": [],
        "goals": [],
        "appointments": [],
        "analytics": {},
    }
