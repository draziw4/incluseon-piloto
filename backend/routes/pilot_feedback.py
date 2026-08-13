from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.models import PilotFeedback, User, UserRole
from access_policy import ToolAccess
from permissions import require_role, require_tool
from schemas.pilot_feedback import (
    PilotFeedbackCreate,
    PilotFeedbackResponse,
    PilotFeedbackUpdate,
)


router = APIRouter(
    prefix="/pilot-feedback",
    tags=["Pilot feedback"],
    dependencies=[Depends(require_tool(ToolAccess.PILOT_FEEDBACK))],
)
AdminUser = Annotated[User, Depends(require_role([UserRole.ADMIN]))]


def feedback_response(
    feedback: PilotFeedback,
    author: User,
    include_email: bool,
) -> PilotFeedbackResponse:
    return PilotFeedbackResponse(
        id=feedback.id,
        page_path=feedback.page_path,
        category=feedback.category,
        title=feedback.title,
        details=feedback.details,
        expected_result=feedback.expected_result,
        status=feedback.status,
        admin_note=feedback.admin_note,
        author_name=author.name,
        author_email=author.email if include_email else None,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
    )


@router.post(
    "",
    response_model=PilotFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_pilot_feedback(
    data: PilotFeedbackCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    feedback = PilotFeedback(created_by_id=current_user.id, **data.model_dump())
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback_response(feedback, current_user, include_email=False)


@router.get("", response_model=list[PilotFeedbackResponse])
async def list_pilot_feedback(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    query = (
        select(PilotFeedback, User)
        .join(User, User.id == PilotFeedback.created_by_id)
        .order_by(PilotFeedback.created_at.desc())
        .limit(200)
    )
    if current_user.role != UserRole.ADMIN:
        query = query.where(PilotFeedback.created_by_id == current_user.id)

    result = await db.execute(query)
    include_email = current_user.role == UserRole.ADMIN
    return [
        feedback_response(feedback, author, include_email)
        for feedback, author in result.all()
    ]


@router.patch("/{feedback_id}", response_model=PilotFeedbackResponse)
async def update_pilot_feedback(
    feedback_id: int,
    data: PilotFeedbackUpdate,
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PilotFeedback, User)
        .join(User, User.id == PilotFeedback.created_by_id)
        .where(PilotFeedback.id == feedback_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")

    feedback, author = row
    feedback.status = data.status
    feedback.admin_note = data.admin_note
    await db.commit()
    await db.refresh(feedback)
    return feedback_response(feedback, author, include_email=True)
