from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.user import UserPublic


async def get_course_or_404(course_id: str) -> dict:
    try:
        oid = ObjectId(course_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    db = get_database()
    course = await db.courses.find_one({"_id": oid})
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def ensure_owns_course(course: dict, user: UserPublic) -> None:
    if str(course["faculty_id"]) != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You don't teach this course"
        )
