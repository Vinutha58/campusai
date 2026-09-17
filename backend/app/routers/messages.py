from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.core.notify import notify
from app.db.mongodb import get_database
from app.models.message import (
    ConversationPublic,
    MessageCreate,
    MessagePublic,
    UserSearchResult,
    new_message_document,
    to_public_message,
)
from app.models.notification import NotificationType
from app.models.user import UserPublic, UserRole

router = APIRouter()


class StartConversationRequest(BaseModel):
    other_user_id: str


async def _get_conversation_or_404(conversation_id: str, current_user_id: str) -> dict:
    try:
        oid = ObjectId(conversation_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    db = get_database()
    convo = await db.conversations.find_one({"_id": oid})
    if convo is None or ObjectId(current_user_id) not in convo["participant_ids"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return convo


async def _to_public_conversation(convo: dict, viewer_id: str) -> ConversationPublic:
    db = get_database()
    other_id = next(pid for pid in convo["participant_ids"] if str(pid) != viewer_id)
    other_user = await db.users.find_one({"_id": other_id})

    last_read = convo.get("last_read", {}).get(viewer_id)
    unread_query = {"conversation_id": convo["_id"], "sender_id": {"$ne": ObjectId(viewer_id)}}
    if last_read:
        unread_query["created_at"] = {"$gt": last_read}
    unread_count = await db.messages.count_documents(unread_query)

    return ConversationPublic(
        id=str(convo["_id"]),
        other_user_id=str(other_id),
        other_user_name=other_user["name"] if other_user else "Unknown user",
        other_user_role=other_user["role"] if other_user else "unknown",
        last_message=convo.get("last_message"),
        last_message_at=convo.get("last_message_at"),
        unread_count=unread_count,
    )


@router.get("/conversations", response_model=list[ConversationPublic])
async def list_conversations(current_user: UserPublic = Depends(get_current_user)):
    db = get_database()
    convos = (
        await db.conversations.find({"participant_ids": ObjectId(current_user.id)})
        .sort("last_message_at", -1)
        .to_list(length=500)
    )
    return [await _to_public_conversation(c, current_user.id) for c in convos]


@router.post("/conversations", response_model=ConversationPublic)
async def start_conversation(
    data: StartConversationRequest, current_user: UserPublic = Depends(get_current_user)
):
    if data.other_user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can't message yourself")

    db = get_database()
    other = await db.users.find_one({"_id": ObjectId(data.other_user_id)})
    if other is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    me_oid = ObjectId(current_user.id)
    other_oid = ObjectId(data.other_user_id)

    existing = await db.conversations.find_one(
        {"participant_ids": {"$size": 2, "$all": [me_oid, other_oid]}}
    )
    if existing is None:
        result = await db.conversations.insert_one(
            {
                "participant_ids": [me_oid, other_oid],
                "last_message": None,
                "last_message_at": None,
                "last_read": {},
                "created_at": datetime.now(timezone.utc),
            }
        )
        existing = await db.conversations.find_one({"_id": result.inserted_id})

    return await _to_public_conversation(existing, current_user.id)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessagePublic])
async def get_messages(conversation_id: str, current_user: UserPublic = Depends(get_current_user)):
    convo = await _get_conversation_or_404(conversation_id, current_user.id)
    db = get_database()

    messages = (
        await db.messages.find({"conversation_id": convo["_id"]}).sort("created_at", 1).to_list(length=1000)
    )

    await db.conversations.update_one(
        {"_id": convo["_id"]}, {"$set": {f"last_read.{current_user.id}": datetime.now(timezone.utc)}}
    )

    return [to_public_message(m) for m in messages]


@router.post("/conversations/{conversation_id}/messages", response_model=MessagePublic)
async def send_message(
    conversation_id: str, data: MessageCreate, current_user: UserPublic = Depends(get_current_user)
):
    convo = await _get_conversation_or_404(conversation_id, current_user.id)
    db = get_database()

    doc = new_message_document(conversation_id, current_user.id, current_user.name, data.text)
    result = await db.messages.insert_one(doc)
    doc["_id"] = result.inserted_id

    await db.conversations.update_one(
        {"_id": convo["_id"]},
        {
            "$set": {
                "last_message": data.text,
                "last_message_at": doc["created_at"],
                f"last_read.{current_user.id}": doc["created_at"],
            }
        },
    )

    other_id = next(pid for pid in convo["participant_ids"] if str(pid) != current_user.id)
    await notify(
        other_id,
        NotificationType.MESSAGE,
        f"New message from {current_user.name}",
        data.text[:120],
        "/messages",
    )

    return to_public_message(doc)


@router.get("/search", response_model=list[UserSearchResult])
async def search_users(q: str, current_user: UserPublic = Depends(get_current_user)):
    if len(q.strip()) < 2:
        return []

    db = get_database()
    users = (
        await db.users.find(
            {
                "_id": {"$ne": ObjectId(current_user.id)},
                "role": {"$ne": UserRole.ADMIN.value},
                "$or": [
                    {"name": {"$regex": q, "$options": "i"}},
                    {"email": {"$regex": q, "$options": "i"}},
                ],
            }
        )
        .limit(20)
        .to_list(length=20)
    )
    return [
        UserSearchResult(id=str(u["_id"]), name=u["name"], email=u["email"], role=u["role"]) for u in users
    ]
