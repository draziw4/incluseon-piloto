import asyncio
import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))


from datetime import datetime, date, timedelta

from sqlalchemy import select

from database import AsyncSessionLocal
from security import hash_password

from models.models import (
    User,
    UserRole,
    Student,
    StudentProfessional,
    StudentProfessionalRole,
    BehaviorRecord,
    Assessment,
    AIReport
)






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
            Student.name == "João Silva"
        )
    )

    student = result.scalars().first()

    if student:
        return student

    student = Student(
        psychologist_id=psychologist_id,
        name="João Silva",
        age=9,
        birth_date=date(2016, 5, 12),
        diagnosis="TEA - Transtorno do Espectro Autista",
        school_name="Escola Municipal Inclusiva Esperança",
        guardian_name="Maria Silva",
        guardian_phone="(86) 99999-0000",
        communication_notes=(
            "O aluno utiliza comunicação verbal simples, apresenta boa compreensão "
            "de comandos objetivos e responde melhor com apoio visual."
        ),
        sensory_notes=(
            "Apresenta sensibilidade a ruídos intensos e agitação em ambientes com "
            "muitos estímulos sonoros."
        ),
        general_observations=(
            "Demonstra interesse por atividades com imagens, jogos de encaixe e "
            "rotinas previsíveis. Necessita de apoio em transições entre atividades."
        ),
        strengths="Boa memória visual, interesse por letras e facilidade com atividades estruturadas.",
        learning_profile="Aprende melhor com recursos visuais, instruções curtas e repetição.",
        preferred_reinforcers="Elogios, adesivos, tempo com jogo educativo e atividades com imagens.",
        sensory_triggers="Barulho intenso, mudanças bruscas de rotina e ambientes muito cheios.",
        communication_style="Comunicação verbal simples com apoio visual.",
        emotional_regulation_notes="Melhora com antecipação da rotina, pausas sensoriais e ambiente calmo."
    )

    db.add(student)

    await db.flush()

    return student


async def get_or_create_link(
    db,
    student_id: int,
    user_id: int,
    role_in_student: StudentProfessionalRole,
    can_view: bool = True,
    can_register_aba: bool = False,
    can_create_assessment: bool = False,
    can_create_pei: bool = False,
    can_generate_ai_report: bool = False,
    can_view_reports: bool = False
):
    result = await db.execute(
        select(StudentProfessional).where(
            StudentProfessional.student_id == student_id,
            StudentProfessional.user_id == user_id
        )
    )

    link = result.scalars().first()

    if link:
        link.role_in_student = role_in_student
        link.can_view = can_view
        link.can_register_aba = can_register_aba
        link.can_create_assessment = can_create_assessment
        link.can_create_pei = can_create_pei
        link.can_generate_ai_report = can_generate_ai_report
        link.can_view_reports = can_view_reports

        return link

    link = StudentProfessional(
        student_id=student_id,
        user_id=user_id,
        role_in_student=role_in_student,
        can_view=can_view,
        can_register_aba=can_register_aba,
        can_create_assessment=can_create_assessment,
        can_create_pei=can_create_pei,
        can_generate_ai_report=can_generate_ai_report,
        can_view_reports=can_view_reports
    )

    db.add(link)

    await db.flush()

    return link


async def create_behavior_records(
    db,
    student_id: int
):
    result = await db.execute(
        select(BehaviorRecord).where(
            BehaviorRecord.student_id == student_id
        )
    )

    existing_records = result.scalars().all()

    if len(existing_records) >= 3:
        return

    records = [
        BehaviorRecord(
            student_id=student_id,
            antecedent="Mudança inesperada da atividade de leitura para matemática.",
            behavior="O aluno chorou, colocou as mãos nos ouvidos e recusou iniciar a atividade.",
            consequence="A professora ofereceu pausa sensorial e apresentou a rotina visual.",
            intensity=7,
            duration_minutes=12,
            environment="Sala de aula",
            strategy_used="Rotina visual e pausa sensorial",
            strategy_effective=True,
            created_at=datetime.utcnow() - timedelta(days=5)
        ),
        BehaviorRecord(
            student_id=student_id,
            antecedent="Ambiente com muito barulho durante o intervalo.",
            behavior="O aluno se afastou do grupo, ficou agitado e tentou sair do espaço.",
            consequence="O profissional de apoio conduziu o aluno para um local mais calmo.",
            intensity=8,
            duration_minutes=15,
            environment="Pátio",
            strategy_used="Redução de estímulos e acolhimento em ambiente calmo",
            strategy_effective=True,
            created_at=datetime.utcnow() - timedelta(days=3)
        ),
        BehaviorRecord(
            student_id=student_id,
            antecedent="Solicitação de copiar uma atividade longa do quadro.",
            behavior="O aluno demonstrou frustração, abaixou a cabeça e não iniciou a tarefa.",
            consequence="A atividade foi dividida em partes menores com reforço positivo.",
            intensity=5,
            duration_minutes=8,
            environment="Sala de aula",
            strategy_used="Divisão da tarefa e reforço positivo",
            strategy_effective=True,
            created_at=datetime.utcnow() - timedelta(days=1)
        )
    ]

    db.add_all(records)


