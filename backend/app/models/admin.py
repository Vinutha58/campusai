from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class AIProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    CLAUDE = "claude"


class AIConfigInput(BaseModel):
    provider: AIProvider
    api_key: str | None = Field(default=None, description="Only send when setting/changing the key")


class AIConfigPublic(BaseModel):
    provider: AIProvider | None
    has_key: bool
    key_preview: str | None


class PlatformSettingsInput(BaseModel):
    college_name: str = ""
    college_domain: str = ""


class PlatformSettingsPublic(BaseModel):
    college_name: str
    college_domain: str


class AcademicAnalytics(BaseModel):
    total_courses: int
    total_students: int
    total_faculty: int
    total_assignments: int
    total_quizzes: int
    avg_attendance_percent: float


class PlatformAnalytics(BaseModel):
    students: int
    faculty: int
    placement_officers: int
    admins: int
    total_courses: int
    total_companies: int
    total_drives: int
    total_applications: int


def ai_config_document(data: AIConfigInput, existing_key: str | None) -> dict:
    key = data.api_key if data.api_key else existing_key
    return {
        "_id": "ai_config",
        "provider": data.provider.value,
        "api_key": key,
        "updated_at": datetime.now(timezone.utc),
    }


def to_public_ai_config(doc: dict | None) -> AIConfigPublic:
    if doc is None:
        return AIConfigPublic(provider=None, has_key=False, key_preview=None)
    key = doc.get("api_key")
    return AIConfigPublic(
        provider=doc.get("provider"),
        has_key=bool(key),
        key_preview=(f"...{key[-4:]}" if key and len(key) >= 4 else None),
    )


def to_public_settings(doc: dict | None) -> PlatformSettingsPublic:
    if doc is None:
        return PlatformSettingsPublic(college_name="", college_domain="")
    return PlatformSettingsPublic(
        college_name=doc.get("college_name", ""), college_domain=doc.get("college_domain", "")
    )
