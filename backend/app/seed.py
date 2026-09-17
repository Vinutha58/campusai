"""Creates a handful of demo accounts across all 4 roles, so the app can be
tried out as multiple distinct people instead of one shared login per role.
Safe to re-run — skips any email that already exists.

Usage (from backend/, with the venv): python -m app.seed
"""

import asyncio
from datetime import datetime, timedelta, timezone

from app.core.security import hash_password
from app.db.mongodb import get_database
from app.models.application import ApplicationStatus
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
    await seed_placements(db)


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


SEED_COMPANIES = [
    {
        "name": "TechNova Solutions",
        "description": "Product-based software company building developer tools.",
        "industry": "Software",
        "website": "https://technova.example.com",
        "location": "Bengaluru",
    },
    {
        "name": "Orbit Systems",
        "description": "Data and analytics consultancy.",
        "industry": "Data & Analytics",
        "website": "https://orbitsystems.example.com",
        "location": "Remote",
    },
]

SEED_DRIVES = [
    {
        "company_name": "TechNova Solutions",
        "job_role": "Software Engineer",
        "package": "12 LPA",
        "location": "Bengaluru (on-campus)",
        "eligibility": {"min_cgpa": 7.0, "branches": ["CSE", "IT"], "min_year": 3, "max_backlogs": 0},
        "deadline_days_from_now": 14,
        "applicants": ["student1@campusai.edu"],
    },
    {
        "company_name": "Orbit Systems",
        "job_role": "Data Analyst",
        "package": "9 LPA",
        "location": "Remote",
        "eligibility": {"min_cgpa": 6.5, "branches": ["CSE", "IT", "ECE"], "min_year": 3, "max_backlogs": 1},
        "deadline_days_from_now": 21,
        "applicants": [],
    },
]


async def seed_placements(db) -> None:
    for entry in SEED_COMPANIES:
        if await db.companies.find_one({"name": entry["name"]}):
            print(f"skip (already exists): {entry['name']}")
            continue
        await db.companies.insert_one({**entry, "created_at": datetime.now(timezone.utc)})
        print(f"created company: {entry['name']}")

    for entry in SEED_DRIVES:
        if await db.drives.find_one({"company_name": entry["company_name"], "job_role": entry["job_role"]}):
            print(f"skip (already exists): {entry['company_name']} - {entry['job_role']}")
            continue

        company = await db.companies.find_one({"name": entry["company_name"]})
        deadline = datetime.now(timezone.utc) + timedelta(days=entry["deadline_days_from_now"])
        result = await db.drives.insert_one(
            {
                "company_id": company["_id"],
                "company_name": entry["company_name"],
                "job_role": entry["job_role"],
                "package": entry["package"],
                "location": entry["location"],
                "eligibility": entry["eligibility"],
                "application_deadline": deadline,
                "drive_date": None,
                "created_at": datetime.now(timezone.utc),
            }
        )
        print(f"created drive: {entry['company_name']} - {entry['job_role']}")

        for email in entry["applicants"]:
            student = await db.users.find_one({"email": email})
            if not student:
                continue
            await db.applications.insert_one(
                {
                    "drive_id": result.inserted_id,
                    "company_name": entry["company_name"],
                    "job_role": entry["job_role"],
                    "student_id": student["_id"],
                    "student_name": student["name"],
                    "student_email": student["email"],
                    "status": ApplicationStatus.APPLIED.value,
                    "applied_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
            )
            print(f"  applied: {email}")


if __name__ == "__main__":
    asyncio.run(seed())
