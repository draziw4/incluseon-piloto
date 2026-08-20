from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: int
    event_type: str
    title: str
    message: str
    student_id: int | None
    resource_type: str | None
    resource_id: int | None
    action_url: str | None
    read_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    unread_count: int


class NotificationUnreadCount(BaseModel):
    unread_count: int
