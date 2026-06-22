from pwdlib import PasswordHash
from datetime import datetime, timedelta, UTC
from typing import Any
import secrets
from jose import jwt,JWTError
from fastapi.security import OAuth2PasswordBearer

from config import settings

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False
)



def hash_password(password:str) -> str:
    return password_hash.hash(password)

def verify_password(plain_password:str,hashed_password:str) -> str:
    return password_hash.verify(plain_password,hashed_password)


def create_access_token(user_id: int, token_version: int = 0):
    expire = datetime.now(UTC) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "type": "access",
        "ver": token_version,
        "exp": expire
    }

    return jwt.encode(
        payload,
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm
    )

def create_refresh_token(user_id: int, token_version: int = 0):

    expire = datetime.now(UTC) + timedelta(
        days=settings.refresh_token_expire_days
    )

    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "ver": token_version,
        "jti": secrets.token_urlsafe(24),
        "exp": expire
    }

    return jwt.encode(
        payload,
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm
    )

def decode_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm]
        )
    except JWTError:
        return None


def decode_access_token_subject(token: str) -> str | None:
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        return None

    subject = payload.get("sub")

    return subject if isinstance(subject, str) else None
