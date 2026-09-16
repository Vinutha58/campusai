from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.deps import get_current_user, require_role
from app.core.ownership import ensure_owns_course, get_course_or_404
from app.db.mongodb import get_database
from app.models.course import CourseCreate, CoursePublic, new_course_document, to_public_course
from app.models.user import UserPublic, UserRole

router = APIRouter()


class AddStudentRequest(BaseModel):
    email: EmailStr


@router.post("", response_model=CoursePublic, status_code=status.HTTP_201_CREATED)
async def create_course(
    data: CourseCreate, current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value))
):
    db = get_database()
    doc = new_course_document(data, current_user.id, current_user.name)
    result = await db.courses.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_public_course(doc)


@router.get("/mine", response_model=list[CoursePublic])
async def list_my_courses(current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value))):
    db = get_database()
    courses = await db.courses.find({"faculty_id": ObjectId(current_user.id)}).to_list(length=200)
    return [to_public_course(c) for c in courses]


@router.get("/enrolled", response_model=list[CoursePublic])
async def list_enrolled_courses(current_user: UserPublic = Depends(get_current_user)):
    db = get_database()
    courses = await db.courses.find({"student_ids": ObjectId(current_user.id)}).to_list(length=200)
    return [to_public_course(c) for c in courses]


@router.post("/{course_id}/students", response_model=CoursePublic)
async def add_student(
    course_id: str,
    body: AddStudentRequest,
    current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value)),
):
    course = await get_course_or_404(course_id)
    ensure_owns_course(course, current_user)

    db = get_database()
    student = await db.users.find_one({"email": body.email.lower(), "role": UserRole.STUDENT.value})
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No student with that email")

    await db.courses.update_one({"_id": course["_id"]}, {"$addToSet": {"student_ids": student["_id"]}})
    updated = await db.courses.find_one({"_id": course["_id"]})
    return to_public_course(updated)


@router.delete("/{course_id}/students/{student_id}", response_model=CoursePublic)
async def remove_student(
    course_id: str,
    student_id: str,
    current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value)),
):
    course = await get_course_or_404(course_id)
    ensure_owns_course(course, current_user)

    db = get_database()
    await db.courses.update_one(
        {"_id": course["_id"]}, {"$pull": {"student_ids": ObjectId(student_id)}}
    )
    updated = await db.courses.find_one({"_id": course["_id"]})
    return to_public_course(updated)


@router.get("/{course_id}/roster")
async def get_roster(
    course_id: str, current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value))
):
    course = await get_course_or_404(course_id)
    ensure_owns_course(course, current_user)

    db = get_database()
    students = await db.users.find({"_id": {"$in": course.get("student_ids", [])}}).to_list(length=500)
    return [{"id": str(s["_id"]), "name": s["name"], "email": s["email"]} for s in students]
