from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import get_current_user, require_role
from app.core.lookups import get_application_or_404, get_drive_or_404
from app.db.mongodb import get_database
from app.models.application import ApplicationPublic, StatusUpdate, to_public_application
from app.models.user import UserPublic, UserRole

router = APIRouter()


@router.get("/mine", response_model=list[ApplicationPublic])
async def my_applications(current_user: UserPublic = Depends(require_role(UserRole.STUDENT.value))):
    db = get_database()
    applications = (
        await db.applications.find({"student_id": ObjectId(current_user.id)})
        .sort("applied_at", -1)
        .to_list(length=200)
    )
    return [to_public_application(a) for a in applications]


@router.get("/drive/{drive_id}", response_model=list[ApplicationPublic])
async def applications_for_drive(
    drive_id: str,
    current_user: UserPublic = Depends(require_role(UserRole.PLACEMENT_OFFICER.value)),
):
    await get_drive_or_404(drive_id)
    db = get_database()
    applications = await db.applications.find({"drive_id": ObjectId(drive_id)}).to_list(length=1000)
    return [to_public_application(a) for a in applications]


@router.patch("/{application_id}/status", response_model=ApplicationPublic)
async def update_status(
    application_id: str,
    data: StatusUpdate,
    current_user: UserPublic = Depends(require_role(UserRole.PLACEMENT_OFFICER.value)),
):
    application = await get_application_or_404(application_id)
    db = get_database()
    await db.applications.update_one(
        {"_id": application["_id"]},
        {"$set": {"status": data.status.value, "updated_at": datetime.now(timezone.utc)}},
    )
    updated = await db.applications.find_one({"_id": application["_id"]})
    return to_public_application(updated)
