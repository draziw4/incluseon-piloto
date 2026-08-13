from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query
)

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import (
    select,
    func,
    or_
)

from typing import Annotated

from database import get_db
from access_policy import ToolAccess

from dependencies import get_current_user
from permissions import require_tool

from models.models import (
    User,
    Student,
    StudentProfessional,
    UserRole,
    StudentProfessionalRole,
    AIReport
)

from schemas.student import (
    StudentCreate,
    StudentResponse,
    StudentUpdate
)

from schemas.pagination import PaginatedResponse

from services.permissions_service import (
    require_student_access,
    get_student_or_404
)
from services.pdf.pdf_generator import delete_generated_report


router = APIRouter(
    prefix="/students",
    tags=["Students"],
    dependencies=[Depends(require_tool(ToolAccess.STUDENTS))],
)


@router.post(
    "",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_student(
    data: StudentCreate,

    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(require_tool(ToolAccess.STUDENT_MANAGEMENT))
    ]
):
    student = Student(
        psychologist_id=current_user.id,
        **data.model_dump()
    )

    db.add(student)

    await db.flush()

    professional_link = StudentProfessional(
        student_id=student.id,
        user_id=current_user.id,
        role_in_student=StudentProfessionalRole.OWNER,
        can_view=True,
        can_register_aba=True,
        can_create_assessment=True,
        can_create_pei=True,
        can_generate_ai_report=True,
        can_view_reports=True
    )

    db.add(professional_link)

    await db.commit()
    await db.refresh(student)

    return student


@router.get(
    "",
    response_model=PaginatedResponse[StudentResponse]
)
async def get_students(
    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(get_current_user)
    ],

    page: int = Query(
        default=1,
        ge=1
    ),

    per_page: int = Query(
        default=10,
        ge=1,
        le=100
    ),

    search: str | None = None
):
    query = select(Student).outerjoin(
        StudentProfessional,
        StudentProfessional.student_id == Student.id
    )

    if current_user.role != UserRole.ADMIN:
        query = query.where(
            or_(
                Student.psychologist_id == current_user.id,
                StudentProfessional.user_id == current_user.id
            )
        )

    if search:
        query = query.where(
            Student.name.ilike(
                f"%{search}%"
            )
        )

    query = query.distinct()

    count_query = select(
        func.count()
    ).select_from(
        query.subquery()
    )

    total_result = await db.execute(
        count_query
    )

    total = total_result.scalar() or 0

    query = (
        query
        .order_by(Student.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )

    result = await db.execute(
        query
    )

    students = result.scalars().all()

    return {
        "items": students,
        "total": total,
        "page": page,
        "per_page": per_page
    }


@router.get(
    "/{student_id}",
    response_model=StudentResponse
)
async def get_student(
    student_id: int,

    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(get_current_user)
    ]
):
    student = await require_student_access(
        db=db,
        user=current_user,
        student_id=student_id
    )

    return student


@router.patch(
    "/{student_id}",
    response_model=StudentResponse
)
async def update_student(
    student_id: int,
    data: StudentUpdate,

    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(require_tool(ToolAccess.STUDENT_MANAGEMENT))
    ]
):
    student = await get_student_or_404(
        db=db,
        student_id=student_id
    )

    if (
        current_user.role != UserRole.ADMIN
        and student.psychologist_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para editar este aluno"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            student,
            field,
            value
        )

    await db.commit()
    await db.refresh(student)

    return student


@router.delete(
    "/{student_id}",
    status_code=status.HTTP_200_OK
)
async def delete_student(
    student_id: int,

    db: Annotated[
        AsyncSession,
        Depends(get_db)
    ],

    current_user: Annotated[
        User,
        Depends(require_tool(ToolAccess.STUDENT_MANAGEMENT))
    ]
):
    student = await get_student_or_404(
        db=db,
        student_id=student_id
    )

    if (
        current_user.role != UserRole.ADMIN
        and student.psychologist_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para deletar este aluno"
        )

    reports_result = await db.execute(
        select(AIReport.pdf_path).where(
            AIReport.student_id == student.id,
            AIReport.pdf_path.is_not(None)
        )
    )
    report_paths = reports_result.scalars().all()

    await db.delete(student)
    await db.commit()

    for report_path in report_paths:
        if report_path:
            delete_generated_report(report_path)

    return {
        "message": "Estudante deletado com sucesso"
    }
