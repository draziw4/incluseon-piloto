from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from database import get_db
from dependencies import get_current_user
from models.models import StudentGoal, StudentGoalStatus, User
from schemas.student_goal import (
    StudentGoalCreate,
    StudentGoalResponse,
    StudentGoalUpdate
)
from services.permissions_service import (
    require_student_access,
    require_student_permission
)


router = APIRouter(prefix="/students", tags=["Student Goals"])


@router.get(
    "/{student_id}/goals",
    response_model=list[StudentGoalResponse]
)
async def list_student_goals(
    student_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    student = await require_student_access(db, current_user, student_id)

    result = await db.execute(
        select(StudentGoal)
        .where(StudentGoal.student_id == student.id)
        .order_by(StudentGoal.target_date.asc().nulls_last(), StudentGoal.created_at.desc())
    )

    return result.scalars().all()


@router.post(
    "/{student_id}/goals",
    response_model=StudentGoalResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_student_goal(
    student_id: int,
    data: StudentGoalCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    student = await require_student_permission(
        db=db,
        user=current_user,
        student_id=student_id,
        permission="can_create_pei"
    )

    goal_data = normalize_goal_state(data.model_dump())
    goal = StudentGoal(
        student_id=student.id,
        created_by_id=current_user.id,
        **goal_data
    )

    db.add(goal)
    await db.commit()
    await db.refresh(goal)

    return goal


@router.patch(
    "/{student_id}/goals/{goal_id}",
    response_model=StudentGoalResponse
)
async def update_student_goal(
    student_id: int,
    goal_id: int,
    data: StudentGoalUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    await require_student_permission(
        db=db,
        user=current_user,
        student_id=student_id,
        permission="can_create_pei"
    )
    goal = await get_goal_or_404(db, student_id, goal_id)

    update_data = normalize_goal_state(data.model_dump(exclude_unset=True))

    for field, value in update_data.items():
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)

    return goal


def normalize_goal_state(data: dict) -> dict:
    normalized = dict(data)

    if normalized.get("status") == StudentGoalStatus.COMPLETED:
        normalized["progress"] = 100
    elif normalized.get("progress") == 100:
        normalized["status"] = StudentGoalStatus.COMPLETED

    return normalized


@router.delete(
    "/{student_id}/goals/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_student_goal(
    student_id: int,
    goal_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    await require_student_permission(
        db=db,
        user=current_user,
        student_id=student_id,
        permission="can_create_pei"
    )
    goal = await get_goal_or_404(db, student_id, goal_id)

    await db.delete(goal)
    await db.commit()


async def get_goal_or_404(
    db: AsyncSession,
    student_id: int,
    goal_id: int
) -> StudentGoal:
    result = await db.execute(
        select(StudentGoal).where(
            StudentGoal.id == goal_id,
            StudentGoal.student_id == student_id
        )
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meta não encontrada"
        )

    return goal
