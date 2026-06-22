from datetime import datetime

from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    students_count: int
    behavior_records_last_7_days: int
    assessments_count: int
    ai_reports_count: int
    appointments_today: int
    upcoming_appointments: int


class DashboardReminder(BaseModel):
    type: str
    title: str
    description: str
    to: str
    priority: str = "medium"
    due_at: datetime | None = None


class DashboardSummary(BaseModel):
    metrics: DashboardMetrics
    reminders: list[DashboardReminder]
