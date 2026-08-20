from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.models import Notification, User
from schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    NotificationUnreadCount,
)


router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    unread_only: bool = Query(default=False),
    limit: int = Query(default=30, ge=1, le=100),
):
    query = select(Notification).where(
        Notification.recipient_user_id == current_user.id
    )
    if unread_only:
        query = query.where(Notification.read_at.is_(None))

    result = await db.execute(
        query.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(limit)
    )
    unread_result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.recipient_user_id == current_user.id,
            Notification.read_at.is_(None),
        )
    )
    return NotificationListResponse(
        items=list(result.scalars().all()),
        unread_count=unread_result.scalar() or 0,
    )


@router.get("/unread-count", response_model=NotificationUnreadCount)
async def get_unread_notification_count(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.recipient_user_id == current_user.id,
            Notification.read_at.is_(None),
        )
    )
    return NotificationUnreadCount(unread_count=result.scalar() or 0)


@router.patch("/read-all", response_model=NotificationUnreadCount)
async def mark_all_notifications_as_read(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    await db.execute(
        update(Notification)
        .where(
            Notification.recipient_user_id == current_user.id,
            Notification.read_at.is_(None),
        )
        .values(read_at=datetime.utcnow())
    )
    await db.commit()
    return NotificationUnreadCount(unread_count=0)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.recipient_user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificação não encontrada",
        )
    if notification.read_at is None:
        notification.read_at = datetime.utcnow()
        await db.commit()
        await db.refresh(notification)
    return notification
