from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.db.mongodb import get_database
from app.models.network import (
    CommentCreate,
    PostCreate,
    PostPublic,
    ProfilePublic,
    ProfileUpdate,
    new_post_document,
    to_public_post,
    to_public_profile,
)
from app.models.user import UserPublic

router = APIRouter()


async def _get_user_doc_or_404(user_id: str) -> dict:
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db = get_database()
    doc = await db.users.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return doc


async def _get_viewer_following(viewer_id: str) -> set:
    viewer = await _get_user_doc_or_404(viewer_id)
    return set(viewer.get("following", []))


@router.get("/profile/me", response_model=ProfilePublic)
async def get_my_profile(current_user: UserPublic = Depends(get_current_user)):
    doc = await _get_user_doc_or_404(current_user.id)
    return to_public_profile(doc, current_user.id, set(doc.get("following", [])))


@router.put("/profile/me", response_model=ProfilePublic)
async def update_my_profile(
    data: ProfileUpdate, current_user: UserPublic = Depends(get_current_user)
):
    db = get_database()
    await db.users.update_one({"_id": ObjectId(current_user.id)}, {"$set": data.model_dump()})
    doc = await _get_user_doc_or_404(current_user.id)
    return to_public_profile(doc, current_user.id, set(doc.get("following", [])))


@router.get("/profile/{user_id}", response_model=ProfilePublic)
async def get_profile(user_id: str, current_user: UserPublic = Depends(get_current_user)):
    doc = await _get_user_doc_or_404(user_id)
    viewer_following = await _get_viewer_following(current_user.id)
    return to_public_profile(doc, current_user.id, viewer_following)


@router.get("/people", response_model=list[ProfilePublic])
async def discover_people(current_user: UserPublic = Depends(get_current_user)):
    db = get_database()
    users = (
        await db.users.find({"_id": {"$ne": ObjectId(current_user.id)}})
        .sort("name", 1)
        .to_list(length=1000)
    )
    viewer_following = await _get_viewer_following(current_user.id)
    return [to_public_profile(u, current_user.id, viewer_following) for u in users]


@router.post("/follow/{user_id}", response_model=ProfilePublic)
async def follow_user(user_id: str, current_user: UserPublic = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can't follow yourself")

    target = await _get_user_doc_or_404(user_id)
    db = get_database()
    me = await db.users.find_one({"_id": ObjectId(current_user.id)})

    if ObjectId(user_id) not in me.get("following", []):
        await db.users.update_one(
            {"_id": ObjectId(current_user.id)}, {"$addToSet": {"following": ObjectId(user_id)}}
        )
        await db.users.update_one({"_id": target["_id"]}, {"$inc": {"followers_count": 1}})

    updated = await _get_user_doc_or_404(user_id)
    viewer_following = await _get_viewer_following(current_user.id)
    return to_public_profile(updated, current_user.id, viewer_following)


@router.delete("/follow/{user_id}", response_model=ProfilePublic)
async def unfollow_user(user_id: str, current_user: UserPublic = Depends(get_current_user)):
    target = await _get_user_doc_or_404(user_id)
    db = get_database()
    me = await db.users.find_one({"_id": ObjectId(current_user.id)})

    if ObjectId(user_id) in me.get("following", []):
        await db.users.update_one(
            {"_id": ObjectId(current_user.id)}, {"$pull": {"following": ObjectId(user_id)}}
        )
        await db.users.update_one({"_id": target["_id"]}, {"$inc": {"followers_count": -1}})

    updated = await _get_user_doc_or_404(user_id)
    viewer_following = await _get_viewer_following(current_user.id)
    return to_public_profile(updated, current_user.id, viewer_following)


@router.get("/feed", response_model=list[PostPublic])
async def get_feed(current_user: UserPublic = Depends(get_current_user)):
    db = get_database()
    posts = await db.posts.find().sort("created_at", -1).to_list(length=500)
    return [to_public_post(p, current_user.id) for p in posts]


@router.post("/posts", response_model=PostPublic, status_code=status.HTTP_201_CREATED)
async def create_post(data: PostCreate, current_user: UserPublic = Depends(get_current_user)):
    db = get_database()
    doc = new_post_document(current_user.id, current_user.name, current_user.role.value, data)
    result = await db.posts.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_public_post(doc, current_user.id)


async def _get_post_or_404(post_id: str) -> dict:
    try:
        oid = ObjectId(post_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    db = get_database()
    post = await db.posts.find_one({"_id": oid})
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str, current_user: UserPublic = Depends(get_current_user)):
    post = await _get_post_or_404(post_id)
    is_owner = str(post["author_id"]) == current_user.id
    is_moderator = current_user.role.value == "admin"
    if not is_owner and not is_moderator:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own posts")
    db = get_database()
    await db.posts.delete_one({"_id": post["_id"]})


@router.post("/posts/{post_id}/like", response_model=PostPublic)
async def toggle_like(post_id: str, current_user: UserPublic = Depends(get_current_user)):
    post = await _get_post_or_404(post_id)
    db = get_database()
    liked_by = post.get("liked_by", [])
    me = ObjectId(current_user.id)

    if me in liked_by:
        await db.posts.update_one({"_id": post["_id"]}, {"$pull": {"liked_by": me}})
    else:
        await db.posts.update_one({"_id": post["_id"]}, {"$addToSet": {"liked_by": me}})

    updated = await _get_post_or_404(post_id)
    return to_public_post(updated, current_user.id)


@router.post("/posts/{post_id}/comments", response_model=PostPublic)
async def add_comment(
    post_id: str, data: CommentCreate, current_user: UserPublic = Depends(get_current_user)
):
    post = await _get_post_or_404(post_id)
    db = get_database()
    comment = {
        "_id": ObjectId(),
        "author_id": ObjectId(current_user.id),
        "author_name": current_user.name,
        "text": data.text,
        "created_at": datetime.now(timezone.utc),
    }
    await db.posts.update_one({"_id": post["_id"]}, {"$push": {"comments": comment}})
    updated = await _get_post_or_404(post_id)
    return to_public_post(updated, current_user.id)
