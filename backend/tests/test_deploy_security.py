import unittest

from pydantic import ValidationError

from config import Settings
from main import app
from security import create_access_token, create_refresh_token, decode_token


class DeploySecurityTests(unittest.TestCase):
    def test_access_token_carries_server_session_version(self):
        payload = decode_token(create_access_token(42, token_version=7))
        self.assertEqual(payload["sub"], "42")
        self.assertEqual(payload["type"], "access")
        self.assertEqual(payload["ver"], 7)

    def test_refresh_tokens_have_unique_rotation_ids(self):
        first = decode_token(create_refresh_token(42, token_version=7))
        second = decode_token(create_refresh_token(42, token_version=7))
        self.assertNotEqual(first["jti"], second["jti"])

    def test_production_rejects_weak_secret(self):
        with self.assertRaises(ValidationError):
            Settings(
                database_url="postgresql+asyncpg://user:pass@db/app",
                secret_key="change-me",
                openai_api_key="test-key",
                environment="production",
                cors_origins="https://app.example.com",
                allowed_hosts="app.example.com",
                cookie_secure=True,
                ses_from_email="noreply@example.com",
            )

    def test_user_creation_is_not_public(self):
        operation = app.openapi()["paths"]["/users"]["post"]
        self.assertTrue(operation.get("security"))


if __name__ == "__main__":
    unittest.main()
