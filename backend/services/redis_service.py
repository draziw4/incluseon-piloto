import redis.asyncio as redis

from config import settings


client = redis.from_url(settings.redis_url, decode_responses=True)


async def register_task_owner(task_id: str, user_id: int, student_id: int) -> None:
    await client.hset(f"task-owner:{task_id}", mapping={"user_id": user_id, "student_id": student_id})
    await client.expire(f"task-owner:{task_id}", 60 * 60 * 24)


async def get_task_owner(task_id: str) -> dict[str, str]:
    return await client.hgetall(f"task-owner:{task_id}")
