from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query
)

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from typing import Annotated

from database import get_db
from access_policy import ToolAccess
from permissions import require_tool

from dependencies import get_current_user

from models.models import (
    User,
    UserRole,
    Appointment,
    AppointmentStatus
)

from schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse
)

from services.permissions_service import require_student_access


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
    dependencies=[Depends(require_tool(ToolAccess.APPOINTMENTS))],
)


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_appointment(
    data: AppointmentCreate,

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
        student_id=data.student_id
    )

    appointment = Appointment(
        student_id=student.id,
        professional_id=current_user.id,
        appointment_type=data.appointment_type,
        scheduled_at=data.scheduled_at,
        status=data.status,
        objective=data.objective,
        summary=data.summary,
        observations=data.observations,
        next_steps=data.next_steps
    )

    db.add(appointment)

    await db.commit()
    await db.refresh(appointment)

    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.student),
            selectinload(Appointment.professional)
        )
        .where(
            Appointment.id == appointment.id
        )
    )

    return result.scalars().first()


@router.get(
    "",
    response_model=list[AppointmentResponse]
)
async def list_appointments(
    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(get_current_user)
    ],

    status_filter: AppointmentStatus | None = Query(
        default=None,
        alias="status"
    ),

    search: str | None = Query(
        default=None
    )
):
    query = (
        select(Appointment)
        .options(
            selectinload(Appointment.student),
            selectinload(Appointment.professional)
        )
        .join(Appointment.student)
        .order_by(Appointment.scheduled_at.desc())
    )

    if current_user.role != UserRole.ADMIN:
        query = query.where(
            or_(
                Appointment.professional_id == current_user.id,
                Appointment.student.has(
                    psychologist_id=current_user.id
                )
            )
        )

    if status_filter:
        query = query.where(
            Appointment.status == status_filter
        )

    if search:
        query = query.where(
            Appointment.student.has(
                name=search
            )
        )

    result = await db.execute(query)

    return result.scalars().all()


@router.get(
    "/student/{student_id}",
    response_model=list[AppointmentResponse]
)
async def list_student_appointments(
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
        select(Appointment)
        .options(
            selectinload(Appointment.student),
            selectinload(Appointment.professional)
        )
        .where(
            Appointment.student_id == student.id
        )
        .order_by(
            Appointment.scheduled_at.desc()
        )
    )

    return result.scalars().all()


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse
)
async def get_appointment(
    appointment_id: int,

    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(get_current_user)
    ]
):
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.student),
            selectinload(Appointment.professional)
        )
        .where(
            Appointment.id == appointment_id
        )
    )

    appointment = result.scalars().first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atendimento não encontrado"
        )

    await require_student_access(
        db=db,
        user=current_user,
        student_id=appointment.student_id
    )

    return appointment


@router.patch(
    "/{appointment_id}",
    response_model=AppointmentResponse
)
async def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,

    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(get_current_user)
    ]
):
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.student),
            selectinload(Appointment.professional)
        )
        .where(
            Appointment.id == appointment_id
        )
    )

    appointment = result.scalars().first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atendimento não encontrado"
        )

    student = await require_student_access(
        db=db,
        user=current_user,
        student_id=appointment.student_id
    )

    if (
        current_user.role != UserRole.ADMIN
        and student.psychologist_id != current_user.id
        and appointment.professional_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para editar este atendimento"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            appointment,
            field,
            value
        )

    await db.commit()
    await db.refresh(appointment)

    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.student),
            selectinload(Appointment.professional)
        )
        .where(
            Appointment.id == appointment.id
        )
    )

    return result.scalars().first()


@router.delete(
    "/{appointment_id}",
    status_code=status.HTTP_200_OK
)
async def delete_appointment(
    appointment_id: int,

    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(get_current_user)
    ]
):
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.student)
        )
        .where(
            Appointment.id == appointment_id
        )
    )

    appointment = result.scalars().first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atendimento não encontrado"
        )

    student = await require_student_access(
        db=db,
        user=current_user,
        student_id=appointment.student_id
    )

    if (
        current_user.role != UserRole.ADMIN
        and student.psychologist_id != current_user.id
        and appointment.professional_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para excluir este atendimento"
        )

    await db.delete(appointment)
    await db.commit()

    return {
        "message": "Atendimento removido com sucesso"
    }
