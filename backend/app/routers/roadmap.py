from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import require_role
from app.db.mongodb import get_database
from app.models.roadmap import RoadmapGenerate, RoadmapPublic, roadmap_document, to_public_roadmap
from app.models.user import UserPublic, UserRole
from app.services.ai import AIError, generate_reply

router = APIRouter()

STUDENT_ONLY = Depends(require_role(UserRole.STUDENT.value))

SYSTEM_PROMPT = (
    "You are a career roadmap generator for a college student. Given their target role and current "
    "skills/certifications, produce a clear, structured roadmap with a few phases (e.g. Foundations, "
    "Intermediate, Advanced, Placement-ready), each with concrete skills to learn, suggested project "
    "ideas, and any certifications worth pursuing. Use short headings and bullet points. Be realistic "
    "and specific, not generic."
)


@router.get("/me", response_model=RoadmapPublic | None)
async def get_my_roadmap(current_user: UserPublic = STUDENT_ONLY):
    db = get_database()
    doc = await db.career_roadmaps.find_one({"_id": current_user.id})
    return to_public_roadmap(doc) if doc else None


@router.post("/generate", response_model=RoadmapPublic)
async def generate_roadmap(data: RoadmapGenerate, current_user: UserPublic = STUDENT_ONLY):
    db = get_database()
    profile = await db.users.find_one({"_id": ObjectId(current_user.id)})
    skills = profile.get("skills", []) if profile else []
    certifications = profile.get("certifications", []) if profile else []

    prompt = (
        f"Target role: {data.target_role}\n"
        f"Current skills: {', '.join(skills) or 'none listed'}\n"
        f"Current certifications: {', '.join(certifications) or 'none listed'}\n"
        f"Additional notes from the student: {data.notes or 'none'}"
    )

    try:
        content = await generate_reply([{"role": "user", "content": prompt}], SYSTEM_PROMPT)
    except AIError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    doc = roadmap_document(current_user.id, data.target_role, content)
    await db.career_roadmaps.update_one({"_id": current_user.id}, {"$set": doc}, upsert=True)
    return to_public_roadmap(doc)
