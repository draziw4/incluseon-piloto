import unittest

from pydantic import ValidationError

from schemas.user import PasswordChange


class UserSecuritySchemaTests(unittest.TestCase):
    def test_requires_stronger_new_password(self):
        with self.assertRaises(ValidationError):
            PasswordChange(current_password="123456", new_password="short")

    def test_accepts_valid_password_change(self):
        data = PasswordChange(
            current_password="current-password",
            new_password="new-secure-password",
        )
        self.assertEqual(data.new_password, "new-secure-password")


if __name__ == "__main__":
    unittest.main()
