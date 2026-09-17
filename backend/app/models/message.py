from datetime import datetime, timezone

from bson import ObjectId
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class MessagePublic(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    text: str
    created_at: datetime


class ConversationPublic(BaseModel):
    id: str
    other_user_id: str
    other_user_name: str
    other_user_role: str
    last_message: str | None
    last_message_at: datetime | None
    unread_count: int


class UserSearchResult(BaseModel):
    id: str
    name: str
    email: str
    role: str


def to_public_message(doc: dict) -> MessagePublic:
    return MessagePublic(
        id=str(doc["_id"]),
        conversation_id=str(doc["conversation_id"]),
        sender_id=str(doc["sender_id"]),
        sender_name=doc["sender_name"],
        text=doc["text"],
        created_at=doc["created_at"],
    )


def new_message_document(conversation_id: str, sender_id: str, sender_name: str, text: str) -> dict:
    return {
        "conversation_id": ObjectId(conversation_id),
        "sender_id": ObjectId(sender_id),
        "sender_name": sender_name,
        "text": text,
        "created_at": datetime.now(timezone.utc),
    }
