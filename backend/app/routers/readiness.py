from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.db.mongodb import get_database
from app.models.readiness import ReadinessFactor, ReadinessPublic
from app.models.user import UserPublic, UserRole

router = APIRouter()

STUDENT_ONLY = Depends(require_role(UserRole.STUDENT.value))

SKILLS_TARGET = 8
CERTIFICATIONS_TARGET = 3
APPLICATIONS_TARGET = 3

WEIGHTS = {
    "academic": 0.25,
    "attendance": 0.15,
    "skills": 0.20,
    "certifications": 0.15,
    "resume": 0.15,
    "engagement": 0.10,
}


@router.get("/me", response_model=ReadinessPublic)
async def get_my_readiness(current_user: UserPublic = STUDENT_ONLY):
    db = get_database()
    student_id = current_user.id
    student_oid = ObjectId(student_id)

    marks = await db.marks.find({"student_id": student_oid}).to_list(length=1000)
    if marks:
        academic_score = round(sum(m["score"] / m["max_score"] for m in marks) / len(marks) * 100, 1)
        academic_detail = f"Average of {len(marks)} recorded assessment(s)"
    else:
        academic_score = 0.0
        academic_detail = "No marks recorded yet"

    attendance_docs = await db.attendance.find({"records.student_id": student_id}).to_list(length=5000)
    present_count = 0
    total_count = 0
    for doc in attendance_docs:
        for r in doc.get("records", []):
            if r.get("student_id") == student_id:
                total_count += 1
                if r.get("present"):
                    present_count += 1
    attendance_score = round(present_count / total_count * 100, 1) if total_count else 0.0
    attendance_detail = (
        f"Present {present_count}/{total_count} recorded sessions" if total_count else "No attendance recorded yet"
    )

    profile = await db.users.find_one({"_id": student_oid})
    skills = profile.get("skills", []) if profile else []
    certifications = profile.get("certifications", []) if profile else []
    skills_score = round(min(len(skills), SKILLS_TARGET) / SKILLS_TARGET * 100, 1)
    certifications_score = round(min(len(certifications), CERTIFICATIONS_TARGET) / CERTIFICATIONS_TARGET * 100, 1)

    resume = await db.resumes.find_one({"_id": student_id})
    resume_checks = 0
    if resume:
        if resume.get("summary"):
            resume_checks += 1
        if resume.get("education"):
            resume_checks += 1
        if resume.get("experience") or resume.get("projects"):
            resume_checks += 1
        links = resume.get("links", {})
        if links.get("github") or links.get("linkedin") or links.get("portfolio"):
            resume_checks += 1
    resume_score = round(resume_checks / 4 * 100, 1)

    applications_count = await db.applications.count_documents({"student_id": student_oid})
    engagement_score = round(min(applications_count, APPLICATIONS_TARGET) / APPLICATIONS_TARGET * 100, 1)

    factors = [
        ReadinessFactor(label="Academic performance", score=academic_score, detail=academic_detail),
        ReadinessFactor(label="Attendance", score=attendance_score, detail=attendance_detail),
        ReadinessFactor(label="Skills", score=skills_score, detail=f"{len(skills)} skill(s) listed"),
        ReadinessFactor(
            label="Certifications", score=certifications_score, detail=f"{len(certifications)} certification(s) listed"
        ),
        ReadinessFactor(label="Resume completeness", score=resume_score, detail=f"{resume_checks}/4 sections filled"),
        ReadinessFactor(
            label="Placement engagement", score=engagement_score, detail=f"{applications_count} application(s) submitted"
        ),
    ]

    overall = round(
        academic_score * WEIGHTS["academic"]
        + attendance_score * WEIGHTS["attendance"]
        + skills_score * WEIGHTS["skills"]
        + certifications_score * WEIGHTS["certifications"]
        + resume_score * WEIGHTS["resume"]
        + engagement_score * WEIGHTS["engagement"],
        1,
    )

    suggestions = []
    if skills_score < 100:
        suggestions.append("Add more skills to your profile to reflect your full skill set.")
    if certifications_score < 100:
        suggestions.append("Consider adding relevant certifications you've completed.")
    if resume_score < 100:
        suggestions.append("Fill out the remaining sections of your resume.")
    if attendance_score < 75 and total_count:
        suggestions.append("Your attendance is below 75% - this affects eligibility for some drives.")
    if engagement_score < 100:
        suggestions.append("Apply to more open placement drives to build experience with the process.")
    if academic_score < 60 and marks:
        suggestions.append("Focus on improving assessment scores where you're falling behind.")

    return ReadinessPublic(overall_score=overall, factors=factors, suggestions=suggestions)
