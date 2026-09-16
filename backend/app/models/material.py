from datetime import datetime, timezone

from bson import ObjectId
from pydantic import BaseModel


class MaterialPublic(BaseModel):
    id: str
    course_id: str
    title: str
    file_name: str
    uploaded_at: datetime


def new_material_document(course_id: str, title: str, file_name: str, stored_name: str) -> dict:
    return {
        "course_id": ObjectId(course_id),
        "title": title,
        "file_name": file_name,
        "stored_name": stored_name,
        "uploaded_at": datetime.now(timezone.utc),
    }


def to_public_material(doc: dict) -> MaterialPublic:
    return MaterialPublic(
        id=str(doc["_id"]),
        course_id=str(doc["course_id"]),
        title=doc["title"],
        file_name=doc["file_name"],
        uploaded_at=doc["uploaded_at"],
    )
