from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.ext.asyncio import AsyncSession

from typing import Annotated

from database import get_db
from access_policy import ToolAccess
from permissions import require_tool

from dependencies import get_current_user

from services.permissions_service import (
    require_student_access
)

from services.analytics_service import (
    get_behavior_analytics_for_student
)

from models.models import User

from schemas.analytics import (
    StudentBehaviorAnalytics
)


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
    dependencies=[Depends(require_tool(ToolAccess.ANALYTICS))],
)


@router.get(
    "/student/{student_id}/overview",
    response_model=StudentBehaviorAnalytics
)
@router.get(
    "/student/{student_id}/behavior",
    response_model=StudentBehaviorAnalytics,
    include_in_schema=False,
)
async def get_student_behavior_analytics(
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

    analytics = await get_behavior_analytics_for_student(
        db=db,
        student_id=student.id
    )

    return analytics
