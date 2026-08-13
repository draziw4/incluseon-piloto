from typing import Annotated
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from access_policy import (
    ROLE_LABELS,
    STUDENT_PERMISSION_TO_TOOL,
    ToolAccess,
    normalize_student_permissions,
    tools_for_role,
)
from models.models import AccountStatus, StudentProfessional, User, UserRole
from permissions import require_role, require_tool
from schemas.user import (
    AdminUserReview,
    PasswordChange,
    RoleAccessResponse,
    UserCreate,
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


@router.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: int,
    admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Você não pode excluir a própria conta")
    user = await check_user(db, user_id)
    await db.delete(user)
    await db.commit()
    return user
