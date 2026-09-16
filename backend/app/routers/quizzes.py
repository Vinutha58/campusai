from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.core.ownership import ensure_owns_course, get_course_or_404
from app.db.mongodb import get_database
from app.models.quiz import (
    QuizAttemptResult,
    QuizAttemptSubmit,
    QuizCreate,
    QuizForStudent,
    QuizPublic,
    new_quiz_document,
    to_public_attempt,
    to_public_quiz,
    to_student_quiz,
)
from app.models.user import UserPublic, UserRole

router = APIRouter()


async def _get_quiz_or_404(quiz_id: str) -> dict:
    try:
        oid = ObjectId(quiz_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    db = get_database()
    quiz = await db.quizzes.find_one({"_id": oid})
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz


@router.post("", response_model=QuizPublic, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    data: QuizCreate, current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value))
):
    course = await get_course_or_404(data.course_id)
    ensure_owns_course(course, current_user)

    db = get_database()
    doc = new_quiz_document(data)
    result = await db.quizzes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_public_quiz(doc)


@router.get("/course/{course_id}")
async def list_quizzes(course_id: str, current_user: UserPublic = Depends(get_current_user)):
    await get_course_or_404(course_id)
    db = get_database()
    quizzes = await db.quizzes.find({"course_id": ObjectId(course_id)}).to_list(length=200)

    if current_user.role == UserRole.FACULTY:
        return [to_public_quiz(q) for q in quizzes]
    return [to_student_quiz(q) for q in quizzes]


@router.get("/{quiz_id}", response_model=QuizForStudent)
async def get_quiz(quiz_id: str, current_user: UserPublic = Depends(get_current_user)):
    quiz = await _get_quiz_or_404(quiz_id)
    return to_student_quiz(quiz)


@router.get("/{quiz_id}/my-attempt", response_model=QuizAttemptResult | None)
async def my_attempt(quiz_id: str, current_user: UserPublic = Depends(require_role(UserRole.STUDENT.value))):
    db = get_database()
    attempt = await db.quiz_attempts.find_one(
        {"quiz_id": ObjectId(quiz_id), "student_id": ObjectId(current_user.id)}
    )
    return to_public_attempt(attempt) if attempt else None


@router.post("/{quiz_id}/attempt", response_model=QuizAttemptResult)
async def attempt_quiz(
    quiz_id: str,
    data: QuizAttemptSubmit,
    current_user: UserPublic = Depends(require_role(UserRole.STUDENT.value)),
):
    quiz = await _get_quiz_or_404(quiz_id)
    questions = quiz["questions"]

    score = sum(
        1
        for i, q in enumerate(questions)
        if i < len(data.answers) and data.answers[i] == q["correct_index"]
    )

    db = get_database()
    doc = {
        "quiz_id": ObjectId(quiz_id),
        "student_id": ObjectId(current_user.id),
        "student_name": current_user.name,
        "answers": data.answers,
        "score": score,
        "total": len(questions),
        "submitted_at": datetime.now(timezone.utc),
    }
    await db.quiz_attempts.update_one(
        {"quiz_id": doc["quiz_id"], "student_id": doc["student_id"]}, {"$set": doc}, upsert=True
    )
    saved = await db.quiz_attempts.find_one({"quiz_id": doc["quiz_id"], "student_id": doc["student_id"]})
    return to_public_attempt(saved)


@router.get("/{quiz_id}/results", response_model=list[QuizAttemptResult])
async def quiz_results(
    quiz_id: str, current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value))
):
    quiz = await _get_quiz_or_404(quiz_id)
    course = await get_course_or_404(str(quiz["course_id"]))
    ensure_owns_course(course, current_user)

    db = get_database()
    attempts = await db.quiz_attempts.find({"quiz_id": ObjectId(quiz_id)}).to_list(length=500)
    return [to_public_attempt(a) for a in attempts]
