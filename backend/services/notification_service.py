from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.models import (
    AccountStatus,
    Notification,
    Student,
    StudentProfessional,
    User,
    UserRole,
)


async def create_notification(
    db: AsyncSession,
    *,
    recipient_user_id: int,
    event_type: str,
    title: str,
    message: str,
    actor_user_id: int | None = None,
    student_id: int | None = None,
    resource_type: str | None = None,
    resource_id: int | None = None,
    action_url: str | None = None,
) -> Notification | None:
    if actor_user_id is not None and recipient_user_id == actor_user_id:
        return None

    notification = Notification(
        recipient_user_id=recipient_user_id,
        event_type=event_type,
        title=title,
        message=message,
        student_id=student_id,
        resource_type=resource_type,
        resource_id=resource_id,
        action_url=action_url,
    )
    db.add(notification)
    return notification


async def notify_aee_report_pending(
    db: AsyncSession,
    *,
    student: Student,
    report_id: int,
    actor_user_id: int,
    is_resubmission: bool = False,
) -> None:
    recipient_ids = await get_aee_recipient_ids(db, student)
    for recipient_id in recipient_ids:
        await create_notification(
            db,
            recipient_user_id=recipient_id,
            actor_user_id=actor_user_id,
            event_type="support_report_resubmitted" if is_resubmission else "support_report_pending",
            title="Relatório do PA requer avaliação",
            message=(
                f"Um relatório de {student.name} foi editado e aguarda nova avaliação do AEE."
                if is_resubmission
                else f"O PA enviou um relatório de {student.name} para avaliação do AEE."
            ),
            student_id=student.id,
            resource_type="student_progress_report",
            resource_id=report_id,
            action_url=f"/students/{student.id}?tab=behavior",
        )


async def get_aee_recipient_ids(db: AsyncSession, student: Student) -> list[int]:
    result = await db.execute(
        select(User.id)
        .outerjoin(
            StudentProfessional,
            and_(
                StudentProfessional.user_id == User.id,
                StudentProfessional.student_id == student.id,
            ),
        )
        .where(
            User.role == UserRole.AEE,
            User.account_status == AccountStatus.ACTIVE,
            or_(
                User.id == student.psychologist_id,
                StudentProfessional.can_view.is_(True),
            ),
        )
        .distinct()
    )
    return list(result.scalars().all())


async def notify_active_admins_of_pending_account(
    db: AsyncSession,
    *,
    professional: User,
) -> None:
    result = await db.execute(
        select(User.id).where(
            User.role == UserRole.ADMIN,
            User.account_status == AccountStatus.ACTIVE,
        )
    )
    for admin_id in result.scalars().all():
        await create_notification(
            db,
            recipient_user_id=admin_id,
            event_type="professional_account_pending",
            title="Cadastro profissional aguardando autorização",
            message=f"{professional.name} solicitou acesso e precisa de análise administrativa.",
            resource_type="user",
            resource_id=professional.id,
            action_url="/admin/professionals",
        )
