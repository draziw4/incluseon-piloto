from fastapi import (
    Depends,
    HTTPException,
    status
)

from typing import Annotated

from dependencies import (
    get_current_user
)

from access_policy import ToolAccess, role_has_tool
from models.models import User,UserRole



def require_role(
    allowed_roles: list[UserRole]
):

    async def role_checker(
        current_user: Annotated[
            User,
            Depends(get_current_user)
        ]
    ):

        if current_user.role not in allowed_roles:

            raise HTTPException(
                status_code=
                status.HTTP_403_FORBIDDEN,

                detail=
                "Sem permissão"
            )

        return current_user

    return role_checker


def require_tool(tool: ToolAccess):
    async def tool_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ):
        if not role_has_tool(current_user.role, tool):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seu perfil profissional não possui acesso a esta ferramenta",
            )
        return current_user

    return tool_checker
