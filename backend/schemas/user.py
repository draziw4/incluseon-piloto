from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from access_policy import PUBLIC_PROFESSIONAL_ROLES, tools_for_role
from models.models import AccountStatus, UserRole


class UserBase(BaseModel):
    name:str
    email:EmailStr



class UserCreate(UserBase):
    password: str = Field(min_length=12, max_length=128)
    role: UserRole = UserRole.PSYCHOLOGIST
    credential_reference: str | None = Field(default=None, max_length=120)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id:int
    role:UserRole
    auth_provider: str
    account_status: AccountStatus
    requested_role: UserRole | None = None
    credential_reference: str | None = None
    review_note: str | None = None
    reviewed_at: datetime | None = None
    allowed_tools: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def populate_allowed_tools(self):
        self.allowed_tools = tools_for_role(self.role)
        return self


class UserUpdate(UserBase):
    name: str | None = None
    email: EmailStr | None = None 
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: UserRole | None = None


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=6)
    new_password: str = Field(min_length=8, max_length=128)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=8, max_length=128)


class PublicRegistration(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    requested_role: UserRole
    credential_reference: str = Field(min_length=3, max_length=120)
    accepted_terms: Literal[True]

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("Informe um nome válido")
        return cleaned

    @field_validator("requested_role")
    @classmethod
    def validate_requested_role(cls, value: UserRole) -> UserRole:
        if value not in PUBLIC_PROFESSIONAL_ROLES:
            raise ValueError("Perfil profissional indisponível para cadastro público")
        return value

    @field_validator("credential_reference")
    @classmethod
    def validate_credential_reference(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("Informe seu registro, matrícula ou vínculo profissional")
        return cleaned


class GoogleCredentialRequest(BaseModel):
    credential: str = Field(min_length=100, max_length=5000)
    requested_role: UserRole | None = None
    credential_reference: str | None = Field(default=None, min_length=3, max_length=120)

    @field_validator("requested_role")
    @classmethod
    def validate_requested_role(cls, value: UserRole | None) -> UserRole | None:
        if value is not None and value not in PUBLIC_PROFESSIONAL_ROLES:
            raise ValueError("Perfil profissional indisponível para cadastro público")
        return value

    @field_validator("credential_reference")
    @classmethod
    def validate_credential_reference(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("Informe seu registro, matrícula ou vínculo profissional")
        return cleaned


class RegistrationResponse(BaseModel):
    account_status: AccountStatus
    message: str


class GoogleAuthResponse(BaseModel):
    authenticated: bool
    account_status: AccountStatus
    message: str


class AuthCapabilities(BaseModel):
    registration_enabled: bool
    google_enabled: bool
    google_client_id: str | None = None
    professional_roles: list[dict[str, str]] = Field(default_factory=list)


class AdminUserReview(BaseModel):
    status: Literal[AccountStatus.ACTIVE, AccountStatus.REJECTED, AccountStatus.SUSPENDED]
    role: UserRole
    review_note: str | None = Field(default=None, max_length=500)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: UserRole) -> UserRole:
        if value == UserRole.ADMIN:
            raise ValueError("A revisão profissional não pode conceder perfil administrador")
        return value


class RoleAccessResponse(BaseModel):
    role: UserRole
    label: str
    allowed_tools: list[str]




class UserSearchResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    allowed_tools: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def populate_allowed_tools(self):
        self.allowed_tools = tools_for_role(self.role)
        return self

    model_config = {
        "from_attributes": True
    }
