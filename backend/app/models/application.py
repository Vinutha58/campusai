from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SHORTLISTED = "shortlisted"
    ASSESSMENT = "assessment"
    INTERVIEW = "interview"
    SELECTED = "selected"
    REJECTED = "rejected"


STATUS_ORDER = [
    ApplicationStatus.APPLIED,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.ASSESSMENT,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.SELECTED,
]


class ApplicationPublic(BaseModel):
    id: str
    drive_id: str
    company_name: str
    job_role: str
    student_id: str
    student_name: str
    student_email: str
    status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime


class StatusUpdate(BaseModel):
    status: ApplicationStatus


def to_public_application(doc: dict) -> ApplicationPublic:
    return ApplicationPublic(
        id=str(doc["_id"]),
        drive_id=str(doc["drive_id"]),
        company_name=doc.get("company_name", ""),
        job_role=doc.get("job_role", ""),
        student_id=str(doc["student_id"]),
        student_name=doc["student_name"],
        student_email=doc["student_email"],
        status=doc["status"],
        applied_at=doc["applied_at"],
        updated_at=doc["updated_at"],
    )
