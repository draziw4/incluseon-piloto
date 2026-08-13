import asyncio
import os
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

from sqlalchemy import select


BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from database import AsyncSessionLocal
from models.models import (
    AIReport,
    Student,
    StudentProfessionalRole,
    User,
    UserRole,
)
from script.seed_demo import (
    create_assessments,
    create_behavior_records,
    get_or_create_link,
)
from security import hash_password, verify_password


def required_environment(name: str, minimum_length: int = 1) -> str:
    value = os.getenv(name, "").strip()
    if len(value) < minimum_length:
        raise RuntimeError(f"{name} deve ter ao menos {minimum_length} caracteres")
    return value


async def ensure_user(db, name: str, email: str, password: str, role: UserRole) -> User:
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            name=name,
            email=email.lower(),
            password_hash=hash_password(password),
            role=role,
        )
        db.add(user)
        await db.flush()
        return user

    user.name = name
    user.role = role
    if not verify_password(password, user.password_hash):
        user.password_hash = hash_password(password)
        user.token_version += 1
    return user


async def ensure_demo_student(db, professional_id: int) -> Student:
    result = await db.execute(
        select(Student).where(Student.name == "Aluno Demonstração 01")
    )
    student = result.scalar_one_or_none()
    if student:
        student.psychologist_id = professional_id
        return student

    student = Student(
        psychologist_id=professional_id,
        name="Aluno Demonstração 01",
        age=10,
        birth_date=date(2016, 3, 15),
        diagnosis="Cenário sintético para validação — sem diagnóstico real",
        school_name="Escola Demonstração",
        guardian_name="Responsável Fictício",
        guardian_phone="(00) 00000-0000",
        communication_notes="Dados fictícios: utiliza comunicação verbal e responde bem a apoio visual.",
        sensory_notes="Dados fictícios: prefere ambientes com menos estímulos sonoros.",
        general_observations="Cadastro criado exclusivamente para apresentação e testes do piloto.",
        strengths="Boa resposta a recursos visuais e atividades estruturadas.",
        learning_profile="Aprendizagem demonstrativa com instruções objetivas e etapas curtas.",
        preferred_reinforcers="Elogios e atividades educativas simuladas.",
        sensory_triggers="Ruídos e mudanças inesperadas no cenário fictício.",
        communication_style="Comunicação verbal com apoio visual.",
        emotional_regulation_notes="Responde a antecipação e pausas planejadas no cenário fictício.",
    )
    db.add(student)
    await db.flush()
    return student


async def ensure_demo_report(db, student_id: int, professional_id: int) -> None:
    result = await db.execute(
        select(AIReport).where(
            AIReport.student_id == student_id,
            AIReport.model_used == "piloto demonstrativo",
        )
    )
    if result.scalar_one_or_none():
        return

    db.add(
        AIReport(
            student_id=student_id,
            created_by_id=professional_id,
            report_type="case_study",
            content=(
                "Estudo de caso demonstrativo\n\n"
                "Este relatório contém somente dados sintéticos e foi preparado para "
                "validar a leitura, revisão profissional, histórico e exportação em PDF.\n\n"
                "1. Síntese\n\nO cenário demonstra acompanhamento estruturado, uso de "
                "recursos visuais e registro contínuo das estratégias aplicadas.\n\n"
                "2. Validação profissional\n\nRevise o conteúdo, registre ajustes pelo botão "
                "de feedback e confirme se o fluxo atende à rotina de trabalho."
            ),
            pdf_path=None,
            model_used="piloto demonstrativo",
            prompt_tokens=0,
            completion_tokens=0,
            total_tokens=0,
            created_at=datetime.utcnow() - timedelta(days=2),
        )
    )


async def seed() -> None:
    admin_email = required_environment("PILOT_ADMIN_EMAIL")
    admin_password = required_environment("PILOT_ADMIN_PASSWORD", 12)
    professional_email = required_environment("PILOT_PROFESSIONAL_EMAIL")
    professional_password = required_environment("PILOT_PROFESSIONAL_PASSWORD", 12)
    professional_name = os.getenv("PILOT_PROFESSIONAL_NAME", "Profissional Avaliador").strip()

    async with AsyncSessionLocal() as db:
        await ensure_user(
            db,
            name="Administrador do piloto",
            email=admin_email,
            password=admin_password,
            role=UserRole.ADMIN,
        )
        professional = await ensure_user(
            db,
            name=professional_name,
            email=professional_email,
            password=professional_password,
            role=UserRole.PSYCHOLOGIST,
        )
        student = await ensure_demo_student(db, professional.id)
        await get_or_create_link(
            db=db,
            student_id=student.id,
            user_id=professional.id,
            role_in_student=StudentProfessionalRole.OWNER,
            can_view=True,
            can_register_aba=True,
            can_create_assessment=True,
            can_create_pei=True,
            can_generate_ai_report=True,
            can_view_reports=True,
        )
        await create_behavior_records(db, student.id)
        await create_assessments(db, student.id, professional.id)
        await ensure_demo_report(db, student.id, professional.id)
        await db.commit()

    print("Piloto preparado com dados sintéticos e credenciais protegidas por variáveis de ambiente.")


if __name__ == "__main__":
    asyncio.run(seed())
