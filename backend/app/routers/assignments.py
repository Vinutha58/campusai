from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.core.deps import get_current_user, require_role
from app.core.notify import notify_many
from app.core.ownership import ensure_owns_course, get_course_or_404
from app.core.storage import get_upload_path, save_upload
from app.models.notification import NotificationType
from app.db.mongodb import get_database
from app.models.assignment import (
    AssignmentCreate,
    AssignmentPublic,
    GradeRequest,
    SubmissionPublic,
    new_assignment_document,
    to_public_assignment,
    to_public_submission,
)
from app.models.user import UserPublic, UserRole

router = APIRouter()


async def _get_assignment_or_404(assignment_id: str) -> dict:
    try:
        oid = ObjectId(assignment_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    db = get_database()
    assignment = await db.assignments.find_one({"_id": oid})
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment


@router.post("", response_model=AssignmentPublic, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    data: AssignmentCreate, current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value))
):
    course = await get_course_or_404(data.course_id)
    ensure_owns_course(course, current_user)

    db = get_database()
    doc = new_assignment_document(data)
    result = await db.assignments.insert_one(doc)
    doc["_id"] = result.inserted_id

    await notify_many(
        course.get("student_ids", []),
        NotificationType.ASSIGNMENT,
        f"New assignment: {data.title}",
        f"{course['name']} has a new assignment due {data.due_date.strftime('%b %d, %Y')}.",
        "/assignments",
    )

    return to_public_assignment(doc)


@router.get("/course/{course_id}", response_model=list[AssignmentPublic])
async def list_assignments(course_id: str, current_user: UserPublic = Depends(get_current_user)):
    await get_course_or_404(course_id)
    db = get_database()
    assignments = (
        await db.assignments.find({"course_id": ObjectId(course_id)}).sort("due_date", 1).to_list(length=200)
    )
    return [to_public_assignment(a) for a in assignments]


@router.get("/{assignment_id}/my-submission", response_model=SubmissionPublic | None)
async def my_submission(
    assignment_id: str, current_user: UserPublic = Depends(require_role(UserRole.STUDENT.value))
):
    db = get_database()
    submission = await db.submissions.find_one(
        {"assignment_id": ObjectId(assignment_id), "student_id": ObjectId(current_user.id)}
    )
    return to_public_submission(submission) if submission else None


@router.post(
    "/{assignment_id}/submit", response_model=SubmissionPublic, status_code=status.HTTP_201_CREATED
)
async def submit_assignment(
    assignment_id: str,
    file: UploadFile = File(...),
    current_user: UserPublic = Depends(require_role(UserRole.STUDENT.value)),
):
    await _get_assignment_or_404(assignment_id)
    file_name, stored_name = await save_upload(file)

    db = get_database()
    doc = {
        "assignment_id": ObjectId(assignment_id),
        "student_id": ObjectId(current_user.id),
        "student_name": current_user.name,
        "file_name": file_name,
        "stored_name": stored_name,
        "submitted_at": datetime.now(timezone.utc),
        "grade": None,
        "feedback": None,
    }
    await db.submissions.update_one(
        {"assignment_id": doc["assignment_id"], "student_id": doc["student_id"]},
        {"$set": doc},
        upsert=True,
    )
    saved = await db.submissions.find_one(
        {"assignment_id": doc["assignment_id"], "student_id": doc["student_id"]}
    )
    return to_public_submission(saved)


@router.get("/{assignment_id}/submissions", response_model=list[SubmissionPublic])
async def list_submissions(
    assignment_id: str, current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value))
):
    assignment = await _get_assignment_or_404(assignment_id)
    course = await get_course_or_404(str(assignment["course_id"]))
    ensure_owns_course(course, current_user)

    db = get_database()
    submissions = await db.submissions.find({"assignment_id": ObjectId(assignment_id)}).to_list(length=500)
    return [to_public_submission(s) for s in submissions]


@router.post("/submissions/{submission_id}/grade", response_model=SubmissionPublic)
async def grade_submission(
    submission_id: str,
    data: GradeRequest,
    current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value)),
):
    db = get_database()
    submission = await db.submissions.find_one({"_id": ObjectId(submission_id)})
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    assignment = await _get_assignment_or_404(str(submission["assignment_id"]))
    course = await get_course_or_404(str(assignment["course_id"]))
    ensure_owns_course(course, current_user)

    await db.submissions.update_one(
        {"_id": submission["_id"]}, {"$set": {"grade": data.grade, "feedback": data.feedback}}
    )
    updated = await db.submissions.find_one({"_id": submission["_id"]})
    return to_public_submission(updated)


@router.get("/submissions/{submission_id}/download")
async def download_submission(
    submission_id: str, current_user: UserPublic = Depends(get_current_user)
):
    db = get_database()
    submission = await db.submissions.find_one({"_id": ObjectId(submission_id)})
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    is_owner = str(submission["student_id"]) == current_user.id
    if not is_owner:
        assignment = await _get_assignment_or_404(str(submission["assignment_id"]))
        course = await get_course_or_404(str(assignment["course_id"]))
        ensure_owns_course(course, current_user)

    path = get_upload_path(submission["stored_name"])
    return FileResponse(path, filename=submission["file_name"])
