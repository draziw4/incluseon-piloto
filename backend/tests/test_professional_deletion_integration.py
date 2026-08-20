import os
import unittest
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from models.models import (
    AccountStatus,
    Appointment,
    AppointmentStatus,
    AppointmentType,
    BehaviorRecord,
    Student,
    StudentProfessional,
    StudentProfessionalRole,
    User,
    UserRole,
)
from routes.users import delete_user


TEST_DATABASE_URL = os.getenv("DELETION_TEST_DATABASE_URL")


@unittest.skipUnless(TEST_DATABASE_URL, "Banco temporário de integração não configurado")
class ProfessionalDeletionIntegrationTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine(TEST_DATABASE_URL)
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)

    async def asyncTearDown(self):
        await self.engine.dispose()

    async def test_owner_is_transferred_and_history_is_preserved(self):
        async with self.session_factory() as db:
            admin = User(
                name="Admin exclusão",
                email="admin-delete@example.test",
                password_hash="not-used",
                role=UserRole.ADMIN,
                account_status=AccountStatus.ACTIVE,
            )
            old_owner = User(
                name="Responsável antigo",
                email="old-owner@example.test",
                password_hash="not-used",
                role=UserRole.PSYCHOLOGIST,
                account_status=AccountStatus.ACTIVE,
            )
            replacement = User(
                name="Novo responsável",
                email="replacement@example.test",
                password_hash="not-used",
                role=UserRole.AEE,
                account_status=AccountStatus.ACTIVE,
            )
            db.add_all([admin, old_owner, replacement])
            await db.flush()

            student = Student(
                name="Aluno preservado",
                birth_date=date(2015, 1, 1),
                psychologist_id=old_owner.id,
            )
            db.add(student)
            await db.flush()
            db.add_all([
                StudentProfessional(
                    student_id=student.id,
                    user_id=old_owner.id,
                    role_in_student=StudentProfessionalRole.OWNER,
                    can_view=True,
                    can_register_aba=True,
                ),
                StudentProfessional(
                    student_id=student.id,
                    user_id=replacement.id,
                    role_in_student=StudentProfessionalRole.AEE,
                    can_view=True,
                ),
            ])
            behavior = BehaviorRecord(
                student_id=student.id,
                created_by_id=old_owner.id,
                created_by_name=old_owner.name,
                created_by_role=old_owner.role.value,
                antecedent="Antecedente",
                behavior="Comportamento",
                consequence="Consequência",
            )
            appointment = Appointment(
                student_id=student.id,
                professional_id=old_owner.id,
                appointment_type=AppointmentType.OTHER,
                status=AppointmentStatus.SCHEDULED,
                scheduled_at=datetime.utcnow() + timedelta(days=1),
            )
            db.add_all([behavior, appointment])
            await db.commit()
            old_owner_id = old_owner.id
            replacement_id = replacement.id
            student_id = student.id
            behavior_id = behavior.id
            appointment_id = appointment.id

            await delete_user(
                user_id=old_owner_id,
                admin=admin,
                replacement_user_id=replacement_id,
                db=db,
            )

        async with self.session_factory() as db:
            self.assertIsNone(await db.get(User, old_owner_id))
            preserved_student = await db.get(Student, student_id)
            self.assertIsNotNone(preserved_student)
            self.assertEqual(preserved_student.psychologist_id, replacement_id)

            owner_result = await db.execute(
                select(StudentProfessional).where(
                    StudentProfessional.student_id == student_id,
                    StudentProfessional.user_id == replacement_id,
                )
            )
            self.assertEqual(
                owner_result.scalar_one().role_in_student,
                StudentProfessionalRole.OWNER,
            )

            preserved_behavior = await db.get(BehaviorRecord, behavior_id)
            self.assertIsNotNone(preserved_behavior)
            self.assertIsNone(preserved_behavior.created_by_id)
            self.assertEqual(preserved_behavior.created_by_name, "Responsável antigo")
            self.assertEqual(preserved_behavior.created_by_role, UserRole.PSYCHOLOGIST.value)

            preserved_appointment = await db.get(Appointment, appointment_id)
            self.assertIsNotNone(preserved_appointment)
            self.assertIsNone(preserved_appointment.professional_id)
            self.assertEqual(preserved_appointment.status, AppointmentStatus.CANCELED)
