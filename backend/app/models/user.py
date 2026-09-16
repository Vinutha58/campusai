from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    PLACEMENT_OFFICER = "placement_officer"
    ADMIN = "admin"


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


def new_user_document(data: UserRegister, hashed_password: str) -> dict:
    return {
        "name": data.name,
        "email": data.email.lower(),
        "hashed_password": hashed_password,
        "role": data.role.value,
        "created_at": datetime.now(timezone.utc),
    }


def to_public_user(doc: dict) -> UserPublic:
    return UserPublic(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        role=doc["role"],
        created_at=doc["created_at"],
    )
