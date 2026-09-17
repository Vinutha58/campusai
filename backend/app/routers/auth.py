from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongodb import get_database
from app.models.user import (
    TokenResponse,
    UserLogin,
    UserPublic,
    UserRegister,
    new_user_document,
    to_public_user,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister):
    db = get_database()

    if await db.users.find_one({"email": data.email.lower()}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    doc = new_user_document(data, hash_password(data.password))
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    public_user = to_public_user(doc)
    token = create_access_token(user_id=public_user.id, name=public_user.name, role=public_user.role.value)
    return TokenResponse(access_token=token, user=public_user)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    db = get_database()
    doc = await db.users.find_one({"email": data.email.lower()})

    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password"
    )

    if doc is None or not verify_password(data.password, doc["hashed_password"]):
        raise invalid_credentials

    if not doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated"
        )

    public_user = to_public_user(doc)
    token = create_access_token(user_id=public_user.id, name=public_user.name, role=public_user.role.value)
    return TokenResponse(access_token=token, user=public_user)


@router.get("/me", response_model=UserPublic)
async def me(current_user: UserPublic = Depends(get_current_user)):
    return current_user
