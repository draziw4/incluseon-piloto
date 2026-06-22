from pydantic import BaseModel

class Token(BaseModel):
    token_type: str = "cookie"





class RefreshTokenRequest(
    BaseModel
):
    refresh_token: str | None = None
