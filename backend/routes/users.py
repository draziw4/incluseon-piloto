from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.models import User, UserRole
from permissions import require_role
from schemas.user import (
    PasswordChange,
    UserCreate,
    UserResponse,
    UserSearchResponse,
    UserUpdate,
)
from security import hash_password, verify_password
from services.auth import check_user

router = APIRouter(prefix="/users", tags=["Users"])
AdminUser = Annotated[User, Depends(require_role([UserRole.ADMIN]))]


@router.get("/search", response_model=list[UserSearchResponse])
async def search_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    search: str = Query(min_length=2),
):
    result = await db.execute(
        select(User)
        .where(or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
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
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("", response_model=list[UserResponse])
async def get_users(_admin: AdminUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.name))
    return result.scalars().all()


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
