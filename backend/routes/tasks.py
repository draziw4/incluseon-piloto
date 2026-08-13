from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession

from celery.result import AsyncResult

from workers.celery_app import (
    celery
)
from dependencies import get_current_user
from database import get_db
from models.models import User, AIReport
from services.permissions_service import require_student_report_access
from services.redis_service import get_task_owner
from access_policy import ToolAccess
from permissions import require_tool

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
    dependencies=[Depends(require_tool(ToolAccess.AI_CASE_STUDIES))],
)

@router.get("/{task_id}")
async def get_task_status(
    task_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    ownership = await get_task_owner(task_id)
    if not ownership or ownership.get("user_id") != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")

    task = AsyncResult(
        task_id,
        app=celery
    )

    # =====================================
    # FAILURE
    # =====================================

    if task.failed():

        return {

            "task_id": task.id,

            "status": "FAILURE",

            "error": "Não foi possível gerar o relatório. Tente novamente."
        }

    # =====================================
    # SUCCESS
    # =====================================

    if task.ready():

        result = task.result
        report = await db.get(AIReport, result.get("report_id"))

        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Relatório não encontrado"
            )

        await require_student_report_access(
            db=db,
            user=current_user,
            student_id=report.student_id
        )

        return {

            "task_id": task.id,

            "status": task.status,

            "report":
            result["report"],

            "pdf_url":
            f"/ai-reports/{result['report_id']}/download"
        }

    # =====================================
    # PENDING
    # =====================================

    return {

        "task_id": task.id,

        "status": task.status,

        "report": None,

        "pdf_url": None
    }
