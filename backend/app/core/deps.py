from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt

from app.core.security import decode_access_token
from app.db.mongodb import get_database
from app.models.user import UserPublic, to_public_user

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UserPublic:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = ObjectId(payload["sub"])
    except (jwt.PyJWTError, InvalidId, KeyError):
        raise unauthorized

    db = get_database()
    user_doc = await db.users.find_one({"_id": user_id})
    if user_doc is None:
        raise unauthorized

    return to_public_user(user_doc)


def require_role(*roles: str):
    async def check(current_user: UserPublic = Depends(get_current_user)) -> UserPublic:
        if current_user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to do that",
            )
        return current_user

    return check
