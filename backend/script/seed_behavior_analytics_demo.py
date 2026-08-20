import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

import asyncio

from datetime import datetime, date, timedelta

from sqlalchemy import select, delete

from database import AsyncSessionLocal

from models.models import (
    User,
    UserRole,
    Student,
    BehaviorRecord
)

# IMPORTANTE:
# Use a função real do seu projeto.
# Como você usa Argon2, NÃO use bcrypt aqui.
#
# Se no seu projeto o caminho ou nome for diferente,
# ajuste este import.
from security import hash_password,verify_password


DEMO_PASSWORD = "123456"


async def get_or_create_user(
    db,
    name: str,
    email: str,
    password: str,
    role: UserRole
):
    result = await db.execute(
        select(User).where(
            User.email == email
        )
    )

    user = result.scalars().first()

    if user:
        return user

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role=role
    )

    db.add(user)

    await db.flush()

    return user


async def get_or_create_student(
    db,
    psychologist_id: int
):
    result = await db.execute(
        select(Student).where(
            Student.name == "João Silva - Demo Analytics"
        )
    )

    student = result.scalars().first()

    if student:
        return student

    student = Student(
        psychologist_id=psychologist_id,
        name="João Silva - Demo Analytics",
        age=9,
        birth_date=date(2016, 5, 12),
        diagnosis="TEA - Transtorno do Espectro Autista",
        school_name="Escola Municipal Inclusiva Esperança",
        guardian_name="Maria Silva",
        guardian_phone="(86) 99999-0000",
        communication_notes=(
            "Aluno utiliza comunicação verbal simples e responde melhor "
            "com instruções objetivas e apoio visual."
        ),
        sensory_notes=(
            "Apresenta sensibilidade a ruídos intensos e ambientes com "
            "muitos estímulos."
        ),
        general_observations=(
            "Demonstra interesse por atividades com imagens, letras e jogos "
            "pedagógicos. Necessita de apoio em transições."
        )
    )

    db.add(student)

    await db.flush()

    return student


async def clear_student_behavior_records(
    db,
    student_id: int
):
    await db.execute(
        delete(BehaviorRecord).where(
            BehaviorRecord.student_id == student_id
        )
    )

    await db.flush()


