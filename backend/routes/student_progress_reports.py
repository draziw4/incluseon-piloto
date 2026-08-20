from datetime import date, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from access_policy import ToolAccess
from database import get_db
from dependencies import get_current_user
from models.models import StudentProgressReport, User, UserRole
from permissions import require_tool
from schemas.student_progress_report import (
    StudentProgressReportBase,
    StudentProgressReportCreate,
    StudentProgressReportReview,
    StudentProgressReportResponse,
    StudentProgressReportUpdate,
)
from services.permissions_service import require_student_access


router = APIRouter(
    prefix="/student-progress-reports",
    tags=["Student Progress Reports"],
    dependencies=[Depends(require_tool(ToolAccess.BEHAVIOR_RECORDS))],
)


async def require_report_author(
    db: AsyncSession,
    user: User,
    student_id: int,
):
    student = await require_student_access(db=db, user=user, student_id=student_id)
    if user.role not in {UserRole.ADMIN, UserRole.AEE, UserRole.SUPPORT_PROFESSIONAL}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente profissionais do AEE e de apoio podem criar relatórios de acompanhamento.",
        )
    return student


def resolve_professional_type(user: User, requested_type: str | None) -> str:
    expected_type = {
        UserRole.AEE: "aee",
        UserRole.SUPPORT_PROFESSIONAL: "support",
    }.get(user.role)

    if expected_type:
        if requested_type and requested_type != expected_type:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="O tipo do relatório deve corresponder ao perfil profissional do autor.",
            )
        return expected_type

    if user.role == UserRole.ADMIN:
        return requested_type or "aee"

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Seu perfil não pode criar relatórios de acompanhamento.",
    )


async def require_aee_reviewer(db: AsyncSession, user: User, student_id: int):
    student = await require_student_access(db=db, user=user, student_id=student_id)
    if user.role not in {UserRole.ADMIN, UserRole.AEE}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente a profissional do AEE pode avaliar relatórios do profissional de apoio.",
        )
    return student


async def get_report_or_404(
    db: AsyncSession,
    student_id: int,
    report_id: int,
) -> StudentProgressReport:
    report = await db.get(StudentProgressReport, report_id)
    if not report or report.student_id != student_id:
        raise HTTPException(status_code=404, detail="Relatório de acompanhamento não encontrado")
    return report


def require_report_ownership(user: User, report: StudentProgressReport) -> None:
    if user.role != UserRole.ADMIN and report.created_by_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode alterar relatórios de acompanhamento criados por você.",
        )


def reset_support_report_review(report: StudentProgressReport) -> None:
    if report.professional_type != "support":
        return
    report.review_status = "pending"
    report.review_notes = None
    report.reviewed_by_id = None
    report.reviewed_by_name = None
    report.reviewed_by_role = None
    report.reviewed_at = None


@router.post(
    "/student/{student_id}",
    response_model=StudentProgressReportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_student_progress_report(
    student_id: int,
    data: StudentProgressReportCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    student = await require_report_author(db, current_user, student_id)
    professional_type = resolve_professional_type(current_user, data.professional_type)
    if professional_type == "support" and data.report_type != "daily":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O relatório do profissional de apoio deve ser diário.",
        )
    report = StudentProgressReport(
        student_id=student.id,
        created_by_id=current_user.id,
        created_by_name=current_user.name,
        created_by_role=current_user.role.value,
        professional_type=professional_type,
        review_status="pending" if professional_type == "support" else None,
        **data.model_dump(exclude={"professional_type"}),
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.get(
    "/student/{student_id}",
    response_model=list[StudentProgressReportResponse],
)
async def list_student_progress_reports(
    student_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    report_type: Literal["daily", "weekly"] | None = Query(default=None),
    professional_type: Literal["aee", "support"] | None = Query(default=None),
    review_status: Literal["pending", "reviewed", "needs_adjustment"] | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
):
    student = await require_student_access(db=db, user=current_user, student_id=student_id)
    query = select(StudentProgressReport).where(StudentProgressReport.student_id == student.id)
    if report_type:
        query = query.where(StudentProgressReport.report_type == report_type)
    if professional_type:
        query = query.where(StudentProgressReport.professional_type == professional_type)
    if review_status:
        query = query.where(StudentProgressReport.review_status == review_status)
    if start_date:
        query = query.where(StudentProgressReport.period_end >= start_date)
    if end_date:
        query = query.where(StudentProgressReport.period_start <= end_date)
    query = query.order_by(
        StudentProgressReport.period_start.desc(),
        StudentProgressReport.created_at.desc(),
    ).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch(
    "/student/{student_id}/{report_id}",
    response_model=StudentProgressReportResponse,
)
async def update_student_progress_report(
    student_id: int,
    report_id: int,
    data: StudentProgressReportUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    await require_report_author(db, current_user, student_id)
    report = await get_report_or_404(db, student_id, report_id)
    require_report_ownership(current_user, report)

    changes = data.model_dump(exclude_unset=True)
    effective_data = {
        field: changes.get(field, getattr(report, field))
        for field in StudentProgressReportBase.model_fields
    }
    validated = StudentProgressReportCreate.model_validate(
        {**effective_data, "professional_type": report.professional_type}
    )
    for key, value in validated.model_dump(exclude={"professional_type"}).items():
        setattr(report, key, value)

    reset_support_report_review(report)

    await db.commit()
    await db.refresh(report)
    return report


@router.delete(
    "/student/{student_id}/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_student_progress_report(
    student_id: int,
    report_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    await require_report_author(db, current_user, student_id)
    report = await get_report_or_404(db, student_id, report_id)
    require_report_ownership(current_user, report)
    await db.delete(report)
    await db.commit()


@router.patch(
    "/student/{student_id}/{report_id}/review",
    response_model=StudentProgressReportResponse,
)
async def review_support_progress_report(
    student_id: int,
    report_id: int,
    data: StudentProgressReportReview,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    await require_aee_reviewer(db, current_user, student_id)
    report = await get_report_or_404(db, student_id, report_id)
    if report.professional_type != "support":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A avaliação do AEE se aplica somente aos relatórios do profissional de apoio.",
        )

    report.review_status = data.review_status
    report.review_notes = data.review_notes
    report.reviewed_by_id = current_user.id
    report.reviewed_by_name = current_user.name
    report.reviewed_by_role = current_user.role.value
    report.reviewed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(report)
    return report
