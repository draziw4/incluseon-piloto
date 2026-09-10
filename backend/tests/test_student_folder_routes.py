import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock

from fastapi import HTTPException

from models.models import UserRole
from routes.student_folders import get_owned_folder_or_404


class StudentFolderRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_missing_folder_returns_not_found(self):
        db = SimpleNamespace(get=AsyncMock(return_value=None))
        user = SimpleNamespace(id=2, role=UserRole.AEE)

        with self.assertRaises(HTTPException) as context:
            await get_owned_folder_or_404(db, user, 99)

        self.assertEqual(context.exception.status_code, 404)

    async def test_professional_cannot_rename_another_users_folder(self):
        folder = SimpleNamespace(id=7, owner_id=3)
        db = SimpleNamespace(get=AsyncMock(return_value=folder))
        user = SimpleNamespace(id=2, role=UserRole.AEE)

        with self.assertRaises(HTTPException) as context:
            await get_owned_folder_or_404(db, user, folder.id)

        self.assertEqual(context.exception.status_code, 403)

    async def test_admin_can_manage_any_folder(self):
        folder = SimpleNamespace(id=7, owner_id=3)
        db = SimpleNamespace(get=AsyncMock(return_value=folder))
        user = SimpleNamespace(id=1, role=UserRole.ADMIN)

        result = await get_owned_folder_or_404(db, user, folder.id)

        self.assertIs(result, folder)


if __name__ == "__main__":
    unittest.main()
