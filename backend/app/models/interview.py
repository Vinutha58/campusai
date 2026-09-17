import re
from datetime import datetime, timezone

from bson import ObjectId
from pydantic import BaseModel, Field


class InterviewQuestion(BaseModel):
    question: str
    answer: str | None = None
    feedback: str | None = None


class InterviewGenerate(BaseModel):
    topic: str = Field(min_length=1, max_length=160)


class AnswerSubmit(BaseModel):
    question_index: int
    answer: str = Field(min_length=1, max_length=4000)


class InterviewSessionPublic(BaseModel):
    id: str
    topic: str
    questions: list[InterviewQuestion]
    created_at: datetime


def parse_questions(raw: str) -> list[str]:
    lines = [line.strip() for line in raw.splitlines()]
    questions = []
    for line in lines:
        cleaned = re.sub(r"^[\-\*\d]+[\.\)]?\s*", "", line).strip()
        if cleaned:
            questions.append(cleaned)
    return questions[:8]


def new_interview_session_document(user_id: str, topic: str, questions: list[str]) -> dict:
    return {
        "user_id": ObjectId(user_id),
        "topic": topic,
        "questions": [{"question": q, "answer": None, "feedback": None} for q in questions],
        "created_at": datetime.now(timezone.utc),
    }


def to_public_interview_session(doc: dict) -> InterviewSessionPublic:
    return InterviewSessionPublic(
        id=str(doc["_id"]),
        topic=doc["topic"],
        questions=[InterviewQuestion(**q) for q in doc["questions"]],
        created_at=doc["created_at"],
    )
