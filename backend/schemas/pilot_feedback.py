from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


FeedbackCategory = Literal["defect", "improvement", "question"]
FeedbackStatus = Literal[
    "received",
    "in_review",
    "implemented",
    "awaiting_validation",
    "approved",
]


class PilotFeedbackCreate(BaseModel):
    page_path: str = Field(min_length=1, max_length=500)
    category: FeedbackCategory
    title: str = Field(min_length=5, max_length=160)
    details: str = Field(min_length=10, max_length=4_000)
    expected_result: str | None = Field(default=None, max_length=2_000)


class PilotFeedbackUpdate(BaseModel):
    status: FeedbackStatus
    admin_note: str | None = Field(default=None, max_length=2_000)


class PilotFeedbackResponse(BaseModel):
    id: int
    page_path: str
    category: FeedbackCategory
    title: str
    details: str
    expected_result: str | None
    status: FeedbackStatus
    admin_note: str | None
    author_name: str
    author_email: str | None = None
    created_at: datetime
    updated_at: datetime
