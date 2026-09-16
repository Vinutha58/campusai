from datetime import datetime, timezone

from bson import ObjectId
from pydantic import BaseModel, Field


class CourseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=1, max_length=20)
    description: str = ""


class CoursePublic(BaseModel):
    id: str
    name: str
    code: str
    description: str
    faculty_id: str
    faculty_name: str
    student_count: int
    created_at: datetime


def new_course_document(data: CourseCreate, faculty_id: str, faculty_name: str) -> dict:
    return {
        "name": data.name,
        "code": data.code.upper(),
        "description": data.description,
        "faculty_id": ObjectId(faculty_id),
        "faculty_name": faculty_name,
        "student_ids": [],
        "created_at": datetime.now(timezone.utc),
    }


def to_public_course(doc: dict) -> CoursePublic:
    return CoursePublic(
        id=str(doc["_id"]),
        name=doc["name"],
        code=doc["code"],
        description=doc.get("description", ""),
        faculty_id=str(doc["faculty_id"]),
        faculty_name=doc["faculty_name"],
        student_count=len(doc.get("student_ids", [])),
        created_at=doc["created_at"],
    )
