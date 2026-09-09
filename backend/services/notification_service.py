from datetime import date

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from date_utils import current_local_date
from models.models import (
    AccountStatus,
    Notification,
    Student,
    StudentProfessional,
    User,
    UserRole,
)


BIRTHDAY_NOTICE_DAYS = 7


def next_birthday(birth_date: date, today: date) -> date:
    def birthday_in(year: int) -> date:
        try:
            return birth_date.replace(year=year)
        except ValueError:
            # Pessoas nascidas em 29/02 recebem o lembrete em 28/02 nos anos comuns.
            return date(year, 2, 28)

    occurrence = birthday_in(today.year)
    return occurrence if occurrence >= today else birthday_in(today.year + 1)


def birthday_age(birth_date: date, occurrence: date) -> int:
    return occurrence.year - birth_date.year


def birthday_notification_copy(student: Student, occurrence: date, days_until: int) -> tuple[str, str]:
    age = birthday_age(student.birth_date, occurrence)
    if days_until == 0:
        return (
            "Aniversário de aluno hoje",
            f"Hoje é aniversário de {student.name}, que está completando {age} anos.",
        )
    return (
        "Aniversário de aluno próximo",
        f"O aniversário de {student.name} será em {occurrence.strftime('%d/%m')}, "
        f"quando completará {age} anos.",
    )


async def ensure_student_birthday_notifications(
    db: AsyncSession,
    *,
    user: User,
    today: date | None = None,
) -> int:
    reference_date = today or current_local_date()
    students_query = select(Student).outerjoin(
        StudentProfessional,
        and_(
            StudentProfessional.student_id == Student.id,
            StudentProfessional.user_id == user.id,
            StudentProfessional.can_view.is_(True),
        ),
    )
    if user.role != UserRole.ADMIN:
        students_query = students_query.where(
            or_(
                Student.psychologist_id == user.id,
                StudentProfessional.user_id == user.id,
            )
        )

    students_result = await db.execute(students_query.distinct())
    upcoming: list[tuple[Student, date, int, str]] = []
    for student in students_result.scalars().all():
        occurrence = next_birthday(student.birth_date, reference_date)
        days_until = (occurrence - reference_date).days
        if days_until > BIRTHDAY_NOTICE_DAYS:
            continue
        event_type = "student_birthday_today" if days_until == 0 else "student_birthday_upcoming"
        upcoming.append((student, occurrence, days_until, event_type))

    if not upcoming:
        return 0

    student_ids = {student.id for student, *_rest in upcoming}
    occurrence_years = {occurrence.year for _student, occurrence, *_rest in upcoming}
    existing_result = await db.execute(
        select(Notification.student_id, Notification.event_type, Notification.resource_id).where(
            Notification.recipient_user_id == user.id,
            Notification.resource_type == "student_birthday",
            Notification.student_id.in_(student_ids),
            Notification.resource_id.in_(occurrence_years),
        )
    )
    existing = set(existing_result.all())

    created_count = 0
    for student, occurrence, days_until, event_type in upcoming:
        key = (student.id, event_type, occurrence.year)
        if key in existing:
            continue
        title, message = birthday_notification_copy(student, occurrence, days_until)
        await create_notification(
            db,
            recipient_user_id=user.id,
            event_type=event_type,
            title=title,
            message=message,
            student_id=student.id,
            resource_type="student_birthday",
            resource_id=occurrence.year,
            action_url=f"/students/{student.id}",
        )
        existing.add(key)
        created_count += 1

    return created_count


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
