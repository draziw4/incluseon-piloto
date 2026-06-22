from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date,datetime

class StudentBase(BaseModel):

    name: str = Field(min_length=3, max_length=255)
    age: int | None = Field(default=None, ge=1, le=120)
    birth_date: date
    diagnosis: str | None = None

    school_name: str | None = None

    guardian_name: str | None = None
    guardian_phone: str | None = None

    communication_notes: str | None = None
    sensory_notes: str | None = None
    general_observations: str | None = None

    @field_validator("birth_date")
    @classmethod
    def birth_date_cannot_be_in_the_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Data de nascimento não pode estar no futuro")

        return value



class StudentUpdate(BaseModel):

    name: str | None = Field(default=None, min_length=3, max_length=255)
    age: int | None = Field(default=None, ge=1, le=120)
    birth_date: date | None = None

    diagnosis: str | None = None

    school_name: str | None = None

    guardian_name: str | None = None
    guardian_phone: str | None = None

    communication_notes: str | None = None
    sensory_notes: str | None = None
    general_observations: str | None = None

    @field_validator("birth_date")
    @classmethod
    def birth_date_cannot_be_in_the_future(cls, value: date | None) -> date | None:
        if value is not None and value > date.today():
            raise ValueError("Data de nascimento não pode estar no futuro")

        return value




class StudentCreate(StudentBase):
    pass





class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id:int
    psychologist_id:int
    created_at:datetime
