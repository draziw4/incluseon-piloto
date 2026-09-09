import unittest
from datetime import date, datetime
from types import SimpleNamespace
from main import app
from models.models import Notification
from schemas.notification import NotificationListResponse, NotificationResponse
from services.notification_service import (
    birthday_notification_copy,
    create_notification,
    ensure_student_birthday_notifications,
    next_birthday,
)


class FakeSession:
    def __init__(self):
        self.added = []

    def add(self, value):
        self.added.append(value)


class FakeResult:
    def __init__(self, values):
        self.values = values

    def scalars(self):
        return self

    def all(self):
        return self.values


class BirthdaySession(FakeSession):
    def __init__(self, students, existing=()):
        super().__init__()
        self.results = iter((FakeResult(students), FakeResult(existing)))

    async def execute(self, _query):
        return next(self.results)


class NotificationTests(unittest.IsolatedAsyncioTestCase):
    def test_notification_model_has_persistent_read_state_and_context(self):
        columns = Notification.__table__.columns
        for field in (
            "recipient_user_id",
            "event_type",
            "message",
            "student_id",
            "resource_type",
            "resource_id",
            "action_url",
            "read_at",
            "created_at",
        ):
            self.assertIn(field, columns)

    def test_notification_response_exposes_unread_total(self):
        item = NotificationResponse(
            id=1,
            event_type="support_report_pending",
            title="Relatório pendente",
            message="Um relatório requer avaliação.",
            student_id=2,
            resource_type="student_progress_report",
            resource_id=3,
            action_url="/students/2?tab=behavior",
            read_at=None,
            created_at=datetime(2026, 8, 20, 12, 0),
        )
        response = NotificationListResponse(items=[item], unread_count=1)
        self.assertEqual(response.unread_count, 1)
        self.assertIsNone(response.items[0].read_at)

    async def test_actor_does_not_receive_own_notification(self):
        db = FakeSession()
        created = await create_notification(
            db,
            recipient_user_id=10,
            actor_user_id=10,
            event_type="student_linked",
            title="Vínculo",
            message="Vínculo atualizado.",
        )
        self.assertIsNone(created)
        self.assertEqual(db.added, [])

    async def test_notification_is_staged_in_the_same_transaction(self):
        db = FakeSession()
        created = await create_notification(
            db,
            recipient_user_id=10,
            actor_user_id=20,
            event_type="student_linked",
            title="Vínculo",
            message="Você foi vinculado.",
            student_id=2,
        )
        self.assertIs(created, db.added[0])
        self.assertEqual(created.recipient_user_id, 10)

    def test_notification_routes_require_authentication(self):
        paths = app.openapi()["paths"]
        for path, method in (
            ("/notifications", "get"),
            ("/notifications/read-all", "patch"),
            ("/notifications/{notification_id}/read", "patch"),
        ):
            with self.subTest(path=path):
                self.assertTrue(paths[path][method].get("security"))

    def test_next_birthday_crosses_the_year_boundary(self):
        occurrence = next_birthday(date(2016, 1, 3), date(2026, 12, 30))
        self.assertEqual(occurrence, date(2027, 1, 3))

    def test_birthday_notification_distinguishes_upcoming_and_today(self):
        student = SimpleNamespace(name="Maria Silva", birth_date=date(2016, 9, 9))

        upcoming_title, upcoming_message = birthday_notification_copy(
            student, date(2026, 9, 9), 3
        )
        today_title, today_message = birthday_notification_copy(
            student, date(2026, 9, 9), 0
        )

        self.assertIn("próximo", upcoming_title)
        self.assertIn("09/09", upcoming_message)
        self.assertIn("hoje", today_title.lower())
        self.assertIn("10 anos", today_message)

    async def test_upcoming_birthday_notification_is_persisted_once_per_occurrence(self):
        student = SimpleNamespace(
            id=5,
            name="Maria Silva",
            birth_date=date(2016, 9, 12),
        )
        user = SimpleNamespace(id=10, role="admin")
        db = BirthdaySession([student])

        created_count = await ensure_student_birthday_notifications(
            db,
            user=user,
            today=date(2026, 9, 9),
        )

        self.assertEqual(created_count, 1)
        self.assertEqual(len(db.added), 1)
        self.assertEqual(db.added[0].event_type, "student_birthday_upcoming")
        self.assertEqual(db.added[0].resource_id, 2026)

    async def test_existing_birthday_notification_is_not_duplicated(self):
        student = SimpleNamespace(
            id=5,
            name="Maria Silva",
            birth_date=date(2016, 9, 12),
        )
        user = SimpleNamespace(id=10, role="admin")
        db = BirthdaySession(
            [student],
            existing=[(5, "student_birthday_upcoming", 2026)],
        )

        created_count = await ensure_student_birthday_notifications(
            db,
            user=user,
            today=date(2026, 9, 9),
        )

        self.assertEqual(created_count, 0)
        self.assertEqual(db.added, [])


if __name__ == "__main__":
    unittest.main()
