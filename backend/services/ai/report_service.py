from services.ai.prompt_builder import (
    build_case_study_prompt
)
from services.ai.case_context import get_case_study_context
from services.assessment_instruments import (
    INSTRUMENT_TYPE_LABELS,
    missing_required_instruments,
)

from services.ai.providers.openai_provider import (
    generate_text
)



async def generate_case_study(

    student,

    db
):

    context = await get_case_study_context(db, student.id)
    missing_instruments = missing_required_instruments(context["assessments"])
    if missing_instruments:
        missing_labels = ", ".join(INSTRUMENT_TYPE_LABELS[item] for item in missing_instruments)
        raise ValueError(f"Instrumentais obrigatórios ausentes: {missing_labels}")
    prompt = build_case_study_prompt(
        student=student,
        **context,
    )

    # =====================================
    # GENERATE
    # =====================================

    response = await generate_text(
        prompt
    )

    return response
