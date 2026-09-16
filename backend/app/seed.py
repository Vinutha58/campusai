"""Creates a handful of demo accounts across all 4 roles, so the app can be
tried out as multiple distinct people instead of one shared login per role.
Safe to re-run — skips any email that already exists.

Usage (from backend/, with the venv): python -m app.seed
"""

import asyncio
from datetime import datetime, timezone

from app.core.security import hash_password
from app.db.mongodb import get_database
from app.models.user import UserRegister, new_user_document

SEED_USERS = [
    {"name": "Aditi Sharma", "email": "student1@campusai.edu", "password": "Student@123", "role": "student"},
    {"name": "Rohit Sharma", "email": "student2@campusai.edu", "password": "Student@123", "role": "student"},
    {"name": "Dr. Rajesh Kumar", "email": "faculty1@campusai.edu", "password": "Faculty@123", "role": "faculty"},
    {"name": "Dr. Kavya Nair", "email": "faculty2@campusai.edu", "password": "Faculty@123", "role": "faculty"},
    {
        "name": "Meera Iyer",
        "email": "placement1@campusai.edu",
        "password": "Placement@123",
        "role": "placement_officer",
    },
    {"name": "Admin User", "email": "admin1@campusai.edu", "password": "Admin@123", "role": "admin"},
]


async def seed() -> None:
    db = get_database()
    await db.users.create_index("email", unique=True)

    for entry in SEED_USERS:
        if await db.users.find_one({"email": entry["email"]}):
            print(f"skip (already exists): {entry['email']}")
            continue

        data = UserRegister(
            name=entry["name"], email=entry["email"], password=entry["password"], role=entry["role"]
        )
        doc = new_user_document(data, hash_password(entry["password"]))
        await db.users.insert_one(doc)
        print(f"created: {entry['email']} ({entry['role']})")

    await seed_courses(db)


SEED_COURSES = [
    {
        "name": "Data Structures",
        "code": "CS201",
        "faculty_email": "faculty1@campusai.edu",
        "student_emails": ["student1@campusai.edu", "student2@campusai.edu"],
    },
    {
        "name": "Database Systems",
        "code": "CS304",
        "faculty_email": "faculty2@campusai.edu",
        "student_emails": ["student1@campusai.edu"],
    },
]


async def seed_courses(db) -> None:
    for entry in SEED_COURSES:
        if await db.courses.find_one({"code": entry["code"]}):
            print(f"skip (already exists): {entry['code']}")
            continue

        faculty = await db.users.find_one({"email": entry["faculty_email"]})
        students = await db.users.find(
            {"email": {"$in": entry["student_emails"]}}
        ).to_list(length=50)

        await db.courses.insert_one(
            {
                "name": entry["name"],
                "code": entry["code"],
                "description": "",
                "faculty_id": faculty["_id"],
                "faculty_name": faculty["name"],
                "student_ids": [s["_id"] for s in students],
                "created_at": datetime.now(timezone.utc),
            }
        )
        print(f"created course: {entry['code']} ({entry['name']})")


if __name__ == "__main__":
    asyncio.run(seed())
