from typing import Annotated
from datetime import datetime, timedelta
import asyncio
import logging
import secrets

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, func, select
from database import get_db
from security import create_access_token,verify_password,create_refresh_token,decode_token

from models.models import PasswordResetToken, User
from schemas.token import Token,RefreshTokenRequest
from schemas.user import PasswordResetConfirm, PasswordResetRequest
from fastapi.security import OAuth2PasswordRequestForm
from services.redis_service import client as redis_client
import hashlib
from config import settings
from dependencies import get_current_user
from services.email_service import send_password_reset_email


logger = logging.getLogger("incluseon.auth")


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/login")
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    identifier = f"{request.client.host if request.client else 'unknown'}:{form_data.username.lower()}"
    rate_key = f"login-attempt:{hashlib.sha256(identifier.encode()).hexdigest()}"
    try:
        attempts = int(await redis_client.get(rate_key) or 0)
        if attempts >= 5:
            raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde 15 minutos.")
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de autenticação temporariamente indisponível",
        ) from error

    result = await db.execute(
        select(User).where(func.lower(User.email) == form_data.username.lower())
    )

    user = result.scalar_one_or_none()

    if not user:
        await record_failed_login(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )

    valid_password = verify_password(form_data.password,user.password_hash)


    if not valid_password:
        await record_failed_login(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )

    access_token = create_access_token(user.id, user.token_version)
    refresh_token = create_refresh_token(user.id, user.token_version)
    request.state.user_id = user.id
    try:
        await redis_client.delete(rate_key)
    except Exception:
        pass

    set_auth_cookies(response, access_token, refresh_token)
    return Token()


async def record_failed_login(rate_key: str) -> None:
    try:
        async with redis_client.pipeline(transaction=True) as pipe:
            await pipe.incr(rate_key).expire(rate_key, 900).execute()
    except Exception:
        pass




@router.post("/refresh")
async def refresh_access_token(
    response: Response,
    db: AsyncSession = Depends(get_db),
    data: RefreshTokenRequest | None = None,
    refresh_cookie: Annotated[
        str | None,
        Cookie(alias=settings.refresh_cookie_name)
    ] = None,
):
    refresh_token = refresh_cookie or (data.refresh_token if data else None)
    payload = decode_token(refresh_token or "")

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )

    user_id = payload.get("sub")

    if not isinstance(user_id, str) or not user_id.isdigit():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )

    user = await db.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")

    if payload.get("ver", 0) != user.token_version:
        raise HTTPException(status_code=401, detail="Sessão expirada")

    token_id = payload.get("jti")
    if not isinstance(token_id, str):
        raise HTTPException(status_code=401, detail="Token inválido")
    try:
        claimed = await redis_client.set(
            f"refresh-used:{token_id}",
            "1",
            ex=settings.refresh_token_expire_days * 86400,
            nx=True,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de autenticação temporariamente indisponível",
        ) from error
    if not claimed:
        raise HTTPException(status_code=401, detail="Token já utilizado")

    new_access_token = create_access_token(user.id, user.token_version)
    new_refresh_token = create_refresh_token(user.id, user.token_version)
    set_auth_cookies(response, new_access_token, new_refresh_token)
    return Token()


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    current_user.token_version += 1
    await db.commit()
    clear_auth_cookies(response)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    common = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "strict",
        "domain": settings.cookie_domain,
        "path": "/",
    }
    response.set_cookie(
        settings.access_cookie_name,
        access_token,
        max_age=settings.access_token_expire_minutes * 60,
        **common,
    )
    response.set_cookie(
        settings.refresh_cookie_name,
        refresh_token,
        max_age=settings.refresh_token_expire_days * 86400,
        **common,
    )


def clear_auth_cookies(response: Response) -> None:
    for name in (settings.access_cookie_name, settings.refresh_cookie_name):
        response.delete_cookie(
            name,
            path="/",
            domain=settings.cookie_domain,
            secure=settings.cookie_secure,
            httponly=True,
            samesite="strict",
        )


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(
    request: Request,
    data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    identifier = f"{request.client.host if request.client else 'unknown'}:{data.email.lower()}"
    rate_key = f"password-reset:{hashlib.sha256(identifier.encode()).hexdigest()}"
    try:
        attempts = int(await redis_client.get(rate_key) or 0)
        if attempts >= 3:
            return {"message": "Se o e-mail estiver cadastrado, enviaremos as instruções."}
        async with redis_client.pipeline(transaction=True) as pipe:
            await pipe.incr(rate_key).expire(rate_key, 3600).execute()
    except Exception:
        pass

    await db.execute(
        delete(PasswordResetToken).where(
            PasswordResetToken.expires_at < datetime.utcnow()
        )
    )
    await db.commit()
    result = await db.execute(
        select(User).where(func.lower(User.email) == data.email.lower())
    )
    user = result.scalar_one_or_none()
    if user:
        raw_token = secrets.token_urlsafe(48)
        reset = PasswordResetToken(
            user_id=user.id,
            token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
            expires_at=datetime.utcnow() + timedelta(minutes=30),
        )
        db.add(reset)
        await db.commit()
        try:
            await asyncio.to_thread(send_password_reset_email, user.email, raw_token)
        except Exception:
            await db.delete(reset)
            await db.commit()
            logger.exception("password_reset_email_failed")
    return {"message": "Se o e-mail estiver cadastrado, enviaremos as instruções."}


@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
async def confirm_password_reset(
    data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
):
    token_hash = hashlib.sha256(data.token.encode()).hexdigest()
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    )
    reset = result.scalar_one_or_none()
    if not reset or reset.used_at or reset.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")

    user = await db.get(User, reset.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")

    from security import hash_password

    user.password_hash = hash_password(data.new_password)
    user.token_version += 1
    reset.used_at = datetime.utcnow()
    await db.commit()
