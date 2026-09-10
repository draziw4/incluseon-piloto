from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StudentFolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Informe o nome da pasta")
        return normalized


class StudentFolderUpdate(StudentFolderCreate):
    pass


class StudentFolderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    name: str
    created_at: datetime
    can_manage: bool = False
