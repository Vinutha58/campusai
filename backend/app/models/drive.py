from datetime import datetime, timezone

from bson import ObjectId
from pydantic import BaseModel, Field


class Eligibility(BaseModel):
    min_cgpa: float = 0
    branches: list[str] = []
    min_year: int = 1
    max_backlogs: int = 0


class DriveCreate(BaseModel):
    company_id: str
    job_role: str = Field(min_length=1, max_length=160)
    package: str = ""
    location: str = ""
    eligibility: Eligibility
    application_deadline: datetime
    drive_date: datetime | None = None


class DrivePublic(BaseModel):
    id: str
    company_id: str
    company_name: str
    job_role: str
    package: str
    location: str
    eligibility: Eligibility
    application_deadline: datetime
    drive_date: datetime | None
    is_open: bool
    application_count: int
    created_at: datetime


def new_drive_document(data: DriveCreate, company_name: str) -> dict:
    return {
        "company_id": ObjectId(data.company_id),
        "company_name": company_name,
        "job_role": data.job_role,
        "package": data.package,
        "location": data.location,
        "eligibility": data.eligibility.model_dump(),
        "application_deadline": data.application_deadline,
        "drive_date": data.drive_date,
        "created_at": datetime.now(timezone.utc),
    }


def _naive(dt: datetime) -> datetime:
    return dt.replace(tzinfo=None) if dt.tzinfo is not None else dt


def to_public_drive(doc: dict, application_count: int = 0) -> DrivePublic:
    is_open = _naive(doc["application_deadline"]) > datetime.utcnow()
    return DrivePublic(
        id=str(doc["_id"]),
        company_id=str(doc["company_id"]),
        company_name=doc["company_name"],
        job_role=doc["job_role"],
        package=doc.get("package", ""),
        location=doc.get("location", ""),
        eligibility=Eligibility(**doc["eligibility"]),
        application_deadline=doc["application_deadline"],
        drive_date=doc.get("drive_date"),
        is_open=is_open,
        application_count=application_count,
        created_at=doc["created_at"],
    )
