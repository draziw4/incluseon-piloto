from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from models.models import UserRole


class UserBase(BaseModel):
    name:str
    email:EmailStr



class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.PSYCHOLOGIST


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id:int
    role:UserRole
    auth_provider: str


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
    accepted_terms: Literal[True]

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("Informe um nome válido")
        return cleaned


class GoogleCredentialRequest(BaseModel):
    credential: str = Field(min_length=100, max_length=5000)


class AuthCapabilities(BaseModel):
    registration_enabled: bool
    google_enabled: bool
    google_client_id: str | None = None




class UserSearchResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole

    model_config = {
        "from_attributes": True
    }
