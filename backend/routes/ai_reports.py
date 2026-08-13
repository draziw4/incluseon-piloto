from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from fastapi.responses import Response

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from typing import Annotated

from database import get_db
from access_policy import ToolAccess
from permissions import require_tool

from dependencies import get_current_user

from models.models import (
    User,
    AIReport,
    AIReportRevision
)

from schemas.ai_report import AIReportResponse, AIReportUpdate

from services.permissions_service import (
    require_student_permission,
    require_student_report_access
)
from services.pdf.pdf_generator import (
    delete_generated_report,
    generate_case_study_pdf,
    generate_case_study_pdf_bytes,
    read_generated_report
)


router = APIRouter(
    prefix="/ai-reports",
    tags=["AI Reports"],
    dependencies=[Depends(require_tool(ToolAccess.REPORTS))],
)


@router.get(
    "/student/{student_id}",
    response_model=list[AIReportResponse]
)
async def list_student_ai_reports(
    student_id: int,

    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(get_current_user)
    ]
):
    student = await require_student_report_access(
        db=db,
        user=current_user,
        student_id=student_id
    )

    result = await db.execute(
        select(AIReport)
        .where(
            AIReport.student_id == student.id
        )
        .order_by(
            AIReport.created_at.desc()
        )
    )

    reports = result.scalars().all()

    return reports


@router.patch(
    "/{report_id}",
    response_model=AIReportResponse
)
async def update_ai_report(
    report_id: int,
    data: AIReportUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    report = await get_ai_report_or_404(db, report_id)

    if report.revision != data.expected_revision:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este relatório foi alterado por outro profissional. Atualize a página antes de editar novamente."
        )

    student = await require_student_permission(
        db=db,
        user=current_user,
        student_id=report.student_id,
        permission="can_generate_ai_report"
    )

    previous_pdf_path = report.pdf_path
    next_revision = report.revision + 1
    new_pdf_path = generate_case_study_pdf(
        student_name=student.name,
        report_content=data.content,
        task_id=f"report-{report.id}-v{next_revision}"
    )

    revision = AIReportRevision(
        report_id=report.id,
        edited_by_id=current_user.id,
        revision=report.revision,
        content=report.content
    )
    db.add(revision)

    report.content = data.content
    report.pdf_path = new_pdf_path
    report.revision = next_revision
    report.last_edited_by_id = current_user.id

    try:
        await db.commit()
        await db.refresh(report)
    except Exception:
        await db.rollback()
        delete_generated_report(new_pdf_path)
        raise

    if previous_pdf_path and previous_pdf_path != new_pdf_path:
        delete_generated_report(previous_pdf_path)

    return report


@router.get("/{report_id}/download")
async def download_ai_report(
    report_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    report = await get_ai_report_or_404(db, report_id)

    student = await require_student_report_access(
        db=db,
        user=current_user,
        student_id=report.student_id
    )

    pdf_content = read_generated_report(report.pdf_path) if report.pdf_path else None
    if pdf_content is None:
        pdf_content = generate_case_study_pdf_bytes(
            student_name=student.name,
            report_content=report.content,
        )

    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="estudo-de-caso-{report.student_id}-{report.id}.pdf"'
            ),
            "Cache-Control": "private, no-store",
        },
    )


async def get_ai_report_or_404(
    db: AsyncSession,
    report_id: int
) -> AIReport:
    report = await db.get(AIReport, report_id)

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relatório não encontrado"
        )

    return report
