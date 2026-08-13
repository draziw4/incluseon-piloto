from pydantic import BaseModel, Field, model_validator

from access_policy import tools_for_role
from models.models import StudentProfessionalRole, UserRole


class LinkedUserResponse(BaseModel):
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


class StudentProfessionalCreate(BaseModel):
    user_id: int
    role_in_student: StudentProfessionalRole

    can_view: bool = True
    can_register_aba: bool = False
    can_create_assessment: bool = False
    can_create_pei: bool = False
    can_generate_ai_report: bool = False
    can_view_reports: bool = False


class StudentProfessionalUpdate(BaseModel):
    role_in_student: StudentProfessionalRole | None = None

    can_view: bool | None = None
    can_register_aba: bool | None = None
    can_create_assessment: bool | None = None
    can_create_pei: bool | None = None
    can_generate_ai_report: bool | None = None
    can_view_reports: bool | None = None


class StudentProfessionalResponse(BaseModel):
    id: int
    student_id: int
    user_id: int
    role_in_student: StudentProfessionalRole

    can_view: bool
    can_register_aba: bool
    can_create_assessment: bool
    can_create_pei: bool
    can_generate_ai_report: bool
    can_view_reports: bool

    user: LinkedUserResponse | None = None

    model_config = {
        "from_attributes": True
    }
