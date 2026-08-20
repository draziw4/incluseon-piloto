from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


ReportType = Literal["daily", "weekly"]
ProfessionalType = Literal["aee", "support"]
ReviewStatus = Literal["pending", "reviewed", "needs_adjustment"]


class StudentProgressReportBase(BaseModel):
    report_type: ReportType
    period_start: date
    period_end: date
    title: str = Field(min_length=3, max_length=255)
    summary: str = Field(min_length=10, max_length=20_000)
    activities: str | None = Field(default=None, max_length=20_000)
    participation_engagement: str | None = Field(default=None, max_length=20_000)
    progress: str | None = Field(default=None, max_length=20_000)
    difficulties: str | None = Field(default=None, max_length=20_000)
    strategies_and_resources: str | None = Field(default=None, max_length=20_000)
    communication_socialization: str | None = Field(default=None, max_length=20_000)
    autonomy_functionality: str | None = Field(default=None, max_length=20_000)
    family_school_notes: str | None = Field(default=None, max_length=20_000)
    next_steps: str | None = Field(default=None, max_length=20_000)
    participation_level: int | None = Field(default=None, ge=1, le=5)
    autonomy_level: int | None = Field(default=None, ge=1, le=5)
    communication_level: int | None = Field(default=None, ge=1, le=5)
    regulation_level: int | None = Field(default=None, ge=1, le=5)
    support_level: int | None = Field(default=None, ge=1, le=5)

    @model_validator(mode="after")
    def validate_period(self):
        if self.period_end < self.period_start:
            raise ValueError("A data final não pode ser anterior à data inicial")
        if self.report_type == "daily" and self.period_end != self.period_start:
            raise ValueError("O relatório diário deve usar a mesma data no início e no fim")
        if self.report_type == "weekly" and (self.period_end - self.period_start).days > 6:
            raise ValueError("O relatório semanal deve abranger no máximo sete dias")
        return self


class StudentProgressReportCreate(StudentProgressReportBase):
    professional_type: ProfessionalType | None = None

    @model_validator(mode="after")
    def validate_professional_type(self):
        if self.professional_type == "support" and self.report_type != "daily":
            raise ValueError("O relatório do profissional de apoio deve ser diário")
        return self


class StudentProgressReportUpdate(BaseModel):
    report_type: ReportType | None = None
    period_start: date | None = None
    period_end: date | None = None
    title: str | None = Field(default=None, min_length=3, max_length=255)
    summary: str | None = Field(default=None, min_length=10, max_length=20_000)
    activities: str | None = Field(default=None, max_length=20_000)
    participation_engagement: str | None = Field(default=None, max_length=20_000)
    progress: str | None = Field(default=None, max_length=20_000)
    difficulties: str | None = Field(default=None, max_length=20_000)
    strategies_and_resources: str | None = Field(default=None, max_length=20_000)
    communication_socialization: str | None = Field(default=None, max_length=20_000)
    autonomy_functionality: str | None = Field(default=None, max_length=20_000)
    family_school_notes: str | None = Field(default=None, max_length=20_000)
    next_steps: str | None = Field(default=None, max_length=20_000)
    participation_level: int | None = Field(default=None, ge=1, le=5)
    autonomy_level: int | None = Field(default=None, ge=1, le=5)
    communication_level: int | None = Field(default=None, ge=1, le=5)
    regulation_level: int | None = Field(default=None, ge=1, le=5)
    support_level: int | None = Field(default=None, ge=1, le=5)


class StudentProgressReportReview(BaseModel):
    review_status: Literal["reviewed", "needs_adjustment"]
    review_notes: str = Field(min_length=3, max_length=20_000)


class StudentProgressReportResponse(StudentProgressReportBase):
    id: int
    student_id: int
    created_by_id: int | None
    created_by_name: str | None
    created_by_role: str | None
    professional_type: ProfessionalType
    review_status: ReviewStatus | None
    review_notes: str | None
    reviewed_by_id: int | None
    reviewed_by_name: str | None
    reviewed_by_role: str | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
