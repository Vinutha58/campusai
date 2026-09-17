import re

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.db.mongodb import get_database
from app.models.search import SearchResult
from app.models.user import UserPublic, UserRole

router = APIRouter()

LIMIT = 6


def _rx(q: str) -> dict:
    return {"$regex": re.escape(q), "$options": "i"}


@router.get("", response_model=list[SearchResult])
async def search(q: str, current_user: UserPublic = Depends(get_current_user)):
    q = q.strip()
    if len(q) < 2:
        return []

    db = get_database()
    rx = _rx(q)
    role = current_user.role.value
    results: list[SearchResult] = []

    can_view_profile = role in (UserRole.STUDENT.value, UserRole.ADMIN.value)
    people = (
        await db.users.find(
            {"_id": {"$ne": ObjectId(current_user.id)}, "$or": [{"name": rx}, {"skills": rx}, {"certifications": rx}]}
        )
        .limit(LIMIT)
        .to_list(length=LIMIT)
    )
    for p in people:
        results.append(
            SearchResult(
                id=str(p["_id"]),
                category="people",
                title=p["name"],
                subtitle=p["role"].replace("_", " ").title(),
                link=f"/network/{p['_id']}" if can_view_profile else None,
            )
        )

    course_query = None
    if role == UserRole.STUDENT.value:
        course_query = {"student_ids": ObjectId(current_user.id), "$or": [{"name": rx}, {"code": rx}]}
    elif role == UserRole.FACULTY.value:
        course_query = {"faculty_id": ObjectId(current_user.id), "$or": [{"name": rx}, {"code": rx}]}
    elif role == UserRole.ADMIN.value:
        course_query = {"$or": [{"name": rx}, {"code": rx}]}

    if course_query is not None:
        courses = await db.courses.find(course_query).limit(LIMIT).to_list(length=LIMIT)
        for c in courses:
            results.append(
                SearchResult(id=str(c["_id"]), category="courses", title=c["name"], subtitle=c["code"], link="/courses")
            )

    if role in (UserRole.PLACEMENT_OFFICER.value, UserRole.ADMIN.value):
        companies = await db.companies.find({"name": rx}).limit(LIMIT).to_list(length=LIMIT)
        for c in companies:
            results.append(
                SearchResult(
                    id=str(c["_id"]),
                    category="companies",
                    title=c["name"],
                    subtitle=c.get("industry") or "Company",
                    link="/companies",
                )
            )

    if role in (UserRole.STUDENT.value, UserRole.PLACEMENT_OFFICER.value, UserRole.ADMIN.value):
        drives = (
            await db.drives.find({"$or": [{"job_role": rx}, {"company_name": rx}]}).limit(LIMIT).to_list(length=LIMIT)
        )
        link = "/drives" if role == UserRole.PLACEMENT_OFFICER.value else "/placements"
        for d in drives:
            results.append(
                SearchResult(id=str(d["_id"]), category="opportunities", title=d["job_role"], subtitle=d["company_name"], link=link)
            )

    if role in (UserRole.STUDENT.value, UserRole.ADMIN.value):
        posts = await db.posts.find({"content": rx}).limit(LIMIT).to_list(length=LIMIT)
        for p in posts:
            results.append(
                SearchResult(
                    id=str(p["_id"]),
                    category="posts",
                    title=p["content"][:80],
                    subtitle=f"by {p['author_name']}",
                    link="/network",
                )
            )

    if role in (UserRole.STUDENT.value, UserRole.FACULTY.value):
        if role == UserRole.STUDENT.value:
            my_course_ids = [
                c["_id"] async for c in db.courses.find({"student_ids": ObjectId(current_user.id)}, {"_id": 1})
            ]
        else:
            my_course_ids = [
                c["_id"] async for c in db.courses.find({"faculty_id": ObjectId(current_user.id)}, {"_id": 1})
            ]
        materials = (
            await db.materials.find({"course_id": {"$in": my_course_ids}, "title": rx})
            .limit(LIMIT)
            .to_list(length=LIMIT)
        )
        for m in materials:
            results.append(
                SearchResult(id=str(m["_id"]), category="materials", title=m["title"], subtitle="Material", link="/materials")
            )

    return results
