from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.db.mongodb import get_database
from app.models.notification import NotificationPublic, to_public_notification
from app.models.user import UserPublic

router = APIRouter()


@router.get("", response_model=list[NotificationPublic])
async def list_notifications(current_user: UserPublic = Depends(get_current_user)):
    db = get_database()
    notifications = (
        await db.notifications.find({"user_id": ObjectId(current_user.id)})
        .sort("created_at", -1)
        .to_list(length=100)
    )
    return [to_public_notification(n) for n in notifications]


@router.get("/unread-count")
async def unread_count(current_user: UserPublic = Depends(get_current_user)):
    db = get_database()
    count = await db.notifications.count_documents(
        {"user_id": ObjectId(current_user.id), "is_read": False}
    )
    return {"count": count}


@router.post("/{notification_id}/read", response_model=NotificationPublic)
async def mark_read(notification_id: str, current_user: UserPublic = Depends(get_current_user)):
    try:
        oid = ObjectId(notification_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    db = get_database()
    notification = await db.notifications.find_one({"_id": oid, "user_id": ObjectId(current_user.id)})
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    await db.notifications.update_one({"_id": oid}, {"$set": {"is_read": True}})
    updated = await db.notifications.find_one({"_id": oid})
    return to_public_notification(updated)


@router.post("/read-all")
async def mark_all_read(current_user: UserPublic = Depends(get_current_user)):
    db = get_database()
    await db.notifications.update_many(
        {"user_id": ObjectId(current_user.id), "is_read": False}, {"$set": {"is_read": True}}
    )
    return {"status": "ok"}
