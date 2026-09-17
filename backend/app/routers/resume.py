from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import require_role
from app.db.mongodb import get_database
from app.models.resume import ResumePublic, ResumeReview, ResumeUpdate, resume_document, to_public_resume
from app.models.user import UserPublic, UserRole
from app.services.ai import AIError, generate_reply

router = APIRouter()

STUDENT_ONLY = Depends(require_role(UserRole.STUDENT.value))

REVIEW_SYSTEM_PROMPT = (
    "You are a career advisor reviewing a college student's resume. Give concise, constructive "
    "feedback in a few short paragraphs or bullet points: what's strong, what's missing, and 2-3 "
    "concrete improvements. Do not assign any numeric score or rating - qualitative feedback only."
)


@router.get("/me", response_model=ResumePublic)
async def get_my_resume(current_user: UserPublic = STUDENT_ONLY):
    db = get_database()
    doc = await db.resumes.find_one({"_id": current_user.id})
    return to_public_resume(doc)


@router.put("/me", response_model=ResumePublic)
async def update_my_resume(data: ResumeUpdate, current_user: UserPublic = STUDENT_ONLY):
    db = get_database()
    doc = resume_document(current_user.id, data)
    await db.resumes.update_one({"_id": current_user.id}, {"$set": doc}, upsert=True)
    return to_public_resume(doc)


@router.post("/review", response_model=ResumeReview)
async def review_my_resume(current_user: UserPublic = STUDENT_ONLY):
    db = get_database()
    doc = await db.resumes.find_one({"_id": current_user.id})
    resume = to_public_resume(doc)

    if not resume.summary and not resume.education and not resume.experience and not resume.projects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Add some resume content first, then ask for a review."
        )

    resume_text = (
        f"Summary: {resume.summary}\n\n"
        f"Education: {[e.model_dump() for e in resume.education]}\n\n"
        f"Experience: {[e.model_dump() for e in resume.experience]}\n\n"
        f"Projects: {[p.model_dump() for p in resume.projects]}\n\n"
        f"Links: {resume.links.model_dump()}"
    )

    try:
        feedback = await generate_reply(
            [{"role": "user", "content": resume_text}], REVIEW_SYSTEM_PROMPT
        )
    except AIError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    return ResumeReview(feedback=feedback)
