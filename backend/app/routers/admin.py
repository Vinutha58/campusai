from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import require_role
from app.db.mongodb import get_database
from app.models.admin import (
    AcademicAnalytics,
    AIConfigInput,
    AIConfigPublic,
    PlatformAnalytics,
    PlatformSettingsInput,
    PlatformSettingsPublic,
    ai_config_document,
    to_public_ai_config,
    to_public_settings,
)
from app.models.user import ActiveUpdate, RoleUpdate, UserPublic, UserRole, to_public_user

router = APIRouter()

ADMIN_ONLY = Depends(require_role(UserRole.ADMIN.value))


@router.get("/users", response_model=list[UserPublic])
async def list_users(role: UserRole | None = None, current_user: UserPublic = ADMIN_ONLY):
    db = get_database()
    query = {"role": role.value} if role else {}
    users = await db.users.find(query).sort("name", 1).to_list(length=2000)
    return [to_public_user(u) for u in users]


async def _get_user_or_404(user_id: str) -> dict:
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db = get_database()
    user = await db.users.find_one({"_id": oid})
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/users/{user_id}/role", response_model=UserPublic)
async def update_role(user_id: str, data: RoleUpdate, current_user: UserPublic = ADMIN_ONLY):
    user = await _get_user_or_404(user_id)
    db = get_database()
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"role": data.role.value}})
    updated = await db.users.find_one({"_id": user["_id"]})
    return to_public_user(updated)


@router.patch("/users/{user_id}/active", response_model=UserPublic)
async def update_active(user_id: str, data: ActiveUpdate, current_user: UserPublic = ADMIN_ONLY):
    user = await _get_user_or_404(user_id)
    if str(user["_id"]) == current_user.id and not data.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="You can't deactivate your own account"
        )
    db = get_database()
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"is_active": data.is_active}})
    updated = await db.users.find_one({"_id": user["_id"]})
    return to_public_user(updated)


@router.get("/analytics/academic", response_model=AcademicAnalytics)
async def academic_analytics(current_user: UserPublic = ADMIN_ONLY):
    db = get_database()

    total_courses = await db.courses.count_documents({})
    total_students = await db.users.count_documents({"role": UserRole.STUDENT.value})
    total_faculty = await db.users.count_documents({"role": UserRole.FACULTY.value})
    total_assignments = await db.assignments.count_documents({})
    total_quizzes = await db.quizzes.count_documents({})

    attendance_records = await db.attendance.find().to_list(length=5000)
    if attendance_records:
        percents = []
        for r in attendance_records:
            recs = r.get("records", [])
            if recs:
                present = sum(1 for x in recs if x.get("present"))
                percents.append(present / len(recs) * 100)
        avg_attendance = round(sum(percents) / len(percents), 1) if percents else 0.0
    else:
        avg_attendance = 0.0

    return AcademicAnalytics(
        total_courses=total_courses,
        total_students=total_students,
        total_faculty=total_faculty,
        total_assignments=total_assignments,
        total_quizzes=total_quizzes,
        avg_attendance_percent=avg_attendance,
    )


@router.get("/analytics/platform", response_model=PlatformAnalytics)
async def platform_analytics(current_user: UserPublic = ADMIN_ONLY):
    db = get_database()
    return PlatformAnalytics(
        students=await db.users.count_documents({"role": UserRole.STUDENT.value}),
        faculty=await db.users.count_documents({"role": UserRole.FACULTY.value}),
        placement_officers=await db.users.count_documents({"role": UserRole.PLACEMENT_OFFICER.value}),
        admins=await db.users.count_documents({"role": UserRole.ADMIN.value}),
        total_courses=await db.courses.count_documents({}),
        total_companies=await db.companies.count_documents({}),
        total_drives=await db.drives.count_documents({}),
        total_applications=await db.applications.count_documents({}),
    )


@router.get("/settings", response_model=PlatformSettingsPublic)
async def get_settings(current_user: UserPublic = ADMIN_ONLY):
    db = get_database()
    doc = await db.settings.find_one({"_id": "platform_settings"})
    return to_public_settings(doc)


@router.put("/settings", response_model=PlatformSettingsPublic)
async def update_settings(data: PlatformSettingsInput, current_user: UserPublic = ADMIN_ONLY):
    db = get_database()
    await db.settings.update_one(
        {"_id": "platform_settings"},
        {"$set": {**data.model_dump(), "_id": "platform_settings"}},
        upsert=True,
    )
    doc = await db.settings.find_one({"_id": "platform_settings"})
    return to_public_settings(doc)


@router.get("/ai-config", response_model=AIConfigPublic)
async def get_ai_config(current_user: UserPublic = ADMIN_ONLY):
    db = get_database()
    doc = await db.settings.find_one({"_id": "ai_config"})
    return to_public_ai_config(doc)


@router.put("/ai-config", response_model=AIConfigPublic)
async def update_ai_config(data: AIConfigInput, current_user: UserPublic = ADMIN_ONLY):
    db = get_database()
    existing = await db.settings.find_one({"_id": "ai_config"})
    existing_key = existing.get("api_key") if existing else None
    doc = ai_config_document(data, existing_key)
    await db.settings.update_one({"_id": "ai_config"}, {"$set": doc}, upsert=True)
    saved = await db.settings.find_one({"_id": "ai_config"})
    return to_public_ai_config(saved)
