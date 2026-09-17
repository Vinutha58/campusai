from datetime import datetime, timezone
from enum import Enum

from bson import ObjectId
from pydantic import BaseModel


class NotificationType(str, Enum):
    ASSIGNMENT = "assignment"
    MATERIAL = "material"
    QUIZ = "quiz"
    MARKS = "marks"
    ATTENDANCE = "attendance"
    PLACEMENT = "placement"
    APPLICATION = "application"
    NETWORK = "network"
    MESSAGE = "message"
    SYSTEM = "system"


class NotificationPublic(BaseModel):
    id: str
    type: NotificationType
    title: str
    body: str
    link: str | None
    is_read: bool
    created_at: datetime


def new_notification_document(
    user_id: str, type: NotificationType, title: str, body: str, link: str | None = None
) -> dict:
    return {
        "user_id": ObjectId(user_id),
        "type": type.value,
        "title": title,
        "body": body,
        "link": link,
        "is_read": False,
        "created_at": datetime.now(timezone.utc),
    }


def to_public_notification(doc: dict) -> NotificationPublic:
    return NotificationPublic(
        id=str(doc["_id"]),
        type=doc["type"],
        title=doc["title"],
        body=doc["body"],
        link=doc.get("link"),
        is_read=doc.get("is_read", False),
        created_at=doc["created_at"],
    )
