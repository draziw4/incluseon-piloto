from datetime import datetime
from pydantic import BaseModel, Field, computed_field


class AIReportUpdate(BaseModel):
    content: str = Field(min_length=100, max_length=100_000)
    expected_revision: int = Field(ge=1)


class AIReportResponse(BaseModel):
    id: int
    student_id: int
    report_type: str
    content: str
    pdf_path: str | None = Field(exclude=True)
    model_used: str | None
    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None
    created_at: datetime
    updated_at: datetime
    revision: int

    @computed_field
    @property
    def pdf_available(self) -> bool:
        return bool(self.pdf_path)

    model_config = {
        "from_attributes": True
    }
