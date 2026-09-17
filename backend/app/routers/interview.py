from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import require_role
from app.db.mongodb import get_database
from app.models.interview import (
    AnswerSubmit,
    InterviewGenerate,
    InterviewSessionPublic,
    new_interview_session_document,
    parse_questions,
    to_public_interview_session,
)
from app.models.user import UserPublic, UserRole
from app.services.ai import AIError, generate_reply

router = APIRouter()

STUDENT_ONLY = Depends(require_role(UserRole.STUDENT.value))

QUESTIONS_SYSTEM_PROMPT = (
    "You generate mock interview questions for a college student preparing for placements. Given a "
    "topic or target role, produce exactly 5 interview questions covering a mix of technical and "
    "behavioral angles. Reply with ONLY the 5 questions, one per line, no numbering, no extra "
    "commentary before or after."
)

FEEDBACK_SYSTEM_PROMPT = (
    "You are a mock interview coach. Given an interview question and the student's answer, give brief, "
    "constructive feedback in 2-4 sentences: what was good, what to improve, and one concrete tip. "
    "Do not assign a numeric score."
)


async def _get_session_or_404(session_id: str, user_id: str) -> dict:
    try:
        oid = ObjectId(session_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    db = get_database()
    session = await db.interview_sessions.find_one({"_id": oid, "user_id": ObjectId(user_id)})
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.get("/sessions", response_model=list[InterviewSessionPublic])
async def list_sessions(current_user: UserPublic = STUDENT_ONLY):
    db = get_database()
    sessions = (
        await db.interview_sessions.find({"user_id": ObjectId(current_user.id)})
        .sort("created_at", -1)
        .to_list(length=100)
    )
    return [to_public_interview_session(s) for s in sessions]


@router.post("/generate", response_model=InterviewSessionPublic, status_code=status.HTTP_201_CREATED)
async def generate_session(data: InterviewGenerate, current_user: UserPublic = STUDENT_ONLY):
    try:
        raw = await generate_reply(
            [{"role": "user", "content": f"Topic / target role: {data.topic}"}], QUESTIONS_SYSTEM_PROMPT
        )
    except AIError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    questions = parse_questions(raw)
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="The AI didn't return any usable questions. Try again."
        )

    db = get_database()
    doc = new_interview_session_document(current_user.id, data.topic, questions)
    result = await db.interview_sessions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_public_interview_session(doc)


@router.post("/sessions/{session_id}/answer", response_model=InterviewSessionPublic)
async def submit_answer(
    session_id: str, data: AnswerSubmit, current_user: UserPublic = STUDENT_ONLY
):
    session = await _get_session_or_404(session_id, current_user.id)
    if data.question_index < 0 or data.question_index >= len(session["questions"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question index")

    question_text = session["questions"][data.question_index]["question"]
    prompt = f"Question: {question_text}\n\nStudent's answer: {data.answer}"

    try:
        feedback = await generate_reply([{"role": "user", "content": prompt}], FEEDBACK_SYSTEM_PROMPT)
    except AIError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    db = get_database()
    await db.interview_sessions.update_one(
        {"_id": session["_id"]},
        {
            "$set": {
                f"questions.{data.question_index}.answer": data.answer,
                f"questions.{data.question_index}.feedback": feedback,
            }
        },
    )
    updated = await db.interview_sessions.find_one({"_id": session["_id"]})
    return to_public_interview_session(updated)
