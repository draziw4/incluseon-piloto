from openai import AsyncOpenAI

from config import settings


client = AsyncOpenAI(
    api_key=settings.openai_api_key.get_secret_value(),
    timeout=60.0,
    max_retries=2,
)


async def generate_text(
    prompt: str
):
    response = await client.chat.completions.create(
        model="gpt-4.1-mini",

        messages=[
            {
                "role": "system",
                "content": (
                    "Você é um assistente especializado em apoio "
                    "à elaboração de relatórios educacionais e comportamentais. "
                    "Não realiza diagnóstico e não substitui profissionais."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],

        temperature=0.3,
        max_tokens=1200
    )

    content = response.choices[0].message.content

    usage = response.usage

    return {
        "content": content,
        "model": "gpt-4.1-mini",
        "prompt_tokens": usage.prompt_tokens if usage else None,
        "completion_tokens": usage.completion_tokens if usage else None,
        "total_tokens": usage.total_tokens if usage else None
    }
