from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from typing import Annotated

from database import get_db
from access_policy import ToolAccess
from permissions import require_tool

from dependencies import get_current_user

from services.permissions_service import (
    require_student_permission,
    require_student_access
)
from services.assessment_instruments import (
    INSTRUMENT_TYPE_LABELS,
    has_meaningful_answers,
)

from models.models import (
    User,
    Assessment
)

from schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentUpdate
)


router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
    dependencies=[Depends(require_tool(ToolAccess.ASSESSMENTS))],
)


def validate_instrument_payload(assessment_type: str, assessment_data: dict) -> None:
    if assessment_type not in INSTRUMENT_TYPE_LABELS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Selecione um dos três instrumentais disponíveis: responsáveis, equipe escolar ou avaliação do estudante.",
        )

    if not has_meaningful_answers(assessment_data):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Preencha ao menos uma resposta do instrumental.",
        )


@router.post(
    "/student/{student_id}",
    response_model=AssessmentResponse
)
async def create_assessment(
    student_id: int,
    data: AssessmentCreate,

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
        permission="can_create_assessment"
    )
    validate_instrument_payload(data.assessment_type, data.assessment_data)

    assessment = Assessment(
        student_id=student.id,
        psychologist_id=current_user.id,
        **data.model_dump()
    )

    db.add(assessment)

    await db.commit()
    await db.refresh(assessment)

    return assessment


@router.get(
    "/student/{student_id}",
    response_model=list[AssessmentResponse]
)
async def get_assessments_by_student(
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

    result = await db.execute(
        select(Assessment)
        .where(
            Assessment.student_id == student.id
        )
        .order_by(
            Assessment.created_at.desc()
        )
    )

    assessments = result.scalars().all()

    return assessments


async def get_assessment_or_404(db: AsyncSession, student_id: int, assessment_id: int):
    assessment = await db.get(Assessment, assessment_id)
    if not assessment or assessment.student_id != student_id:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return assessment


@router.patch("/student/{student_id}/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(
    student_id: int,
    assessment_id: int,
    data: AssessmentUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    await require_student_permission(db, current_user, student_id, "can_create_assessment")
    assessment = await get_assessment_or_404(db, student_id, assessment_id)
    effective_type = data.assessment_type or assessment.assessment_type
    effective_data = data.assessment_data if data.assessment_data is not None else assessment.assessment_data
    validate_instrument_payload(effective_type, effective_data)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(assessment, key, value)
    await db.commit()
    await db.refresh(assessment)
    return assessment


@router.delete("/student/{student_id}/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    student_id: int,
    assessment_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    await require_student_permission(db, current_user, student_id, "can_create_assessment")
    assessment = await get_assessment_or_404(db, student_id, assessment_id)
    await db.delete(assessment)
    await db.commit()
