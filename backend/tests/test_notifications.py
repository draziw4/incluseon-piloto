import unittest
from datetime import datetime
from main import app
from models.models import Notification
from schemas.notification import NotificationListResponse, NotificationResponse
from services.notification_service import create_notification


class FakeSession:
    def __init__(self):
        self.added = []

    def add(self, value):
        self.added.append(value)


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


if __name__ == "__main__":
    unittest.main()
