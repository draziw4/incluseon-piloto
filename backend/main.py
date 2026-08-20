from fastapi import FastAPI
from routes.users import router as user_router
from routes.auth import router as auth_router
from routes.students import router as student_router
from routes.ai import router as ai_router
from routes.behavior_record import router as behavior_router
from routes.assessments import router as assessments_router
from database import engine,Base
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request, status
from fastapi.responses import JSONResponse
from routes.timeline import router as timeline_router
from routes.analytics import router as analytics_router
from routes.tasks import router as tasks_router
from routes.ai_reports import router as ai_reports_router
from routes.ai_usage import router as ai_usage_router
from routes.student_professionals import router as student_professionals_router
from routes.appointments import router as appointments_router
from routes.dashboard import router as dashboard_router
from routes.student_goals import router as student_goals_router
from routes.admin import router as admin_router
from routes.pilot_feedback import router as pilot_feedback_router
from routes.student_progress_reports import router as student_progress_reports_router
from routes.notifications import router as notifications_router
from config import settings
from sqlalchemy import text
import logging
import time
import uuid

from observability import configure_observability
configure_observability()
logger = logging.getLogger("incluseon.http")


@asynccontextmanager
async def lifespan(_app:FastAPI):
    yield

    await engine.dispose()




app = FastAPI(
    title="NeuroAcompanhamento API",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.middleware("http")
async def operational_controls(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", "")
    if len(request_id) > 64 or not request_id.replace("-", "").isalnum():
        request_id = ""
    request_id = request_id or str(uuid.uuid4())

    host = request.headers.get("host", "").split(":", 1)[0]
    health_paths = {"/health", "/ready", "/api/health", "/api/ready"}
    if request.url.path not in health_paths and host not in settings.trusted_hosts:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Host inválido"},
            headers={"X-Request-ID": request_id},
        )

    origin = request.headers.get("origin")
    if (
        request.method in {"POST", "PUT", "PATCH", "DELETE"}
        and origin
        and origin not in settings.allowed_origins
    ):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Origem não autorizada"},
            headers={"X-Request-ID": request_id},
        )

    content_length = request.headers.get("content-length")
    max_size = settings.max_request_size_mb * 1024 * 1024
    try:
        request_size = int(content_length) if content_length else 0
    except ValueError:
        request_size = max_size + 1
    if request_size > max_size:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"detail": "Requisição excede o tamanho permitido"},
            headers={"X-Request-ID": request_id},
        )

    started = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - started) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Cache-Control"] = response.headers.get("Cache-Control", "no-store")
    logger.info(
        "audit_event" if request.method in {"POST", "PUT", "PATCH", "DELETE"} else "request_completed",
        extra={
            "request_id": request_id,
            "user_id": getattr(request.state, "user_id", None),
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    return response

app.include_router(user_router)
app.include_router(auth_router)
app.include_router(student_router)
app.include_router(behavior_router)
app.include_router(assessments_router)
app.include_router(ai_router)
app.include_router(timeline_router)
app.include_router(analytics_router)
app.include_router(tasks_router)
app.include_router(ai_reports_router)
app.include_router(ai_usage_router)
app.include_router(student_professionals_router)
app.include_router(appointments_router)
app.include_router(dashboard_router)
app.include_router(student_goals_router)
app.include_router(admin_router)
app.include_router(pilot_feedback_router)
app.include_router(student_progress_reports_router)
app.include_router(notifications_router)


@app.get("/")
async def root():
    return{"message":"Api Funcionando"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}


@app.get("/ready", tags=["Health"])
async def readiness():
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))
    return {"status": "ready"}
