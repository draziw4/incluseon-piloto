from fastapi import HTTPException, status

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from access_policy import STUDENT_PERMISSION_TO_TOOL, role_has_tool
from models.models import (
    User,
    UserRole,
    Student,
    StudentProfessional
)

PERMISSION_MESSAGES = {
    "can_view": "Você não tem permissão para acessar este aluno.",
    "can_register_aba": "Você não tem permissão para registrar observações comportamentais neste aluno.",
    "can_create_assessment": "Você não tem permissão para criar avaliações ou entrevistas neste aluno.",
    "can_create_pei": "Você não tem permissão para criar ou editar o PAEE deste aluno.",
    "can_generate_ai_report": "Você não tem permissão para gerar relatório IA para este aluno.",
    "can_view_reports": "Você não tem permissão para visualizar relatórios deste aluno.",
}


def require_behavior_record_ownership(
    user: User,
    created_by_id: int | None,
) -> None:
    """Prevent support professionals from changing another author's record."""
    if (
        user.role == UserRole.SUPPORT_PROFESSIONAL
        and created_by_id != user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="O profissional de apoio só pode editar ou excluir registros criados por ele.",
        )

async def get_student_or_404(
    db: AsyncSession,
    student_id: int
) -> Student:
    student = await db.get(
        Student,
        student_id
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )

    return student


async def get_student_professional_link(
    db: AsyncSession,
    user_id: int,
    student_id: int
) -> StudentProfessional | None:
    result = await db.execute(
        select(StudentProfessional).where(
            StudentProfessional.user_id == user_id,
            StudentProfessional.student_id == student_id
        )
    )

    return result.scalars().first()


async def can_access_student(
    db: AsyncSession,
    user: User,
    student_id: int
) -> bool:
    student = await get_student_or_404(
        db=db,
        student_id=student_id
    )

    if user.role == UserRole.ADMIN:
        return True

    if student.psychologist_id == user.id:
        return True

    link = await get_student_professional_link(
        db=db,
        user_id=user.id,
        student_id=student_id
    )

    if not link:
        return False

    return link.can_view is True


async def require_student_access(
    db: AsyncSession,
    user: User,
    student_id: int,
) -> Student:
    student = await get_student_or_404(
        db=db,
        student_id=student_id
    )

    if user.role == UserRole.ADMIN:
        return student

    if student.psychologist_id == user.id:
        return student

    link = await get_student_professional_link(
        db=db,
        user_id=user.id,
        student_id=student_id
    )

    if link and link.can_view:
        return student


    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=PERMISSION_MESSAGES["can_view"]
    )


async def require_student_permission(
    db: AsyncSession,
    user: User,
    student_id: int,
    permission: str
) -> Student:
    student = await get_student_or_404(
        db=db,
        student_id=student_id
    )

    if user.role == UserRole.ADMIN:
        return student

    required_tool = STUDENT_PERMISSION_TO_TOOL.get(permission)
    if required_tool is not None and not role_has_tool(user.role, required_tool):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=PERMISSION_MESSAGES.get(
                permission,
                "Seu perfil profissional não possui acesso a esta ferramenta.",
            ),
        )

    if student.psychologist_id == user.id:
        return student

    link = await get_student_professional_link(
        db=db,
        user_id=user.id,
        student_id=student_id
    )

    if not link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário não vinculado a este aluno"
        )

    has_permission = getattr(
        link,
        permission,
        False
    )

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=PERMISSION_MESSAGES.get(
                permission,
                "Você não tem permissão para realizar esta ação."
            )
        )


    return student


async def require_student_report_access(
    db: AsyncSession,
    user: User,
    student_id: int
) -> Student:
    student = await require_student_access(
        db=db,
        user=user,
        student_id=student_id
    )

    if user.role == UserRole.ADMIN or student.psychologist_id == user.id:
        return student

    link = await get_student_professional_link(
        db=db,
        user_id=user.id,
        student_id=student_id
    )

    if link and (link.can_view_reports or link.can_generate_ai_report):
        return student

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=PERMISSION_MESSAGES["can_view_reports"]
    )
