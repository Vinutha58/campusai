from datetime import datetime, timezone

from bson import ObjectId
from pydantic import BaseModel, Field


class MarkUpsert(BaseModel):
    course_id: str
    student_id: str
    assessment_name: str = Field(min_length=1, max_length=120)
    score: float = Field(ge=0)
    max_score: float = Field(gt=0)


class MarkPublic(BaseModel):
    id: str
    course_id: str
    student_id: str
    student_name: str
    assessment_name: str
    score: float
    max_score: float
    updated_at: datetime


def to_public_mark(doc: dict) -> MarkPublic:
    return MarkPublic(
        id=str(doc["_id"]),
        course_id=str(doc["course_id"]),
        student_id=str(doc["student_id"]),
        student_name=doc["student_name"],
        assessment_name=doc["assessment_name"],
        score=doc["score"],
        max_score=doc["max_score"],
        updated_at=doc["updated_at"],
    )


def mark_document(data: MarkUpsert, student_name: str) -> dict:
    return {
        "course_id": ObjectId(data.course_id),
        "student_id": ObjectId(data.student_id),
        "student_name": student_name,
        "assessment_name": data.assessment_name,
        "score": data.score,
        "max_score": data.max_score,
        "updated_at": datetime.now(timezone.utc),
    }
