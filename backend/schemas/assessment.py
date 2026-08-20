from datetime import datetime

from pydantic import BaseModel,ConfigDict


# =====================================
# BASE
# =====================================

class AssessmentBase(BaseModel):

    title: str

    assessment_type: str

    assessment_data: dict


# =====================================
# CREATE
# =====================================

class AssessmentCreate(
    AssessmentBase
):
    pass


# =====================================
# UPDATE
# =====================================

class AssessmentUpdate(
    BaseModel
):

    title: str | None = None

    assessment_type: str | None = None

    assessment_data: dict | None = None


# =====================================
# RESPONSE
# =====================================

class AssessmentResponse(
    AssessmentBase
):
    model_config = ConfigDict(from_attributes=True)

    id: int

    student_id: int
    psychologist_id: int | None

    created_at: datetime
    updated_at: datetime
