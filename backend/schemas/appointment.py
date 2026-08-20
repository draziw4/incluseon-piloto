from datetime import datetime

from pydantic import BaseModel, Field

from models.models import (
    AppointmentType,
    AppointmentStatus
)


class AppointmentCreate(BaseModel):
    student_id: int

    appointment_type: AppointmentType

    scheduled_at: datetime

    status: AppointmentStatus = AppointmentStatus.SCHEDULED

    objective: str | None = Field(
        default=None,
        max_length=2000
    )

    summary: str | None = Field(
        default=None,
        max_length=5000
    )

    observations: str | None = Field(
        default=None,
        max_length=5000
    )

    next_steps: str | None = Field(
        default=None,
        max_length=3000
    )


class AppointmentUpdate(BaseModel):
    appointment_type: AppointmentType | None = None

    scheduled_at: datetime | None = None

    status: AppointmentStatus | None = None

    objective: str | None = Field(
        default=None,
        max_length=2000
    )

    summary: str | None = Field(
        default=None,
        max_length=5000
    )

    observations: str | None = Field(
        default=None,
        max_length=5000
    )

    next_steps: str | None = Field(
        default=None,
        max_length=3000
    )


class AppointmentProfessionalResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    model_config = {
        "from_attributes": True
    }


class AppointmentStudentResponse(BaseModel):
    id: int
    name: str
    age: int
    school_name: str | None = None

    model_config = {
        "from_attributes": True
    }


class AppointmentResponse(BaseModel):
    id: int

    student_id: int
    professional_id: int | None

    appointment_type: AppointmentType
    status: AppointmentStatus

    scheduled_at: datetime

    objective: str | None = None
    summary: str | None = None
    observations: str | None = None
    next_steps: str | None = None

    created_at: datetime
    updated_at: datetime

    student: AppointmentStudentResponse | None = None
    professional: AppointmentProfessionalResponse | None = None

    model_config = {
        "from_attributes": True
    }
