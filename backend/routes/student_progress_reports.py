from datetime import date
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
    StudentProgressReportCreate,
    StudentProgressReportResponse,
    StudentProgressReportUpdate,
)
from services.permissions_service import require_student_access


router = APIRouter(
    prefix="/student-progress-reports",
    tags=["Student Progress Reports"],
    dependencies=[Depends(require_tool(ToolAccess.BEHAVIOR_RECORDS))],
)


async def require_aee_report_author(
    db: AsyncSession,
    user: User,
    student_id: int,
):
    student = await require_student_access(db=db, user=user, student_id=student_id)
    if user.role not in {UserRole.ADMIN, UserRole.AEE}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente a profissional do AEE pode criar ou alterar relatórios diários e semanais.",
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
    student = await require_aee_report_author(db, current_user, student_id)
    report = StudentProgressReport(
        student_id=student.id,
        created_by_id=current_user.id,
        created_by_name=current_user.name,
        created_by_role=current_user.role.value,
        **data.model_dump(),
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
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
):
    student = await require_student_access(db=db, user=current_user, student_id=student_id)
    query = select(StudentProgressReport).where(StudentProgressReport.student_id == student.id)
    if report_type:
        query = query.where(StudentProgressReport.report_type == report_type)
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
    await require_aee_report_author(db, current_user, student_id)
    report = await get_report_or_404(db, student_id, report_id)
    require_report_ownership(current_user, report)

    changes = data.model_dump(exclude_unset=True)
    effective_data = {
        field: changes.get(field, getattr(report, field))
        for field in StudentProgressReportCreate.model_fields
    }
    validated = StudentProgressReportCreate.model_validate(effective_data)
    for key, value in validated.model_dump().items():
        setattr(report, key, value)

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
    await require_aee_report_author(db, current_user, student_id)
    report = await get_report_or_404(db, student_id, report_id)
    require_report_ownership(current_user, report)
    await db.delete(report)
    await db.commit()
