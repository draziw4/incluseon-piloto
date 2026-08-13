from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.ext.asyncio import AsyncSession

from typing import Annotated

from database import get_db
from access_policy import ToolAccess
from permissions import require_tool

from dependencies import get_current_user

from models.models import (
    User,
    AIReport,
)

from services.permissions_service import (
    require_student_permission
)

from workers.ai_tasks import (
    generate_case_study_task
)

from services.ai_usage_service import (
    count_user_reports_this_month
)
from services.redis_service import register_task_owner
from config import settings
from services.pdf.pdf_generator import delete_generated_report, generate_case_study_pdf
from services.ai.case_context import get_case_study_context
from services.ai.prompt_builder import (
    format_appointments,
    format_assessments,
    format_behavior_records,
    format_goals,
)


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
    dependencies=[Depends(require_tool(ToolAccess.AI_CASE_STUDIES))],
)


@router.post(
    "/student/{student_id}/case-study"
)
async def generate_ai_case_study(
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
    student = await require_student_permission(
        db=db,
        user=current_user,
        student_id=student_id,
        permission="can_generate_ai_report"
    )

    # =====================================
    # CHECK MONTHLY LIMIT
    # =====================================

    reports_this_month = await count_user_reports_this_month(
        db=db,
        user_id=current_user.id
    )

    MONTHLY_LIMIT = 30

    if reports_this_month >= MONTHLY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Limite mensal de relatórios IA atingido"
        )

    if settings.pilot_demo_mode:
        context = await get_case_study_context(db, student.id)
        report_content = build_pilot_demo_report(student.name, context)
        pdf_path = generate_case_study_pdf(
            student_name=student.name,
            report_content=report_content,
            task_id=f"pilot-report-{uuid4()}",
        )
        report = AIReport(
            student_id=student.id,
            created_by_id=current_user.id,
            report_type="case_study",
            content=report_content,
            pdf_path=pdf_path,
            model_used="demonstração local (sem IA externa)",
            prompt_tokens=0,
            completion_tokens=0,
            total_tokens=0,
        )
        db.add(report)
        try:
            await db.commit()
            await db.refresh(report)
        except Exception:
            await db.rollback()
            delete_generated_report(pdf_path)
            raise

        return {
            "message": "Relatório demonstrativo gerado localmente",
            "task_id": None,
            "report_id": report.id,
            "already_generated": True,
            "demo_mode": True,
        }

    # =====================================
    # CREATE CELERY TASK
    # =====================================

    task = generate_case_study_task.delay(
        student.id,
        current_user.id
    )
    await register_task_owner(task.id, current_user.id, student.id)

    return {
        "message": "Relatório em processamento",
        "task_id": task.id,
        "already_generated": False
    }


def build_pilot_demo_report(student_name: str, context: dict) -> str:
    assessments = context["assessments"]
    behavior_records = context["behavior_records"]
    goals = context["goals"]
    appointments = context["appointments"]
    analytics = context["analytics"]

    return f"""Estudo de caso demonstrativo — {student_name}

Aviso de validação

Este conteúdo foi produzido pelo modo demonstrativo local do piloto, sem envio de dados a uma inteligência artificial externa. Ele consolida os dados reais registrados para este aluno pelos profissionais vinculados e permite validar revisão, histórico e exportação em PDF.

1. Fontes consolidadas

Registros de acompanhamento: {analytics["records_count"]}
Avaliações e entrevistas: {len(assessments)}
Metas e itens de PEI: {len(goals)}
Atendimentos: {len(appointments)}

2. Registros recentes da equipe

{format_behavior_records(behavior_records[:10])}

3. Avaliações e entrevistas

{format_assessments(assessments[:10])}

4. PEI e metas

{format_goals(goals[:20])}

5. Atendimentos multiprofissionais

{format_appointments(appointments[:20])}

6. Próximos passos

Revise a consolidação, registre as interpretações profissionais necessárias, salve uma nova versão e baixe o PDF. A análise textual com IA externa permanece desativada neste piloto gratuito e só deve ser ativada com autorização, orçamento e revisão de privacidade."""
