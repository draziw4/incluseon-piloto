from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

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
    # CHECK RECENT REPORT
    # Evita gerar relatório repetido
    # =====================================

    recent_limit = datetime.utcnow() - timedelta(
        hours=24
    )

    recent_report_result = await db.execute(
        select(AIReport)
        .where(
            AIReport.student_id == student.id,
            AIReport.created_by_id == current_user.id,
            AIReport.report_type == "case_study",
            AIReport.created_at >= recent_limit
        )
        .order_by(
            AIReport.created_at.desc()
        )
    )

    recent_report = (
        recent_report_result
        .scalars()
        .first()
    )

    if recent_report:
        return {
            "message": "Relatório recente encontrado",
            "task_id": None,
            "report_id": recent_report.id,
            "already_generated": True
        }

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
        report_content = build_pilot_demo_report(student.name)
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


def build_pilot_demo_report(student_name: str) -> str:
    return f"""Estudo de caso demonstrativo — {student_name}

Aviso de validação

Este conteúdo foi produzido pelo modo demonstrativo local do piloto, sem envio de dados a uma inteligência artificial externa. Ele existe para validar o fluxo de revisão profissional, edição, histórico e exportação em PDF.

1. Síntese do acompanhamento

Os registros sintéticos indicam que o estudante responde melhor a atividades estruturadas, instruções objetivas e recursos visuais. Mudanças inesperadas e excesso de estímulos podem exigir maior mediação da equipe.

2. Padrões observados

Os eventos demonstrativos apontam maior intensidade em transições, ambientes ruidosos e tarefas extensas. Estratégias de antecipação, divisão de tarefas e pausa planejada apresentaram resposta positiva no cenário simulado.

3. Estratégias para validação

A equipe pode avaliar o uso de rotina visual, instruções curtas, reforço positivo e registro contínuo dos resultados. Toda recomendação deve ser revisada e adaptada por profissional habilitado.

4. Próximos passos

Revise este texto, altere os trechos necessários, salve uma nova versão e baixe o PDF. A geração real com IA permanece fora deste piloto gratuito e só deve ser ativada com autorização, orçamento e revisão de privacidade."""
