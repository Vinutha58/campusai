from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.db.mongodb import get_database
from app.models.user import UserPublic, UserRole, to_public_user

router = APIRouter()


@router.get("", response_model=list[UserPublic])
async def list_students(
    current_user: UserPublic = Depends(
        require_role(UserRole.PLACEMENT_OFFICER.value, UserRole.ADMIN.value)
    ),
):
    db = get_database()
    students = (
        await db.users.find({"role": UserRole.STUDENT.value}).sort("name", 1).to_list(length=1000)
    )
    return [to_public_user(s) for s in students]