async def create_behavior_records(
    db,
    student_id: int
):
    now = datetime.utcnow()

    records = [
        # ============================
        # Recusa de atividade
        # ============================

        BehaviorRecord(
            student_id=student_id,
            antecedent="Atividade difícil",
            behavior="Recusa de atividade",
            consequence=(
                "A atividade foi dividida em partes menores e o aluno "
                "aceitou iniciar a primeira etapa."
            ),
            environment="Sala de aula",
            people_present="Professora e profissional de apoio",
            intensity=7,
            duration_minutes=12,
            strategy_used="Divisão da tarefa",
            strategy_effective=True,
            function_hypothesis="Fuga ou esquiva de demanda",
            observations=(
                "O aluno abaixou a cabeça e recusou copiar a atividade "
                "quando percebeu que era uma tarefa longa."
            ),
            created_at=now - timedelta(days=12)
        ),

        BehaviorRecord(
            student_id=student_id,
            antecedent="Demanda acadêmica",
            behavior="Recusa de atividade",
            consequence=(
                "A professora ofereceu escolha entre duas atividades curtas."
            ),
            environment="Sala de aula",
            people_present="Professora",
            intensity=6,
            duration_minutes=9,
            strategy_used="Escolha entre opções",
            strategy_effective=True,
            function_hypothesis="Fuga ou esquiva de demanda",
            observations=(
                "Após escolher uma atividade menor, o aluno retomou a participação."
            ),
            created_at=now - timedelta(days=10)
        ),

        BehaviorRecord(
            student_id=student_id,
            antecedent="Atividade difícil",
            behavior="Recusa de atividade",
            consequence=(
                "Foi feita mediação verbal, mas o aluno permaneceu resistente."
            ),
            environment="Sala de aula",
            people_present="Professora e AEE",
            intensity=8,
            duration_minutes=14,
            strategy_used="Mediação verbal",
            strategy_effective=False,
            function_hypothesis="Fuga ou esquiva de demanda",
            observations=(
                "A atividade exigia leitura em voz alta diante dos colegas."
            ),
            created_at=now - timedelta(days=8)
        ),

        BehaviorRecord(
            student_id=student_id,
            antecedent="Demanda acadêmica",
            behavior="Recusa de atividade",
            consequence=(
                "Foi usado reforço positivo após cada pequena etapa concluída."
            ),
            environment="Sala de aula",
            people_present="Profissional de apoio",
            intensity=5,
            duration_minutes=7,
            strategy_used="Reforço positivo",
            strategy_effective=True,
            function_hypothesis="Fuga ou esquiva de demanda",
            observations=(
                "Com reforço positivo, o aluno realizou parte da atividade."
            ),
            created_at=now - timedelta(days=6)
        ),

        # ============================
        # Crise sensorial
        # ============================

        BehaviorRecord(
            student_id=student_id,
            antecedent="Ambiente barulhento",
            behavior="Crise sensorial",
            consequence=(
                "O aluno foi conduzido para um ambiente mais calmo."
            ),
            environment="Pátio",
            people_present="Profissional de apoio e colegas",
            intensity=9,
            duration_minutes=18,
            strategy_used="Retirada para ambiente calmo",
            strategy_effective=True,
            function_hypothesis="Autorregulação sensorial",
            observations=(
                "Durante o intervalo, o ruído do pátio aumentou e o aluno "
                "colocou as mãos nos ouvidos."
            ),
            created_at=now - timedelta(days=11)
        ),

        BehaviorRecord(
            student_id=student_id,
            antecedent="Excesso de estímulos",
            behavior="Crise sensorial",
            consequence=(
                "Foi oferecida pausa sensorial na sala de recursos."
            ),
            environment="Sala de recursos",
            people_present="AEE",
            intensity=7,
            duration_minutes=15,
            strategy_used="Pausa sensorial",
            strategy_effective=True,
            function_hypothesis="Autorregulação sensorial",
            observations=(
                "O aluno recuperou a calma após permanecer em ambiente com "
                "menos estímulos."
            ),
            created_at=now - timedelta(days=7)
        ),

        BehaviorRecord(
            student_id=student_id,
            antecedent="Ambiente barulhento",
            behavior="Crise sensorial",
            consequence=(
                "Foi tentada mediação verbal, mas o aluno continuou agitado."
            ),
            environment="Refeitório",
            people_present="Profissional de apoio e turma",
            intensity=8,
            duration_minutes=16,
            strategy_used="Mediação verbal",
            strategy_effective=False,
            function_hypothesis="Autorregulação sensorial",
            observations=(
                "O ambiente estava cheio e com bastante ruído no horário do lanche."
            ),
            created_at=now - timedelta(days=5)
        ),

        # ============================
        # Dificuldade de transição
        # ============================

        BehaviorRecord(
            student_id=student_id,
            antecedent="Transição de atividade",
            behavior="Dificuldade de transição",
            consequence=(
                "Foi apresentada a rotina visual com a próxima atividade."
            ),
            environment="Sala de aula",
            people_present="Professora e profissional de apoio",
            intensity=6,
            duration_minutes=10,
            strategy_used="Rotina visual",
            strategy_effective=True,
            function_hypothesis="Falta de previsibilidade",
            observations=(
                "O aluno demonstrou resistência ao sair da atividade com imagens "
                "para iniciar atividade escrita."
            ),
            created_at=now - timedelta(days=9)
        ),

        BehaviorRecord(
            student_id=student_id,
            antecedent="Mudança de rotina",
            behavior="Dificuldade de transição",
            consequence=(
                "Foi feita antecipação verbal e visual da mudança."
            ),
            environment="Sala de aula",
            people_present="AEE e professora",
            intensity=5,
            duration_minutes=8,
            strategy_used="Antecipação de mudança",
            strategy_effective=True,
            function_hypothesis="Falta de previsibilidade",
            observations=(
                "A mudança foi melhor aceita quando explicada antes."
            ),
            created_at=now - timedelta(days=4)
        ),

        BehaviorRecord(
            student_id=student_id,
            antecedent="Mudança de rotina",
            behavior="Dificuldade de transição",
            consequence=(
                "A equipe tentou redirecionamento, mas o aluno demorou a se regular."
            ),
            environment="Corredor",
            people_present="Profissional de apoio",
            intensity=7,
            duration_minutes=13,
            strategy_used="Redirecionamento",
            strategy_effective=False,
            function_hypothesis="Falta de previsibilidade",
            observations=(
                "A turma mudou de sala sem aviso prévio."
            ),
            created_at=now - timedelta(days=3)
        ),

        # ============================
        # Choro
        # ============================

        BehaviorRecord(
            student_id=student_id,
            antecedent="Frustração",
            behavior="Choro",
            consequence=(
                "O aluno recebeu apoio individual e tempo para se acalmar."
            ),
            environment="Sala de aula",
            people_present="Professora",
            intensity=5,
            duration_minutes=6,
            strategy_used="Apoio individual",
            strategy_effective=True,
            function_hypothesis="Frustração ou dificuldade emocional",
            observations=(
                "O aluno chorou após errar uma atividade e receber correção."
            ),
            created_at=now - timedelta(days=2)
        ),

        BehaviorRecord(
            student_id=student_id,
            antecedent="Correção ou negativa",
            behavior="Choro",
            consequence=(
                "Foi oferecido tempo de espera antes de retomar a atividade."
            ),
            environment="Sala de aula",
            people_present="Profissional de apoio",
            intensity=4,
            duration_minutes=5,
            strategy_used="Tempo de espera",
            strategy_effective=True,
            function_hypothesis="Frustração ou dificuldade emocional",
            observations=(
                "Após alguns minutos, o aluno aceitou conversar e continuar."
            ),
            created_at=now - timedelta(days=1)
        )
    ]

    db.add_all(records)

    await db.flush()


async def seed():
    async with AsyncSessionLocal() as db:
        psychologist = await get_or_create_user(
            db=db,
            name="Dra. Carla Psicóloga",
            email="psicologa.analytics@incluseon.com",
            password=DEMO_PASSWORD,
            role=UserRole.PSYCHOLOGIST
        )

        student = await get_or_create_student(
            db=db,
            psychologist_id=psychologist.id
        )

        await clear_student_behavior_records(
            db=db,
            student_id=student.id
        )

        await create_behavior_records(
            db=db,
            student_id=student.id
        )

        await db.commit()

        print("\nSeed de analytics comportamental criado com sucesso!")
        print("\nUsuário para login:")
        print("Email: psicologa.analytics@incluseon.com")
        print(f"Senha: {DEMO_PASSWORD}")
        print(f"\nAluno criado/atualizado: {student.name}")
        print(f"ID do aluno: {student.id}")
        print("\nObservações comportamentais criadas: 12")
        print("\nDados preparados para gráficos:")
        print("- Evolução da intensidade")
        print("- Registros por ambiente")
        print("- Comportamentos mais registrados")
        print("- Antecedentes mais comuns")
        print("- Estratégias e eficácia\n")


if __name__ == "__main__":
    asyncio.run(seed())
