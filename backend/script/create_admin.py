import argparse
import asyncio
import secrets

from sqlalchemy import func, select

from database import AsyncSessionLocal
from models.models import User, UserRole
from security import hash_password


async def create_admin(name: str, email: str) -> None:
    normalized_email = email.strip().lower()
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(func.lower(User.email) == normalized_email)
        )
        user = result.scalar_one_or_none()
        if user:
            if user.role != UserRole.ADMIN:
                user.role = UserRole.ADMIN
                user.token_version += 1
                await db.commit()
                print("Existing user promoted to admin.")
            else:
                print("Admin already exists.")
            return

        user = User(
            name=name.strip(),
            email=normalized_email,
            password_hash=hash_password(secrets.token_urlsafe(64)),
            role=UserRole.ADMIN,
        )
        db.add(user)
        await db.commit()
        print("Admin created. Use the password reset flow to define the first password.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create the first production admin")
    parser.add_argument("--name", required=True)
    parser.add_argument("--email", required=True)
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    asyncio.run(create_admin(arguments.name, arguments.email))
