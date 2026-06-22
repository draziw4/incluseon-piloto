from datetime import datetime, timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from typing import Annotated

from database import get_db

from dependencies import get_current_user

from models.models import (
    User,
    AIReport
)

from services.permissions_service import (
    require_student_permission
)

from workers.ai_tasks import (
    generate_case_study_task
)

from services.ai_usage_service import (
    count_user_reports_this_month
)
from services.redis_service import register_task_owner


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


@router.post(
    "/student/{student_id}/case-study"
)
async def generate_ai_case_study(
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
    student = await require_student_permission(
        db=db,
        user=current_user,
        student_id=student_id,
        permission="can_generate_ai_report"
    )

    # =====================================
    # CHECK RECENT REPORT
    # Evita gerar relatório repetido
    # =====================================

    recent_limit = datetime.utcnow() - timedelta(
        hours=24
    )

    recent_report_result = await db.execute(
        select(AIReport)
        .where(
            AIReport.student_id == student.id,
            AIReport.created_by_id == current_user.id,
            AIReport.report_type == "case_study",
            AIReport.created_at >= recent_limit
        )
        .order_by(
            AIReport.created_at.desc()
        )
    )

    recent_report = (
        recent_report_result
        .scalars()
        .first()
    )

    if recent_report:
        return {
            "message": "Relatório recente encontrado",
            "task_id": None,
            "report_id": recent_report.id,
            "already_generated": True
        }

    # =====================================
    # CHECK MONTHLY LIMIT
    # =====================================

    reports_this_month = await count_user_reports_this_month(
        db=db,
        user_id=current_user.id
    )

    MONTHLY_LIMIT = 30

    if reports_this_month >= MONTHLY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Limite mensal de relatórios IA atingido"
        )

    # =====================================
    # CREATE CELERY TASK
    # =====================================

    task = generate_case_study_task.delay(
        student.id,
        current_user.id
    )
    await register_task_owner(task.id, current_user.id, student.id)

    return {
        "message": "Relatório em processamento",
        "task_id": task.id,
        "already_generated": False
    }
