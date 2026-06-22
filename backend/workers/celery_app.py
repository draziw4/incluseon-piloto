from celery import Celery
from config import settings


celery = Celery(
    "worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "workers.ai_tasks"
    ]
)

celery.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
    result_expires=86400,
    task_soft_time_limit=180,
    task_time_limit=210,
)
