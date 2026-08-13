from services.ai.prompt_builder import (
    build_case_study_prompt
)
from services.ai.case_context import get_case_study_context

from services.ai.providers.openai_provider import (
    generate_text
)



async def generate_case_study(

    student,

    db
):

    context = await get_case_study_context(db, student.id)
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
