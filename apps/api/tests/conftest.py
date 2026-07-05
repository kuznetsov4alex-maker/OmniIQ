import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app

TEST_DB_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/atlas_test"
TEST_JWT_SECRET = "test-secret"
TEST_USER_ID = "user-test-123"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture()
async def db():
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture()
async def client(db: AsyncSession):
    async def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers() -> dict:
    token = jwt.encode(
        {"sub": TEST_USER_ID, "role": "authenticated"},
        TEST_JWT_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}
