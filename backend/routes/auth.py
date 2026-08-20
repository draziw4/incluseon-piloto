from typing import Annotated
from datetime import datetime, timedelta
import asyncio
import logging
import secrets

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from google.auth.exceptions import GoogleAuthError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from database import get_db
from security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

from access_policy import PUBLIC_PROFESSIONAL_ROLES, ROLE_LABELS
from models.models import AccountStatus, PasswordResetToken, User, UserRole
from schemas.token import Token,RefreshTokenRequest
from schemas.user import (
    AuthCapabilities,
    GoogleAuthResponse,
    GoogleCredentialRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    PublicRegistration,
    RegistrationResponse,
)
from fastapi.security import OAuth2PasswordRequestForm
from services.redis_service import client as redis_client
import hashlib
from config import settings
from dependencies import get_current_user
from services.email_service import send_password_reset_email
from services.google_identity import verify_google_credential
from services.notification_service import notify_active_admins_of_pending_account


logger = logging.getLogger("incluseon.auth")


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.get("/config", response_model=AuthCapabilities)
async def auth_capabilities():
    return AuthCapabilities(
        registration_enabled=settings.self_registration_enabled,
        google_enabled=bool(settings.google_client_id),
        google_client_id=settings.google_client_id,
        professional_roles=[
            {"value": role.value, "label": ROLE_LABELS[role]}
            for role in sorted(PUBLIC_PROFESSIONAL_ROLES, key=lambda item: ROLE_LABELS[item])
        ],
    )


def issue_session(request: Request, response: Response, user: User) -> Token:
    access_token = create_access_token(user.id, user.token_version)
    refresh_token = create_refresh_token(user.id, user.token_version)
    request.state.user_id = user.id
    set_auth_cookies(response, access_token, refresh_token)
    return Token()


async def enforce_public_auth_rate_limit(
    request: Request,
    purpose: str,
    subject: str,
    limit: int,
    window_seconds: int,
) -> None:
    identifier = f"{request.client.host if request.client else 'unknown'}:{subject.lower()}"
    rate_key = f"{purpose}:{hashlib.sha256(identifier.encode()).hexdigest()}"
    try:
        attempts = int(await redis_client.get(rate_key) or 0)
        if attempts >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas tentativas. Aguarde alguns minutos.",
            )
        async with redis_client.pipeline(transaction=True) as pipe:
            await pipe.incr(rate_key).expire(rate_key, window_seconds).execute()
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de autenticação temporariamente indisponível",
        ) from error


@router.post(
    "/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_account(
    request: Request,
    data: PublicRegistration,
    db: AsyncSession = Depends(get_db),
):
    if not settings.self_registration_enabled:
        raise HTTPException(status_code=403, detail="Criação de conta indisponível")

    await enforce_public_auth_rate_limit(
        request,
        purpose="account-registration",
        subject=data.email,
        limit=5,
        window_seconds=3600,
    )
    result = await db.execute(
        select(User).where(func.lower(User.email) == data.email.lower())
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")

    user = User(
        name=data.name.strip(),
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role=data.requested_role,
        requested_role=data.requested_role,
        credential_reference=data.credential_reference,
        account_status=AccountStatus.PENDING,
        auth_provider="password",
    )
    db.add(user)
    try:
        await db.flush()
        await notify_active_admins_of_pending_account(db, professional=user)
        await db.commit()
    except IntegrityError as error:
        await db.rollback()
        raise HTTPException(status_code=409, detail="E-mail já cadastrado") from error
    await db.refresh(user)
    return RegistrationResponse(
        account_status=user.account_status,
        message="Cadastro enviado para verificação do administrador.",
    )


@router.post("/google", response_model=GoogleAuthResponse)
async def google_login(
    request: Request,
    response: Response,
    data: GoogleCredentialRequest,
    db: AsyncSession = Depends(get_db),
):
    client_id = settings.google_client_id
    if not client_id:
        raise HTTPException(status_code=503, detail="Login com Google indisponível")

    await enforce_public_auth_rate_limit(
        request,
        purpose="google-login",
        subject=request.client.host if request.client else "unknown",
        limit=20,
        window_seconds=900,
    )
    try:
        identity = await asyncio.to_thread(
            verify_google_credential,
            data.credential,
            client_id,
        )
    except (GoogleAuthError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Identidade Google inválida") from error

    subject_result = await db.execute(
        select(User).where(User.google_subject == identity.subject)
    )
    user = subject_result.scalar_one_or_none()
    created_pending_user = False
    if user is None:
        email_result = await db.execute(
            select(User).where(func.lower(User.email) == identity.email)
        )
        user = email_result.scalar_one_or_none()

    if user is None:
        if not settings.self_registration_enabled:
            raise HTTPException(status_code=403, detail="Criação de conta indisponível")
        if data.requested_role is None or data.credential_reference is None:
            raise HTTPException(
                status_code=409,
                detail="Conta não encontrada. Faça seu cadastro profissional primeiro.",
            )
        user = User(
            name=identity.name,
            email=identity.email,
            password_hash=hash_password(secrets.token_urlsafe(48)),
            role=data.requested_role,
            requested_role=data.requested_role,
            credential_reference=data.credential_reference.strip(),
            account_status=AccountStatus.PENDING,
            auth_provider="google",
            google_subject=identity.subject,
        )
        db.add(user)
        created_pending_user = True
    else:
        if user.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=403,
                detail="Login Google permitido somente para contas profissionais",
            )
        if user.google_subject not in {None, identity.subject}:
            raise HTTPException(status_code=409, detail="Conta Google já vinculada")
        user.google_subject = identity.subject
        if user.auth_provider == "password":
            user.auth_provider = "password_google"

    try:
        if created_pending_user:
            await db.flush()
            await notify_active_admins_of_pending_account(db, professional=user)
        await db.commit()
    except IntegrityError as error:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Conta Google já vinculada") from error
    await db.refresh(user)
    if user.account_status != AccountStatus.ACTIVE:
        return GoogleAuthResponse(
            authenticated=False,
            account_status=user.account_status,
            message=account_status_message(user.account_status),
        )

    issue_session(request, response, user)
    return GoogleAuthResponse(
        authenticated=True,
        account_status=user.account_status,
        message="Acesso autorizado.",
    )


def account_status_message(account_status: AccountStatus) -> str:
    messages = {
        AccountStatus.PENDING: "Cadastro aguardando verificação do administrador.",
        AccountStatus.REJECTED: "Cadastro não aprovado. Entre em contato com o administrador.",
        AccountStatus.SUSPENDED: "Conta suspensa. Entre em contato com o administrador.",
        AccountStatus.ACTIVE: "Acesso autorizado.",
    }
    return messages[account_status]

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

    if user.account_status != AccountStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=account_status_message(user.account_status),
        )

    try:
        await redis_client.delete(rate_key)
    except Exception:
        pass

    return issue_session(request, response, user)


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

    if user.account_status != AccountStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=account_status_message(user.account_status),
        )

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

    user.password_hash = hash_password(data.new_password)
    user.token_version += 1
    reset.used_at = datetime.utcnow()
    await db.commit()
