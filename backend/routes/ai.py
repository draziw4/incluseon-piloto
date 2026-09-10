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
    format_assessments,
)
from services.assessment_instruments import (
    INSTRUMENT_TYPE_LABELS,
    format_answer,
    instrument_field_label,
    latest_instruments_by_type,
    missing_required_instruments,
)
from schemas.student import calculate_age


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

    context = await get_case_study_context(db, student.id)
    missing_instruments = missing_required_instruments(context["assessments"])
    if missing_instruments:
        missing_labels = ", ".join(INSTRUMENT_TYPE_LABELS[item] for item in missing_instruments)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Preencha os três instrumentais antes de gerar o estudo de caso. Faltam: {missing_labels}.",
        )

    if settings.pilot_demo_mode:
        report_content = build_pilot_demo_report(student, context)
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


def build_pilot_demo_report(student, context: dict) -> str:
    instruments = latest_instruments_by_type(context["assessments"])

    def evidence(instrument_type: str, fields: list[str]) -> str:
        assessment = instruments[instrument_type]
        data = assessment.assessment_data or {}
        lines = [
            f"- {instrument_field_label(field)}: {format_answer(data[field])}"
            for field in fields
            if field in data and data[field] not in (None, "", [])
        ]
        return "\n".join(lines) if lines else "Não informado nos instrumentais."

    return f"""Estudo de caso demonstrativo — {student.name}

Este documento foi consolidado localmente, sem envio de dados para IA externa. Ele apresenta as evidências no padrão solicitado; a síntese analítica final deve ser revisada e complementada pela profissional do AEE.

5.4.1 Identificação do estudante
Nome: {student.name}
Idade: {calculate_age(student.birth_date) if student.birth_date else "Não informado nos instrumentais"}
Escola: {student.school_name or "Não informado nos instrumentais"}
Ano/série: {getattr(student, "school_grade", None) or "Não informado nos instrumentais"}
Turma: {getattr(student, "class_group", None) or "Não informado nos instrumentais"}
{evidence("student_assessment", ["grade_year", "class_and_shift", "school_network", "special_education_target", "school_entry_date", "has_health_diagnosis", "health_diagnosis_details"])}

5.4.2 Histórico escolar e trajetória educacional
{evidence("parent_interview", ["school_start_age", "school_difficulties", "has_repetition_or_dropout", "repetition_or_dropout_details", "difficult_subjects", "school_engagement"])}

5.4.3 Observação pedagógica na sala comum
{evidence("student_assessment", ["oral_explanation_comprehension", "required_mediation", "task_initiation_and_completion", "individual_and_group_participation", "response_when_requested", "attention_duration", "peer_interaction", "adult_reference", "isolation_or_conflicts", "functional_communication", "command_comprehension", "materials_and_routines", "constant_task_support"])}
{evidence("school_interview", ["identified_learning_and_style", "class_and_teacher_interaction", "school_activity_participation"])}

5.4.4 Avaliação da funcionalidade no contexto escolar
{evidence("student_assessment", ["school_feeding_autonomy", "school_hygiene_autonomy", "school_mobility", "physical_safety", "emotional_behavioral_regulation", "school_sensory_tolerance"])}
{evidence("parent_interview", ["independent_activities", "feeding_autonomy", "hygiene_autonomy", "mobility_autonomy", "safety_and_self_regulation", "sensory_tolerance"])}

5.4.5 Identificação das barreiras
{evidence("school_interview", ["pedagogical_barriers", "communication_barriers", "attitudinal_barriers", "physical_and_sensory_barriers"])}

5.4.6 Potencialidades e interesses do estudante
{evidence("student_assessment", ["student_interests", "preserved_skills", "engagement_factors", "effective_mediation", "perception_strengths", "attention_strengths", "memory_strengths", "language_strengths", "logical_reasoning_strengths"])}

5.4.7 Estratégias já utilizadas e seus resultados
{evidence("school_interview", ["strategies_already_used", "successful_strategies", "unsuccessful_strategies", "inclusive_methodology"])}
{evidence("student_assessment", ["resources_already_used", "resources_needed", "curricular_accessibility_implications"])}

5.4.8 Parecer pedagógico conclusivo
No modo demonstrativo local, não é produzida uma conclusão por IA. A profissional do AEE deve revisar as evidências acima, explicitar barreiras e necessidades educacionais específicas, fundamentar a indicação de AEE e de eventuais serviços de apoio e registrar recomendações pedagógicas iniciais. Este parecer subsidiará a elaboração do PAEE; o PEI da sala regular deverá ser elaborado posteriormente pelo professor da sala comum com base no PAEE.

Instrumentais consolidados
{format_assessments(context["assessments"])}"""
