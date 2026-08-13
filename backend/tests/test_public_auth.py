import unittest
from unittest.mock import patch

from pydantic import ValidationError

from schemas.user import PublicRegistration
from services.google_identity import verify_google_credential


class PublicRegistrationSchemaTests(unittest.TestCase):
    def test_registration_accepts_professional_without_role_field(self):
        data = PublicRegistration(
            name="Cliente de Teste",
            email="cliente@example.com",
            password="senha-segura-123",
            accepted_terms=True,
        )
        self.assertFalse(hasattr(data, "role"))

    def test_registration_requires_terms_and_strong_password(self):
        with self.assertRaises(ValidationError):
            PublicRegistration(
                name="Cliente",
                email="cliente@example.com",
                password="curta",
                accepted_terms=False,
            )

        with self.assertRaises(ValidationError):
            PublicRegistration(
                name="   ",
                email="professional@example.com",
                password="a-strong-password",
                accepted_terms=True,
            )


class GoogleIdentityTests(unittest.TestCase):
    @patch("services.google_identity.id_token.verify_oauth2_token")
    def test_accepts_verified_google_identity(self, verify_token):
        verify_token.return_value = {
            "sub": "google-subject-123",
            "email": "CLIENTE@example.com",
            "email_verified": True,
            "name": "Cliente Google",
        }

        identity = verify_google_credential("credential", "client-id")

        self.assertEqual(identity.subject, "google-subject-123")
        self.assertEqual(identity.email, "cliente@example.com")
        self.assertEqual(identity.name, "Cliente Google")

    @patch("services.google_identity.id_token.verify_oauth2_token")
    def test_rejects_unverified_google_email(self, verify_token):
        verify_token.return_value = {
            "sub": "google-subject-123",
            "email": "cliente@example.com",
            "email_verified": False,
        }

        with self.assertRaises(ValueError):
            verify_google_credential("credential", "client-id")


if __name__ == "__main__":
    unittest.main()
