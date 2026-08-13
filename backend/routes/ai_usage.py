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

from models.models import User

from schemas.ai_usage import AIUsageResponse

from services.ai_usage_service import (
    count_user_reports_this_month
)


router = APIRouter(
    prefix="/ai",
    tags=["AI Usage"],
    dependencies=[Depends(require_tool(ToolAccess.AI_CASE_STUDIES))],
)


@router.get(
    "/usage/me",
    response_model=AIUsageResponse
)
async def get_my_ai_usage(
    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(get_current_user)
    ]
):
    monthly_limit = 30

    used_this_month = await count_user_reports_this_month(
        db=db,
        user_id=current_user.id
    )

    remaining = max(
        monthly_limit - used_this_month,
        0
    )

    return AIUsageResponse(
        used_this_month=used_this_month,
        monthly_limit=monthly_limit,
        remaining=remaining
    )
