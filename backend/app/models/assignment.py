from datetime import datetime, timezone

from bson import ObjectId
from pydantic import BaseModel, Field


class AssignmentCreate(BaseModel):
    course_id: str
    title: str = Field(min_length=1, max_length=160)
    description: str = ""
    due_date: datetime


class AssignmentPublic(BaseModel):
    id: str
    course_id: str
    title: str
    description: str
    due_date: datetime
    created_at: datetime


class SubmissionPublic(BaseModel):
    id: str
    assignment_id: str
    student_id: str
    student_name: str
    file_name: str | None
    submitted_at: datetime
    grade: float | None
    feedback: str | None


class GradeRequest(BaseModel):
    grade: float = Field(ge=0, le=100)
    feedback: str = ""


def new_assignment_document(data: AssignmentCreate) -> dict:
    return {
        "course_id": ObjectId(data.course_id),
        "title": data.title,
        "description": data.description,
        "due_date": data.due_date,
        "created_at": datetime.now(timezone.utc),
    }


def to_public_assignment(doc: dict) -> AssignmentPublic:
    return AssignmentPublic(
        id=str(doc["_id"]),
        course_id=str(doc["course_id"]),
        title=doc["title"],
        description=doc.get("description", ""),
        due_date=doc["due_date"],
        created_at=doc["created_at"],
    )


def to_public_submission(doc: dict) -> SubmissionPublic:
    return SubmissionPublic(
        id=str(doc["_id"]),
        assignment_id=str(doc["assignment_id"]),
        student_id=str(doc["student_id"]),
        student_name=doc["student_name"],
        file_name=doc.get("file_name"),
        submitted_at=doc["submitted_at"],
        grade=doc.get("grade"),
        feedback=doc.get("feedback"),
    )
