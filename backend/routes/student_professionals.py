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
from access_policy import (
    STUDENT_ROLE_FOR_USER_ROLE,
    STUDENT_PERMISSION_TO_TOOL,
    ToolAccess,
    normalize_student_permissions,
)
from permissions import require_tool

from dependencies import get_current_user
from sqlalchemy.orm import selectinload

from models.models import (
    AccountStatus,
    User,
    UserRole,
    Student,
    StudentProfessional
)

from schemas.student_professional import (
    StudentProfessionalCreate,
    StudentProfessionalUpdate,
    StudentProfessionalResponse
)

from services.permissions_service import (
    require_student_access
)


router = APIRouter(
    prefix="/students",
    tags=["Student Professionals"],
)

@router.get(
    "/{student_id}/professionals",
    response_model=list[StudentProfessionalResponse]
)
async def list_student_professionals(
    student_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    await require_student_access(
        db=db,
        user=current_user,
        student_id=student_id
    )

    result = await db.execute(
        select(StudentProfessional)
        .options(
            selectinload(StudentProfessional.user)
        )
        .where(
            StudentProfessional.student_id == student_id
        )
        .order_by(StudentProfessional.id.desc())
    )

    return result.scalars().all()


@router.post(
    "/{student_id}/professionals",
    response_model=StudentProfessionalResponse,
    status_code=status.HTTP_201_CREATED
)
async def add_student_professional(
    student_id: int,
    data: StudentProfessionalCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_tool(ToolAccess.TEAM_MANAGEMENT))]
):
    student = await db.get(
        Student,
        student_id
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )

    if (
        student.psychologist_id != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para vincular profissionais"
        )

    user_to_link = await db.get(
        User,
        data.user_id
    )

    if not user_to_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário profissional não encontrado"
        )

    if user_to_link.account_status != AccountStatus.ACTIVE or user_to_link.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Somente profissionais ativos podem ser vinculados ao aluno",
        )

    expected_student_role = STUDENT_ROLE_FOR_USER_ROLE.get(user_to_link.role)
    if expected_student_role != data.role_in_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O papel no aluno deve corresponder ao perfil profissional aprovado",
        )

    existing_result = await db.execute(
        select(StudentProfessional).where(
            StudentProfessional.student_id == student_id,
            StudentProfessional.user_id == data.user_id
        )
    )

    existing_link = existing_result.scalars().first()

    if existing_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este profissional já está vinculado a este aluno"
        )

    allowed_permissions = normalize_student_permissions(
        user_to_link.role,
        {
            permission: getattr(data, permission)
            for permission in STUDENT_PERMISSION_TO_TOOL
        },
    )

    link = StudentProfessional(
        student_id=student_id,
        user_id=data.user_id,
        role_in_student=data.role_in_student,
        **allowed_permissions,
    )

    db.add(link)

    await db.commit()
    await db.refresh(link)

    result = await db.execute(
        select(StudentProfessional)
        .options(
            selectinload(StudentProfessional.user)
        )
        .where(
            StudentProfessional.id == link.id
        )
    )

    return result.scalars().first()


@router.patch(
    "/{student_id}/professionals/{link_id}",
    response_model=StudentProfessionalResponse
)
async def update_student_professional(
    student_id: int,
    link_id: int,
    data: StudentProfessionalUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_tool(ToolAccess.TEAM_MANAGEMENT))]
):
    student = await db.get(
        Student,
        student_id
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )

    if (
        student.psychologist_id != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para editar permissões"
        )

    result = await db.execute(
        select(StudentProfessional)
        .where(
            StudentProfessional.id == link_id,
            StudentProfessional.student_id == student_id
        )
    )

    link = result.scalar_one_or_none()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vínculo não encontrado"
        )

    if link.role_in_student == StudentProfessionalRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O vínculo do responsável principal é gerenciado pelo cadastro do aluno",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            link,
            field,
            value
        )

    linked_user = await db.get(User, link.user_id)
    if not linked_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário profissional não encontrado",
        )

    expected_student_role = STUDENT_ROLE_FOR_USER_ROLE.get(linked_user.role)
    if expected_student_role != link.role_in_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O papel no aluno deve corresponder ao perfil profissional aprovado",
        )

    normalized_permissions = normalize_student_permissions(
        linked_user.role,
        {
            permission: getattr(link, permission)
            for permission in STUDENT_PERMISSION_TO_TOOL
        },
    )
    for permission, value in normalized_permissions.items():
        setattr(link, permission, value)

    await db.commit()

    result = await db.execute(
        select(StudentProfessional)
        .options(
            selectinload(StudentProfessional.user)
        )
        .where(
            StudentProfessional.id == link_id
        )
    )

    updated_link = result.scalar_one()

    return updated_link



@router.delete(
    "/{student_id}/professionals/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def remove_student_professional(
    student_id: int,
    link_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_tool(ToolAccess.TEAM_MANAGEMENT))]
):
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado",
        )

    if student.psychologist_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para remover profissionais",
        )

    link = await db.get(
        StudentProfessional,
        link_id
    )

    if not link or link.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vínculo não encontrado"
        )

    if link.role_in_student == StudentProfessionalRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O responsável principal não pode ser removido da equipe",
        )

    await db.delete(link)
    await db.commit()
