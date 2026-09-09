from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from date_utils import current_local_date


def calculate_age(birth_date: date, reference_date: date | None = None) -> int:
    today = reference_date or current_local_date()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )

class StudentBase(BaseModel):

    name: str = Field(min_length=3, max_length=255)
    birth_date: date
    diagnosis: str | None = None
    strengths: str | None = None
    difficulties: str | None = None
    takes_medication: bool = False
    medications: str | None = None

    school_name: str | None = None

    guardian_name: str | None = None
    guardian_phone: str | None = None

    communication_notes: str | None = None
    sensory_notes: str | None = None
    general_observations: str | None = None

    @field_validator("birth_date")
    @classmethod
    def birth_date_cannot_be_in_the_future(cls, value: date) -> date:
        if value > current_local_date():
            raise ValueError("Data de nascimento não pode estar no futuro")

        return value

    @model_validator(mode="after")
    def medication_details_match_usage(self):
        if self.takes_medication and not (self.medications or "").strip():
            raise ValueError("Informe quais medicamentos o aluno utiliza")
        if not self.takes_medication:
            self.medications = None
        return self



class StudentUpdate(BaseModel):

    name: str | None = Field(default=None, min_length=3, max_length=255)
    birth_date: date | None = None

    diagnosis: str | None = None
    strengths: str | None = None
    difficulties: str | None = None
    takes_medication: bool | None = None
    medications: str | None = None

    school_name: str | None = None

    guardian_name: str | None = None
    guardian_phone: str | None = None

    communication_notes: str | None = None
    sensory_notes: str | None = None
    general_observations: str | None = None

    @field_validator("birth_date")
    @classmethod
    def birth_date_cannot_be_in_the_future(cls, value: date | None) -> date | None:
        if value is not None and value > current_local_date():
            raise ValueError("Data de nascimento não pode estar no futuro")

        return value




class StudentCreate(StudentBase):
    pass





class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    age: int | None
    psychologist_id: int
    created_at: datetime

    @model_validator(mode="after")
    def derive_current_age(self):
        self.age = calculate_age(self.birth_date)
        return self