async def create_assessments(
    db,
    student_id: int,
    created_by_id: int
):
    result = await db.execute(
        select(Assessment).where(
            Assessment.student_id == student_id
        )
    )

    existing_assessments = result.scalars().all()

    if len(existing_assessments) >= 2:
        return

    assessments = [
        Assessment(
            student_id=student_id,
            psychologist_id=created_by_id,
            title="Entrevista inicial com responsável",
            assessment_type="parent_interview",
            assessment_data={
                "student_history": (
                    "Responsável relata que o aluno apresenta dificuldade em lidar "
                    "com mudanças de rotina e ambientes muito barulhentos."
                ),
                "family_context": (
                    "Família participa do acompanhamento e demonstra interesse em "
                    "estratégias para apoiar a rotina escolar."
                ),
                "school_context": (
                    "Na escola, o aluno apresenta melhor desempenho em atividades "
                    "estruturadas e com apoio visual."
                ),
                "difficulties": [
                    "Transições entre atividades",
                    "Ruídos intensos",
                    "Tarefas longas sem divisão"
                ],
                "strengths": [
                    "Boa memória visual",
                    "Interesse por letras",
                    "Boa resposta a rotina previsível"
                ],
                "recommended_supports": [
                    "Uso de rotina visual",
                    "Antecipação de mudanças",
                    "Pausas sensoriais planejadas"
                ]
            },
            created_at=datetime.utcnow() - timedelta(days=4)
        ),
        Assessment(
            student_id=student_id,
            psychologist_id=created_by_id,
            title="Avaliação pedagógica inicial",
            assessment_type="student_assessment",
            assessment_data={
                "student_history": (
                    "Aluno demonstrou boa identificação de letras e interesse por "
                    "atividades com imagens."
                ),
                "school_context": (
                    "Necessita de mediação para manter atenção em tarefas extensas."
                ),
                "difficulties": [
                    "Manter atenção por longos períodos",
                    "Finalizar atividades extensas",
                    "Lidar com frustrações"
                ],
                "strengths": [
                    "Reconhecimento visual",
                    "Associação de imagens",
                    "Interesse por jogos pedagógicos"
                ],
                "recommended_supports": [
                    "Atividades curtas e sequenciadas",
                    "Reforço positivo",
                    "Materiais visuais"
                ]
            },
            created_at=datetime.utcnow() - timedelta(days=2)
        )
    ]

    db.add_all(assessments)


async def create_ai_report(
    db,
    student_id: int,
    created_by_id: int
):
    result = await db.execute(
        select(AIReport).where(
            AIReport.student_id == student_id
        )
    )

    existing_report = result.scalars().first()

    if existing_report:
        return

    content = """
Estudo de Caso — João Silva

1. Resumo do perfil do aluno

João Silva é um aluno de 9 anos, acompanhado no contexto escolar por apresentar necessidades relacionadas à comunicação, regulação emocional, sensibilidade sensorial e adaptação à rotina escolar. Segundo os registros disponíveis, apresenta boa memória visual, interesse por letras e melhor desempenho em atividades estruturadas.

2. Contexto escolar e familiar

A família participa do acompanhamento e relata dificuldades principalmente em mudanças de rotina e ambientes com muitos estímulos sonoros. No ambiente escolar, observa-se que o aluno responde melhor quando há previsibilidade, instruções curtas, apoio visual e divisão das tarefas em etapas menores.

3. Padrões comportamentais observados

Os registros ABA indicam que os comportamentos de maior intensidade ocorrem principalmente em situações de mudança inesperada, barulho intenso e tarefas longas. Os ambientes mais desafiadores incluem sala de aula em momentos de transição e pátio durante o intervalo.

4. Hipóteses funcionais

Com base nos dados registrados, os comportamentos podem estar relacionados à tentativa de evitar sobrecarga sensorial, dificuldade de lidar com mudanças inesperadas e necessidade de maior previsibilidade nas atividades. Não se trata de diagnóstico, mas de uma hipótese funcional para orientar estratégias educacionais.

5. Estratégias recomendadas

Recomenda-se o uso de rotina visual, antecipação de mudanças, pausas sensoriais planejadas, divisão de tarefas extensas em etapas menores e reforço positivo. Também é indicado reduzir estímulos em momentos de maior agitação e oferecer instruções objetivas.

6. Próximos passos

A equipe pode continuar registrando ocorrências ABA, acompanhar a evolução dos indicadores, ampliar entrevistas com família e escola e construir um PEI com metas pedagógicas individualizadas.
"""

    report = AIReport(
        student_id=student_id,
        created_by_id=created_by_id,
        report_type="case_study",
        content=content.strip(),
        pdf_path=None,
        model_used="demo",
        prompt_tokens=0,
        completion_tokens=0,
        total_tokens=0,
        created_at=datetime.utcnow() - timedelta(hours=2)
    )

    db.add(report)


