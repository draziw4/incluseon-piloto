import unittest
from types import SimpleNamespace

from fastapi import HTTPException

from models.models import UserRole
from services.permissions_service import require_behavior_record_ownership


class BehaviorRecordPermissionTests(unittest.TestCase):
    def test_support_professional_can_change_own_record(self):
        user = SimpleNamespace(id=10, role=UserRole.SUPPORT_PROFESSIONAL)

        require_behavior_record_ownership(user, created_by_id=10)

    def test_support_professional_cannot_change_another_authors_record(self):
        user = SimpleNamespace(id=10, role=UserRole.SUPPORT_PROFESSIONAL)

        with self.assertRaises(HTTPException) as raised:
            require_behavior_record_ownership(user, created_by_id=20)

        self.assertEqual(raised.exception.status_code, 403)

    def test_support_professional_cannot_change_legacy_record_without_author(self):
        user = SimpleNamespace(id=10, role=UserRole.SUPPORT_PROFESSIONAL)

        with self.assertRaises(HTTPException) as raised:
            require_behavior_record_ownership(user, created_by_id=None)

        self.assertEqual(raised.exception.status_code, 403)

    def test_other_professional_profiles_keep_existing_behavior(self):
        user = SimpleNamespace(id=10, role=UserRole.PSYCHOLOGIST)

        require_behavior_record_ownership(user, created_by_id=20)


if __name__ == "__main__":
    unittest.main()
