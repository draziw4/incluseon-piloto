from fastapi import Cookie, Depends,HTTPException,Request,status
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from config import settings
from security import decode_token, oauth2_scheme
from models.models import User,Student
from typing import Annotated


async def get_current_user(
        request: Request,
        token: Annotated[str | None, Depends(oauth2_scheme)],
        db:Annotated[AsyncSession,Depends(get_db)],
        access_cookie: Annotated[str | None, Cookie(alias=settings.access_cookie_name)] = None
)-> User:
    payload = decode_token(token or access_cookie or "")
    user_id = payload.get("sub") if payload and payload.get("type") == "access" else None
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Inválido"
        )
    
    user = await db.get(
        User,
        int(user_id)
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado"
        )
    
    if payload.get("ver", 0) != user.token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão expirada"
        )

    request.state.user_id = user.id
    return user


async def verify_student(db:Annotated[AsyncSession,Depends(get_db)],student_id:int):
    student = await db.get(Student,student_id)

    if not student:
        raise HTTPException(status_code=status.HTTP_302_FOUND,detail="Aluno não encontrado")
    
    return student
