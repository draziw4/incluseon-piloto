import asyncio

from sqlalchemy import select

from workers.celery_app import celery

from database import AsyncSessionLocal
from services.ai_usage_service import count_user_reports_this_month


from models.models import (
    Student,
    Assessment,
    BehaviorRecord,
    AIReport,
    User
)

from fastapi import HTTPException

from services.analytics_service import (
    get_behavior_analytics_for_student
)

from services.ai.prompt_builder import (
    build_case_study_prompt
)

from services.ai.providers.openai_provider import (
    generate_text
)

from services.pdf.pdf_generator import (
    delete_generated_report,
    generate_case_study_pdf
)

from services.permissions_service import (
    require_student_permission
)


@celery.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=60,
    retry_jitter=True,
    max_retries=3,
)
def generate_case_study_task(
    self,
    student_id: int,
    user_id: int
):
    async def run_task():
        async with AsyncSessionLocal() as db:
            existing_result = await db.execute(
                select(AIReport).where(AIReport.task_id == self.request.id)
            )
            existing_report = existing_result.scalar_one_or_none()
            if existing_report:
                return {
                    "report": existing_report.content,
                    "report_id": existing_report.id,
                    "already_generated": True,
                }

            user = await db.get(
                User,
                user_id
            )

            if not user:
                raise Exception(
                    "Usuário não encontrado"
                )

            try:
                student = await require_student_permission(
                    db=db,
                    user=user,
                    student_id=student_id,
                    permission="can_generate_ai_report"
                )

            except HTTPException as error:
                raise Exception(
                    error.detail
                )
            assessments_result = await db.execute(
                select(Assessment)
                .where(Assessment.student_id == student.id)
                .order_by(Assessment.created_at.desc())
                .limit(3)
            )

            assessments = (
                assessments_result
                .scalars()
                .all()
            )

            behavior_result = await db.execute(
                select(BehaviorRecord)
                .where(BehaviorRecord.student_id == student.id)
                .order_by(BehaviorRecord.created_at.desc())
                .limit(10)
            )

            behavior_records = (
                behavior_result
                .scalars()
                .all()
            )

            analytics = await get_behavior_analytics_for_student(
                db=db,
                student_id=student.id
            )

            prompt = build_case_study_prompt(
                student=student,
                assessments=assessments,
                behavior_records=behavior_records,
                analytics=analytics
            )

            ai_response = await generate_text(
                prompt
            )

            report_content = ai_response["content"]

            pdf_path = generate_case_study_pdf(
                student_name=student.name,
                report_content=report_content,
                task_id=self.request.id
            )

            ai_report = AIReport(
                task_id=self.request.id,
                student_id=student.id,
                created_by_id=user_id,
                report_type="case_study",
                content=report_content,
                pdf_path=pdf_path,
                model_used=ai_response["model"],
                prompt_tokens=ai_response["prompt_tokens"],
                completion_tokens=ai_response["completion_tokens"],
                total_tokens=ai_response["total_tokens"]
            )

            db.add(ai_report)

            try:
                await db.commit()
                await db.refresh(ai_report)
            except Exception:
                await db.rollback()
                delete_generated_report(pdf_path)
                raise

            return {
                "report": report_content,
                "pdf_path": pdf_path,
                "report_id": ai_report.id,
                "tokens": {
                    "prompt_tokens": ai_report.prompt_tokens,
                    "completion_tokens": ai_report.completion_tokens,
                    "total_tokens": ai_report.total_tokens
                }
            }

    return asyncio.run(run_task())
