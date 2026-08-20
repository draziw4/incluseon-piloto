from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from models.models import StudentGoalPriority, StudentGoalStatus


class StudentGoalBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    area: str = Field(min_length=2, max_length=100)
    status: StudentGoalStatus = StudentGoalStatus.NOT_STARTED
    priority: StudentGoalPriority = StudentGoalPriority.MEDIUM
    target_date: date | None = None
    progress: int = Field(default=0, ge=0, le=100)
    evidence_notes: str | None = Field(default=None, max_length=5000)

    @field_validator("target_date")
    @classmethod
    def target_date_should_not_be_too_old(cls, value: date | None) -> date | None:
        if value is not None and value.year < 2000:
            raise ValueError("Prazo inválido")

        return value


class StudentGoalCreate(StudentGoalBase):
    pass


class StudentGoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    area: str | None = Field(default=None, min_length=2, max_length=100)
    status: StudentGoalStatus | None = None
    priority: StudentGoalPriority | None = None
    target_date: date | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    evidence_notes: str | None = Field(default=None, max_length=5000)

    @field_validator("target_date")
    @classmethod
    def target_date_should_not_be_too_old(cls, value: date | None) -> date | None:
        if value is not None and value.year < 2000:
            raise ValueError("Prazo inválido")

        return value


class StudentGoalResponse(StudentGoalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    created_by_id: int | None
    created_at: datetime
    updated_at: datetime
