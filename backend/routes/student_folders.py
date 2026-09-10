from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from access_policy import ToolAccess
from database import get_db
from dependencies import get_current_user
from models.models import Student, StudentFolder, StudentProfessional, User, UserRole
from permissions import require_tool
from schemas.student_folder import (
    StudentFolderCreate,
    StudentFolderResponse,
    StudentFolderUpdate,
)


router = APIRouter(
    prefix="/student-folders",
    tags=["Student Folders"],
    dependencies=[Depends(require_tool(ToolAccess.STUDENTS))],
)


async def get_owned_folder_or_404(
    db: AsyncSession,
    current_user: User,
    folder_id: int,
) -> StudentFolder:
    folder = await db.get(StudentFolder, folder_id)
    if folder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasta não encontrada")
    if current_user.role != UserRole.ADMIN and folder.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para alterar esta pasta")
    return folder


async def ensure_unique_folder_name(
    db: AsyncSession,
    owner_id: int,
    name: str,
    excluding_id: int | None = None,
) -> None:
    query = select(StudentFolder.id).where(
        StudentFolder.owner_id == owner_id,
        func.lower(StudentFolder.name) == name.lower(),
    )
    if excluding_id is not None:
        query = query.where(StudentFolder.id != excluding_id)
    if (await db.execute(query)).scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma pasta com este nome",
        )


@router.get("", response_model=list[StudentFolderResponse])
async def list_student_folders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    query = select(StudentFolder)
    if current_user.role != UserRole.ADMIN:
        accessible_folder_ids = (
            select(Student.folder_id)
            .outerjoin(
                StudentProfessional,
                StudentProfessional.student_id == Student.id,
            )
            .where(
                or_(
                    Student.psychologist_id == current_user.id,
                    StudentProfessional.user_id == current_user.id,
                ),
                Student.folder_id.is_not(None),
            )
        )
        query = query.where(
            or_(
                StudentFolder.owner_id == current_user.id,
                StudentFolder.id.in_(accessible_folder_ids),
            )
        )

    result = await db.execute(query.order_by(func.lower(StudentFolder.name), StudentFolder.id))
    return [
        StudentFolderResponse.model_validate(folder).model_copy(
            update={
                "can_manage": current_user.role == UserRole.ADMIN
                or folder.owner_id == current_user.id
            }
        )
        for folder in result.scalars().all()
    ]


@router.post("", response_model=StudentFolderResponse, status_code=status.HTTP_201_CREATED)
async def create_student_folder(
    data: StudentFolderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_tool(ToolAccess.STUDENT_MANAGEMENT))],
):
    await ensure_unique_folder_name(db, current_user.id, data.name)
    folder = StudentFolder(owner_id=current_user.id, name=data.name)
    db.add(folder)
    await db.commit()
    await db.refresh(folder)
    return StudentFolderResponse.model_validate(folder).model_copy(update={"can_manage": True})


@router.patch("/{folder_id}", response_model=StudentFolderResponse)
async def rename_student_folder(
    folder_id: int,
    data: StudentFolderUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_tool(ToolAccess.STUDENT_MANAGEMENT))],
):
    folder = await get_owned_folder_or_404(db, current_user, folder_id)
    await ensure_unique_folder_name(db, folder.owner_id, data.name, excluding_id=folder.id)
    folder.name = data.name
    await db.commit()
    await db.refresh(folder)
    return StudentFolderResponse.model_validate(folder).model_copy(update={"can_manage": True})


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student_folder(
    folder_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_tool(ToolAccess.STUDENT_MANAGEMENT))],
):
    folder = await get_owned_folder_or_404(db, current_user, folder_id)
    await db.execute(update(Student).where(Student.folder_id == folder.id).values(folder_id=None))
    await db.delete(folder)
    await db.commit()
