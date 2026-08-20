from typing import Annotated
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete as sa_delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from access_policy import (
    ROLE_LABELS,
    STUDENT_PERMISSION_TO_TOOL,
    ToolAccess,
    normalize_student_permissions,
    role_has_tool,
    tools_for_role,
)
from models.models import (
    AIReport,
    AIReportRevision,
    AccountStatus,
    Appointment,
    AppointmentStatus,
    Assessment,
    BehaviorRecord,
    PasswordResetToken,
    PilotFeedback,
    Student,
    StudentGoal,
    StudentProfessional,
    StudentProfessionalRole,
    User,
    UserRole,
)
from permissions import require_role, require_tool
from schemas.user import (
    AdminUserReview,
    PasswordChange,
    RoleAccessResponse,
    UserCreate,
    UserDeletionImpact,
    UserDeletionStudent,
    UserResponse,
    UserSearchResponse,
    UserUpdate,
)
from security import hash_password, verify_password
from services.auth import check_user

router = APIRouter(prefix="/users", tags=["Users"])
AdminUser = Annotated[User, Depends(require_role([UserRole.ADMIN]))]


async def normalize_user_student_links(db: AsyncSession, user: User) -> None:
    result = await db.execute(
        select(StudentProfessional).where(StudentProfessional.user_id == user.id)
    )
    for link in result.scalars().all():
        normalized = normalize_student_permissions(
            user.role,
            {
                permission: getattr(link, permission)
                for permission in STUDENT_PERMISSION_TO_TOOL
            },
        )
        for permission, value in normalized.items():
            setattr(link, permission, value)


async def scalar_count(db: AsyncSession, query) -> int:
    result = await db.execute(query)
    return result.scalar_one() or 0


def replacement_roles() -> list[UserRole]:
    return [
        role
        for role in UserRole
        if role != UserRole.ADMIN and role_has_tool(role, ToolAccess.STUDENT_MANAGEMENT)
    ]


