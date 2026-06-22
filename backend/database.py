from sqlalchemy.ext.asyncio import create_async_engine,async_sessionmaker,AsyncSession
from config import settings
from sqlalchemy.orm import DeclarativeBase



engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping = True

)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
