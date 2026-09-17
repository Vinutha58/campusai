from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import require_role
from app.db.mongodb import get_database
from app.models.campusgpt import (
    ChatExchange,
    ChatMessageCreate,
    ChatMessagePublic,
    ChatRole,
    new_chat_message_document,
    to_public_chat_message,
)
from app.models.user import UserPublic, UserRole
from app.services.ai import AIError, generate_reply

router = APIRouter()

SYSTEM_PROMPT = (
    "You are Career AI, a career guidance assistant for college students on the CampusAI platform. "
    "Help with career roadmaps, identifying skill gaps for target roles, interview preparation "
    "strategy, and general placement readiness advice. Be concise, practical, and encouraging. You "
    "do not have access to the student's actual courses, marks, or applications, so ask clarifying "
    "questions when you need specifics."
)

STUDENT_ONLY = Depends(require_role(UserRole.STUDENT.value))


@router.get("/messages", response_model=list[ChatMessagePublic])
async def list_messages(current_user: UserPublic = STUDENT_ONLY):
    db = get_database()
    messages = (
        await db.career_ai_messages.find({"user_id": ObjectId(current_user.id)})
        .sort("created_at", 1)
        .to_list(length=500)
    )
    return [to_public_chat_message(m) for m in messages]


@router.post("/messages", response_model=ChatExchange)
async def send_message(data: ChatMessageCreate, current_user: UserPublic = STUDENT_ONLY):
    db = get_database()
    user_doc = new_chat_message_document(current_user.id, ChatRole.USER, data.content)
    result = await db.career_ai_messages.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    history = (
        await db.career_ai_messages.find({"user_id": ObjectId(current_user.id)})
        .sort("created_at", 1)
        .to_list(length=50)
    )
    ai_messages = [{"role": m["role"], "content": m["content"]} for m in history]

    try:
        reply_text = await generate_reply(ai_messages, SYSTEM_PROMPT)
    except AIError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    assistant_doc = new_chat_message_document(current_user.id, ChatRole.ASSISTANT, reply_text)
    result = await db.career_ai_messages.insert_one(assistant_doc)
    assistant_doc["_id"] = result.inserted_id

    return ChatExchange(
        user_message=to_public_chat_message(user_doc),
        assistant_message=to_public_chat_message(assistant_doc),
    )


@router.delete("/messages", status_code=status.HTTP_204_NO_CONTENT)
async def clear_history(current_user: UserPublic = STUDENT_ONLY):
    db = get_database()
    await db.career_ai_messages.delete_many({"user_id": ObjectId(current_user.id)})
