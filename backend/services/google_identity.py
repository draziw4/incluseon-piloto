from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


@dataclass(frozen=True)
class GoogleIdentity:
    subject: str
    email: str
    name: str


def verify_google_credential(credential: str, client_id: str) -> GoogleIdentity:
    payload = id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        client_id,
    )
    subject = payload.get("sub")
    email = payload.get("email")
    email_verified = payload.get("email_verified")
    name = payload.get("name")

    if not isinstance(subject, str) or not subject:
        raise ValueError("Identificador Google ausente")
    if not isinstance(email, str) or not email or email_verified is not True:
        raise ValueError("E-mail Google não verificado")

    safe_name = name.strip() if isinstance(name, str) and name.strip() else email.split("@", 1)[0]
    return GoogleIdentity(subject=subject, email=email.lower(), name=safe_name[:255])