async def seed():
    async with AsyncSessionLocal() as db:
        admin = await get_or_create_user(
            db=db,
            name="Admin IncluseON",
            email="admin@incluseon.com",
            password="123456",
            role=UserRole.ADMIN
        )

        psychologist = await get_or_create_user(
            db=db,
            name="Dra. Carla Psicóloga",
            email="psicologa@incluseon.com",
            password="123456",
            role=UserRole.PSYCHOLOGIST
        )

        aee = await get_or_create_user(
            db=db,
            name="Prof. Marcela AEE",
            email="aee@incluseon.com",
            password="123456",
            role=UserRole.AEE
        )

        support = await get_or_create_user(
            db=db,
            name="Gabriel Apoio Escolar",
            email="apoio@incluseon.com",
            password="123456",
            role=UserRole.SUPPORT_PROFESSIONAL
        )

        supervisor = await get_or_create_user(
            db=db,
            name="Supervisor João",
            email="supervisor@incluseon.com",
            password="123456",
            role=UserRole.SUPERVISOR
        )

        student = await get_or_create_student(
            db=db,
            psychologist_id=psychologist.id
        )

        await get_or_create_link(
            db=db,
            student_id=student.id,
            user_id=psychologist.id,
            role_in_student=StudentProfessionalRole.OWNER,
            can_view=True,
            can_register_aba=True,
            can_create_assessment=True,
            can_create_pei=True,
            can_generate_ai_report=True,
            can_view_reports=True
        )

        await get_or_create_link(
            db=db,
            student_id=student.id,
            user_id=aee.id,
            role_in_student=StudentProfessionalRole.AEE,
            can_view=True,
            can_register_aba=False,
            can_create_assessment=True,
            can_create_pei=True,
            can_generate_ai_report=True,
            can_view_reports=True
        )

        await get_or_create_link(
            db=db,
            student_id=student.id,
            user_id=support.id,
            role_in_student=StudentProfessionalRole.SUPPORT,
            can_view=True,
            can_register_aba=True,
            can_create_assessment=False,
            can_create_pei=False,
            can_generate_ai_report=False,
            can_view_reports=False
        )

        await get_or_create_link(
            db=db,
            student_id=student.id,
            user_id=supervisor.id,
            role_in_student=StudentProfessionalRole.SUPERVISOR,
            can_view=True,
            can_register_aba=True,
            can_create_assessment=True,
            can_create_pei=True,
            can_generate_ai_report=True,
            can_view_reports=True
        )

        await get_or_create_link(
            db=db,
            student_id=student.id,
            user_id=admin.id,
            role_in_student=StudentProfessionalRole.OWNER,
            can_view=True,
            can_register_aba=True,
            can_create_assessment=True,
            can_create_pei=True,
            can_generate_ai_report=True,
            can_view_reports=True
        )

        await create_behavior_records(
            db=db,
            student_id=student.id
        )

        await create_assessments(
            db=db,
            student_id=student.id,
            created_by_id=aee.id
        )

        await create_ai_report(
            db=db,
            student_id=student.id,
            created_by_id=aee.id
        )

        await db.commit()

        print("\nSeed de demonstração criado com sucesso!\n")

        print("Usuários para teste:")
        print("Admin: admin@incluseon.com | senha: 123456")
        print("Psicóloga: psicologa@incluseon.com | senha: 123456")
        print("AEE: aee@incluseon.com | senha: 123456")
        print("Apoio: apoio@incluseon.com | senha: 123456")
        print("Supervisor: supervisor@incluseon.com | senha: 123456")
        print("\nAluno demo: João Silva\n")


if __name__ == "__main__":
    asyncio.run(seed())
