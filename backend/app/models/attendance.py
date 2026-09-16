from datetime import date, datetime, timezone

from bson import ObjectId
from pydantic import BaseModel


class AttendanceEntry(BaseModel):
    student_id: str
    present: bool


class AttendanceMarkRequest(BaseModel):
    course_id: str
    date: date
    records: list[AttendanceEntry]


class AttendancePublic(BaseModel):
    id: str
    course_id: str
    date: date
    records: list[AttendanceEntry]


def attendance_document(data: AttendanceMarkRequest) -> dict:
    return {
        "course_id": ObjectId(data.course_id),
        "date": data.date.isoformat(),
        "records": [r.model_dump() for r in data.records],
        "updated_at": datetime.now(timezone.utc),
    }


def to_public_attendance(doc: dict) -> AttendancePublic:
    return AttendancePublic(
        id=str(doc["_id"]),
        course_id=str(doc["course_id"]),
        date=date.fromisoformat(doc["date"]),
        records=[AttendanceEntry(**r) for r in doc["records"]],
    )