@router.get("/search", response_model=list[UserSearchResponse])
async def search_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_tool(ToolAccess.TEAM_MANAGEMENT))],
    search: str = Query(min_length=2),
):
    result = await db.execute(
        select(User)
        .where(
            User.account_status == AccountStatus.ACTIVE,
            User.role != UserRole.ADMIN,
            or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")),
        )
        .limit(10)
    )
    return result.scalars().all()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: PasswordChange,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")

    current_user.password_hash = hash_password(data.new_password)
    current_user.token_version += 1
    await db.commit()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(func.lower(User.email) == data.email.lower())
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    user = User(
        name=data.name,
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role=data.role,
        requested_role=data.role,
        credential_reference=data.credential_reference,
        account_status=AccountStatus.ACTIVE,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("", response_model=list[UserResponse])
async def get_users(
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
    account_status: AccountStatus | None = None,
):
    query = select(User)
    if account_status is not None:
        query = query.where(User.account_status == account_status)
    result = await db.execute(query.order_by(User.account_status, User.name))
    return result.scalars().all()


@router.get("/access-matrix", response_model=list[RoleAccessResponse])
async def get_access_matrix(_admin: AdminUser):
    return [
        RoleAccessResponse(
            role=role,
            label=ROLE_LABELS[role],
            allowed_tools=tools_for_role(role),
        )
        for role in UserRole
        if role != UserRole.ADMIN
    ]


@router.patch("/{user_id}/review", response_model=UserResponse)
async def review_user(
    user_id: int,
    data: AdminUserReview,
    admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Revise sua conta por outro administrador")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não existe")
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Contas administrativas não usam esta revisão")

    user.role = data.role
    user.account_status = data.status
    user.review_note = data.review_note
    user.reviewed_at = datetime.utcnow()
    user.token_version += 1
    await normalize_user_student_links(db, user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}/deletion-impact", response_model=UserDeletionImpact)
async def get_user_deletion_impact(
    user_id: int,
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    user = await check_user(db, user_id)
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Contas administrativas não podem ser excluídas por este fluxo")

    owned_result = await db.execute(
        select(Student).where(Student.psychologist_id == user.id).order_by(Student.name)
    )
    owned_students = owned_result.scalars().all()

    linked_students_count = await scalar_count(
        db,
        select(func.count(func.distinct(StudentProfessional.student_id))).where(
            StudentProfessional.user_id == user.id
        ),
    )
    historical_counts = [
        await scalar_count(db, select(func.count(BehaviorRecord.id)).where(BehaviorRecord.created_by_id == user.id)),
        await scalar_count(db, select(func.count(Appointment.id)).where(Appointment.professional_id == user.id)),
        await scalar_count(db, select(func.count(Assessment.id)).where(Assessment.psychologist_id == user.id)),
        await scalar_count(db, select(func.count(StudentGoal.id)).where(StudentGoal.created_by_id == user.id)),
        await scalar_count(db, select(func.count(AIReport.id)).where(AIReport.created_by_id == user.id)),
        await scalar_count(db, select(func.count(AIReportRevision.id)).where(AIReportRevision.edited_by_id == user.id)),
        await scalar_count(db, select(func.count(PilotFeedback.id)).where(PilotFeedback.created_by_id == user.id)),
    ]
    future_appointments_count = await scalar_count(
        db,
        select(func.count(Appointment.id)).where(
            Appointment.professional_id == user.id,
            Appointment.scheduled_at >= datetime.utcnow(),
            Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.PENDING]),
        ),
    )
    candidates_result = await db.execute(
        select(User)
        .where(
            User.id != user.id,
            User.account_status == AccountStatus.ACTIVE,
            User.role.in_(replacement_roles()),
        )
        .order_by(User.name)
    )

    return UserDeletionImpact(
        user_id=user.id,
        user_name=user.name,
        owned_students=[UserDeletionStudent(id=student.id, name=student.name) for student in owned_students],
        linked_students_count=linked_students_count,
        historical_records_count=sum(historical_counts),
        future_appointments_count=future_appointments_count,
        replacement_candidates=candidates_result.scalars().all(),
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, _admin: AdminUser, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não existe")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não existe")

    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "password":
            user.password_hash = hash_password(value)
        elif key == "email":
            user.email = value.lower()
        else:
            setattr(user, key, value)

    if "role" in data.model_fields_set or "password" in data.model_fields_set:
        user.token_version += 1
    if "role" in data.model_fields_set:
        await normalize_user_student_links(db, user)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    admin: AdminUser,
    replacement_user_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Você não pode excluir a própria conta")
    user = await check_user(db, user_id)
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Contas administrativas não podem ser excluídas por este fluxo")

    owned_result = await db.execute(
        select(Student).where(Student.psychologist_id == user.id).order_by(Student.id)
    )
    owned_students = owned_result.scalars().all()
    replacement: User | None = None

    if owned_students:
        if replacement_user_id is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Transfira os alunos para outro responsável antes de excluir o profissional.",
            )
        replacement = await db.get(User, replacement_user_id)
        if (
            replacement is None
            or replacement.id == user.id
            or replacement.account_status != AccountStatus.ACTIVE
            or not role_has_tool(replacement.role, ToolAccess.STUDENT_MANAGEMENT)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O novo responsável precisa ser um profissional ativo autorizado a gerenciar alunos.",
            )

    try:
        if replacement is not None:
            owner_permissions = normalize_student_permissions(
                replacement.role,
                {permission: True for permission in STUDENT_PERMISSION_TO_TOOL},
            )
            for student in owned_students:
                student.psychologist = replacement
                link_result = await db.execute(
                    select(StudentProfessional).where(
                        StudentProfessional.student_id == student.id,
                        StudentProfessional.user_id == replacement.id,
                    )
                )
                replacement_link = link_result.scalar_one_or_none()
                if replacement_link is None:
                    replacement_link = StudentProfessional(
                        student_id=student.id,
                        user_id=replacement.id,
                        role_in_student=StudentProfessionalRole.OWNER,
                        **owner_permissions,
                    )
                    db.add(replacement_link)
                else:
                    replacement_link.role_in_student = StudentProfessionalRole.OWNER
                    for permission, allowed in owner_permissions.items():
                        setattr(replacement_link, permission, allowed)
            await db.flush()

        bulk_options = {"synchronize_session": False}
        await db.execute(
            update(Appointment)
            .where(
                Appointment.professional_id == user.id,
                Appointment.scheduled_at >= datetime.utcnow(),
                Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.PENDING]),
            )
            .values(status=AppointmentStatus.CANCELED)
            .execution_options(**bulk_options)
        )
        null_history_updates = [
            update(BehaviorRecord).where(BehaviorRecord.created_by_id == user.id).values(created_by_id=None),
            update(Appointment).where(Appointment.professional_id == user.id).values(professional_id=None),
            update(Assessment).where(Assessment.psychologist_id == user.id).values(psychologist_id=None),
            update(StudentGoal).where(StudentGoal.created_by_id == user.id).values(created_by_id=None),
            update(AIReport).where(AIReport.created_by_id == user.id).values(created_by_id=None),
            update(AIReport).where(AIReport.last_edited_by_id == user.id).values(last_edited_by_id=None),
            update(AIReportRevision).where(AIReportRevision.edited_by_id == user.id).values(edited_by_id=None),
            update(PilotFeedback).where(PilotFeedback.created_by_id == user.id).values(created_by_id=None),
        ]
        for statement in null_history_updates:
            await db.execute(statement.execution_options(**bulk_options))

        await db.execute(
            sa_delete(StudentProfessional)
            .where(StudentProfessional.user_id == user.id)
            .execution_options(**bulk_options)
        )
        await db.execute(
            sa_delete(PasswordResetToken)
            .where(PasswordResetToken.user_id == user.id)
            .execution_options(**bulk_options)
        )
        await db.flush()
        await db.delete(user)
        await db.commit()
    except IntegrityError as error:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A exclusão foi cancelada porque ainda existem referências que não puderam ser preservadas.",
        ) from error
