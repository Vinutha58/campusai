from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.core.notify import notify
from app.core.ownership import ensure_owns_course, get_course_or_404
from app.db.mongodb import get_database
from app.models.attendance import (
    AttendanceMarkRequest,
    AttendancePublic,
    attendance_document,
    to_public_attendance,
)
from app.models.notification import NotificationType
from app.models.user import UserPublic, UserRole

router = APIRouter()


@router.post("/mark", response_model=AttendancePublic)
async def mark_attendance(
    data: AttendanceMarkRequest,
    current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value)),
):
    course = await get_course_or_404(data.course_id)
    ensure_owns_course(course, current_user)

    db = get_database()
    doc = attendance_document(data)
    await db.attendance.update_one(
        {"course_id": ObjectId(data.course_id), "date": doc["date"]},
        {"$set": doc},
        upsert=True,
    )
    saved = await db.attendance.find_one(
        {"course_id": ObjectId(data.course_id), "date": doc["date"]}
    )

    for entry in data.records:
        if not entry.present:
            await notify(
                entry.student_id,
                NotificationType.ATTENDANCE,
                "Marked absent",
                f"You were marked absent for {course['name']} on {data.date.strftime('%b %d, %Y')}.",
                "/attendance",
            )

    return to_public_attendance(saved)


@router.get("/course/{course_id}", response_model=list[AttendancePublic])
async def list_attendance(
    course_id: str, current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value))
):
    course = await get_course_or_404(course_id)
    ensure_owns_course(course, current_user)

    db = get_database()
    records = (
        await db.attendance.find({"course_id": ObjectId(course_id)}).sort("date", -1).to_list(length=200)
    )
    return [to_public_attendance(r) for r in records]
