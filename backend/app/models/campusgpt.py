from datetime import datetime, timezone
from enum import Enum

from bson import ObjectId
from pydantic import BaseModel


class ChatRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessagePublic(BaseModel):
    id: str
    role: ChatRole
    content: str
    created_at: datetime


class ChatMessageCreate(BaseModel):
    content: str


class ChatExchange(BaseModel):
    user_message: ChatMessagePublic
    assistant_message: ChatMessagePublic


def new_chat_message_document(user_id: str, role: ChatRole, content: str) -> dict:
    return {
        "user_id": ObjectId(user_id),
        "role": role.value,
        "content": content,
        "created_at": datetime.now(timezone.utc),
    }


def to_public_chat_message(doc: dict) -> ChatMessagePublic:
    return ChatMessagePublic(
        id=str(doc["_id"]),
        role=doc["role"],
        content=doc["content"],
        created_at=doc["created_at"],
    )
