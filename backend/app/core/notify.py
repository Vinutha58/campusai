from bson import ObjectId

from app.db.mongodb import get_database
from app.models.notification import NotificationType, new_notification_document


async def notify(user_id: str | ObjectId, type: NotificationType, title: str, body: str, link: str | None = None) -> None:
    db = get_database()
    await db.notifications.insert_one(new_notification_document(str(user_id), type, title, body, link))


async def notify_many(
    user_ids: list, type: NotificationType, title: str, body: str, link: str | None = None
) -> None:
    if not user_ids:
        return
    db = get_database()
    docs = [new_notification_document(str(uid), type, title, body, link) for uid in user_ids]
    await db.notifications.insert_many(docs)
