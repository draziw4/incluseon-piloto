from pydantic import BaseModel, EmailStr,Field,ConfigDict
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




class UserSearchResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole

    model_config = {
        "from_attributes": True
    }
