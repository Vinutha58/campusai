from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import get_current_user, require_role
from app.core.ownership import ensure_owns_course, get_course_or_404
from app.db.mongodb import get_database
from app.models.marks import MarkPublic, MarkUpsert, mark_document, to_public_mark
from app.models.user import UserPublic, UserRole

router = APIRouter()


@router.post("", response_model=MarkPublic)
async def upsert_mark(
    data: MarkUpsert, current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value))
):
    course = await get_course_or_404(data.course_id)
    ensure_owns_course(course, current_user)

    db = get_database()
    student = await db.users.find_one({"_id": ObjectId(data.student_id)})
    student_name = student["name"] if student else "Unknown student"

    doc = mark_document(data, student_name)
    await db.marks.update_one(
        {
            "course_id": doc["course_id"],
            "student_id": doc["student_id"],
            "assessment_name": doc["assessment_name"],
        },
        {"$set": doc},
        upsert=True,
    )
    saved = await db.marks.find_one(
        {
            "course_id": doc["course_id"],
            "student_id": doc["student_id"],
            "assessment_name": doc["assessment_name"],
        }
    )
    return to_public_mark(saved)


@router.get("/course/{course_id}", response_model=list[MarkPublic])
async def list_course_marks(course_id: str, current_user: UserPublic = Depends(get_current_user)):
    await get_course_or_404(course_id)
    db = get_database()
    marks = await db.marks.find({"course_id": ObjectId(course_id)}).to_list(length=1000)
    return [to_public_mark(m) for m in marks]
