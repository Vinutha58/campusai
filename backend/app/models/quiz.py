from datetime import datetime, timezone

from bson import ObjectId
from pydantic import BaseModel, Field


class QuizQuestion(BaseModel):
    question: str
    options: list[str] = Field(min_length=2, max_length=6)
    correct_index: int


class QuizCreate(BaseModel):
    course_id: str
    title: str = Field(min_length=1, max_length=160)
    questions: list[QuizQuestion] = Field(min_length=1)


class QuizPublic(BaseModel):
    id: str
    course_id: str
    title: str
    questions: list[QuizQuestion]
    created_at: datetime


class QuizForStudent(BaseModel):
    """Same as QuizPublic but without the answer key."""

    id: str
    course_id: str
    title: str
    questions: list[dict]
    created_at: datetime


class QuizAttemptSubmit(BaseModel):
    answers: list[int]


class QuizAttemptResult(BaseModel):
    id: str
    quiz_id: str
    student_id: str
    student_name: str
    score: int
    total: int
    submitted_at: datetime


def new_quiz_document(data: QuizCreate) -> dict:
    return {
        "course_id": ObjectId(data.course_id),
        "title": data.title,
        "questions": [q.model_dump() for q in data.questions],
        "created_at": datetime.now(timezone.utc),
    }


def to_public_quiz(doc: dict) -> QuizPublic:
    return QuizPublic(
        id=str(doc["_id"]),
        course_id=str(doc["course_id"]),
        title=doc["title"],
        questions=[QuizQuestion(**q) for q in doc["questions"]],
        created_at=doc["created_at"],
    )


def to_student_quiz(doc: dict) -> QuizForStudent:
    return QuizForStudent(
        id=str(doc["_id"]),
        course_id=str(doc["course_id"]),
        title=doc["title"],
        questions=[
            {"question": q["question"], "options": q["options"]} for q in doc["questions"]
        ],
        created_at=doc["created_at"],
    )


def to_public_attempt(doc: dict) -> QuizAttemptResult:
    return QuizAttemptResult(
        id=str(doc["_id"]),
        quiz_id=str(doc["quiz_id"]),
        student_id=str(doc["student_id"]),
        student_name=doc["student_name"],
        score=doc["score"],
        total=doc["total"],
        submitted_at=doc["submitted_at"],
    )
