from datetime import datetime, timezone

from pydantic import BaseModel, Field


class RoadmapGenerate(BaseModel):
    target_role: str = Field(min_length=1, max_length=160)
    notes: str = ""


class RoadmapPublic(BaseModel):
    target_role: str
    content: str
    generated_at: datetime


def roadmap_document(user_id: str, target_role: str, content: str) -> dict:
    return {
        "_id": user_id,
        "target_role": target_role,
        "content": content,
        "generated_at": datetime.now(timezone.utc),
    }


def to_public_roadmap(doc: dict) -> RoadmapPublic:
    return RoadmapPublic(
        target_role=doc["target_role"],
        content=doc["content"],
        generated_at=doc["generated_at"],
    )
