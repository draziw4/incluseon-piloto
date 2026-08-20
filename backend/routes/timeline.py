from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from typing import Annotated

from database import get_db
from access_policy import ToolAccess
from permissions import require_tool

from dependencies import get_current_user

from models.models import (
    User,
    BehaviorRecord,
    Assessment,
    StudentProgressReport,
)

from schemas.timeline import TimelineItem

from services.permissions_service import (
    require_student_access
)


router = APIRouter(
    prefix="/timeline",
    tags=["Timeline"],
    dependencies=[Depends(require_tool(ToolAccess.TIMELINE))],
)


@router.get(
    "/student/{student_id}",
    response_model=list[TimelineItem]
)
async def get_student_timeline(
    student_id: int,

    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(get_current_user)
    ]
):
    student = await require_student_access(
        db=db,
        user=current_user,
        student_id=student_id
    )

    timeline: list[TimelineItem] = []

    behavior_result = await db.execute(
        select(BehaviorRecord).where(
            BehaviorRecord.student_id == student.id
        )
    )

    behavior_records = behavior_result.scalars().all()

    for record in behavior_records:
        timeline.append(
            TimelineItem(
                type="behavior_record",
                title="Registro de observação comportamental",
                description=record.behavior,
                created_at=record.created_at,
                metadata={
                    "record_id": record.id,
                    "antecedent": record.antecedent,
                    "behavior": record.behavior,
                    "consequence": record.consequence,
                    "intensity": record.intensity,
                    "duration_minutes": record.duration_minutes,
                    "environment": record.environment,
                    "strategy_used": record.strategy_used,
                    "strategy_effective": record.strategy_effective
                }
            )
        )

    assessment_result = await db.execute(
        select(Assessment).where(
            Assessment.student_id == student.id
        )
    )

    assessments = assessment_result.scalars().all()

    for assessment in assessments:
        timeline.append(
            TimelineItem(
                type="assessment",
                title=assessment.title,
                description=format_assessment_description(
                    assessment.assessment_type
                ),
                created_at=assessment.created_at,
                metadata={
                    "assessment_id": assessment.id,
                    "assessment_type": assessment.assessment_type,
                    "assessment_data": assessment.assessment_data
                }
            )
        )

    progress_report_result = await db.execute(
        select(StudentProgressReport).where(
            StudentProgressReport.student_id == student.id
        )
    )
    progress_reports = progress_report_result.scalars().all()

    for report in progress_reports:
        timeline.append(
            TimelineItem(
                type="progress_report",
                title=report.title,
                description=report.summary,
                created_at=report.created_at,
                metadata={
                    "report_id": report.id,
                    "report_type": report.report_type,
                    "period_start": report.period_start.isoformat(),
                    "period_end": report.period_end.isoformat(),
                    "created_by_name": report.created_by_name,
                },
            )
        )

    timeline.sort(
        key=lambda item: item.created_at,
        reverse=True
    )

    return timeline


def format_assessment_description(
    assessment_type: str
) -> str:
    labels = {
        "parent_interview": "Entrevista com responsáveis",
        "student_assessment": "Avaliação do estudante",
        "school_interview": "Entrevista com equipe escolar",
        "cognitive_assessment": "Avaliação cognitiva (registro legado)",
        "pei": "PEI (registro legado)"
    }

    return labels.get(
        assessment_type,
        assessment_type
    )
