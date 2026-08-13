from fastapi import (
    APIRouter,
    Depends,
    Query
    ,HTTPException,
    status
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from typing import Annotated

from datetime import datetime

from database import get_db
from access_policy import ToolAccess
from permissions import require_tool

from dependencies import get_current_user

from services.permissions_service import (
    require_student_permission,
    require_student_access
)

from models.models import (
    User,
    BehaviorRecord
)

from schemas.behavior_record import (
    BehaviorRecordCreate,
    BehaviorRecordResponse,
    BehaviorRecordUpdate
)


router = APIRouter(
    prefix="/behavior-records",
    tags=["Behavior Records"],
    dependencies=[Depends(require_tool(ToolAccess.BEHAVIOR_RECORDS))],
)


@router.post(
    "/student/{student_id}",
    response_model=BehaviorRecordResponse
)
async def create_behavior_record(
    student_id: int,
    data: BehaviorRecordCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    student = await require_student_permission(
        db=db,
        user=current_user,
        student_id=student_id,
        permission="can_register_aba"
    )

    record = BehaviorRecord(
        student_id=student.id,
        created_by_id=current_user.id,
        **data.model_dump()
    )

    db.add(record)

    await db.commit()
    await db.refresh(record)

    return record


@router.get(
    "/student/{student_id}",
    response_model=list[BehaviorRecordResponse]
)
async def get_behavior_records(
    student_id: int,

    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(get_current_user)
    ],

    page: int = Query(
        default=1,
        ge=1
    ),

    per_page: int = Query(
        default=20,
        ge=1,
        le=100
    ),

    min_intensity: int | None = Query(
        default=None,
        ge=1,
        le=10
    ),

    max_intensity: int | None = Query(
        default=None,
        ge=1,
        le=10
    ),

    start_date: datetime | None = Query(
        default=None
    ),

    end_date: datetime | None = Query(
        default=None
    )
):
    student = await require_student_access(
        db=db,
        user=current_user,
        student_id=student_id
    )

    query = select(
        BehaviorRecord
    ).where(
        BehaviorRecord.student_id == student.id
    )

    if min_intensity is not None:
        query = query.where(
            BehaviorRecord.intensity >= min_intensity
        )

    if max_intensity is not None:
        query = query.where(
            BehaviorRecord.intensity <= max_intensity
        )

    if start_date is not None:
        query = query.where(
            BehaviorRecord.created_at >= start_date
        )

    if end_date is not None:
        query = query.where(
            BehaviorRecord.created_at <= end_date
        )

    query = query.order_by(
        BehaviorRecord.created_at.desc()
    )

    offset = (page - 1) * per_page

    query = query.offset(
        offset
    ).limit(
        per_page
    )

    result = await db.execute(
        query
    )

    records = result.scalars().all()

    return records


async def get_record_or_404(db: AsyncSession, student_id: int, record_id: int):
    record = await db.get(BehaviorRecord, record_id)
    if not record or record.student_id != student_id:
        raise HTTPException(status_code=404, detail="Registro ABA não encontrado")
    return record


@router.patch("/student/{student_id}/{record_id}", response_model=BehaviorRecordResponse)
async def update_behavior_record(
    student_id: int,
    record_id: int,
    data: BehaviorRecordUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    await require_student_permission(db, current_user, student_id, "can_register_aba")
    record = await get_record_or_404(db, student_id, record_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(record, key, value)
    await db.commit()
    await db.refresh(record)
    return record


@router.delete("/student/{student_id}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_behavior_record(
    student_id: int,
    record_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    await require_student_permission(db, current_user, student_id, "can_register_aba")
    record = await get_record_or_404(db, student_id, record_id)
    await db.delete(record)
    await db.commit()
