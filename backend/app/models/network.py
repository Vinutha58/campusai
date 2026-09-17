from datetime import datetime, timezone
from enum import Enum

from bson import ObjectId
from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    bio: str = ""
    skills: list[str] = []
    certifications: list[str] = []
    achievements: list[str] = []


class ProfilePublic(BaseModel):
    id: str
    name: str
    email: str
    role: str
    bio: str
    skills: list[str]
    certifications: list[str]
    achievements: list[str]
    followers_count: int
    following_count: int
    is_following: bool
    is_me: bool


class PostCategory(str, Enum):
    GENERAL = "general"
    ACHIEVEMENT = "achievement"
    CERTIFICATION = "certification"
    INTERNSHIP = "internship"
    PLACEMENT = "placement"
    ACADEMIC = "academic"


class PostCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    category: PostCategory = PostCategory.GENERAL


class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class CommentPublic(BaseModel):
    id: str
    author_id: str
    author_name: str
    text: str
    created_at: datetime


class PostPublic(BaseModel):
    id: str
    author_id: str
    author_name: str
    author_role: str
    content: str
    category: PostCategory
    like_count: int
    liked_by_me: bool
    comments: list[CommentPublic]
    created_at: datetime


def to_public_profile(doc: dict, viewer_id: str, viewer_following: set) -> ProfilePublic:
    """`viewer_following` is the *viewer's* own following set (their user doc's
    `following` array) — is_following means "does the viewer follow this
    profile", which is the opposite of checking this profile's own following
    list."""
    return ProfilePublic(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        role=doc["role"],
        bio=doc.get("bio", ""),
        skills=doc.get("skills", []),
        certifications=doc.get("certifications", []),
        achievements=doc.get("achievements", []),
        followers_count=doc.get("followers_count", 0),
        following_count=len(doc.get("following", [])),
        is_following=doc["_id"] in viewer_following,
        is_me=str(doc["_id"]) == viewer_id,
    )


def new_post_document(author_id: str, author_name: str, author_role: str, data: PostCreate) -> dict:
    return {
        "author_id": ObjectId(author_id),
        "author_name": author_name,
        "author_role": author_role,
        "content": data.content,
        "category": data.category.value,
        "liked_by": [],
        "comments": [],
        "created_at": datetime.now(timezone.utc),
    }


def to_public_post(doc: dict, viewer_id: str) -> PostPublic:
    liked_by = doc.get("liked_by", [])
    comments = [
        CommentPublic(
            id=str(c.get("_id", ObjectId())),
            author_id=str(c["author_id"]),
            author_name=c["author_name"],
            text=c["text"],
            created_at=c["created_at"],
        )
        for c in doc.get("comments", [])
    ]
    return PostPublic(
        id=str(doc["_id"]),
        author_id=str(doc["author_id"]),
        author_name=doc["author_name"],
        author_role=doc["author_role"],
        content=doc["content"],
        category=doc["category"],
        like_count=len(liked_by),
        liked_by_me=ObjectId(viewer_id) in liked_by,
        comments=comments,
        created_at=doc["created_at"],
    )
