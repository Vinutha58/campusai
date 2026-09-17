from datetime import datetime, timezone

from pydantic import BaseModel, Field


class EducationEntry(BaseModel):
    institution: str
    degree: str
    field: str = ""
    start_year: str = ""
    end_year: str = ""


class ExperienceEntry(BaseModel):
    title: str
    organization: str
    start_date: str = ""
    end_date: str = ""
    description: str = ""


class ProjectEntry(BaseModel):
    title: str
    description: str = ""
    tech: list[str] = []
    link: str = ""


class ResumeLinks(BaseModel):
    github: str = ""
    linkedin: str = ""
    portfolio: str = ""


class ResumeUpdate(BaseModel):
    summary: str = ""
    education: list[EducationEntry] = []
    experience: list[ExperienceEntry] = []
    projects: list[ProjectEntry] = []
    links: ResumeLinks = Field(default_factory=ResumeLinks)


class ResumePublic(BaseModel):
    summary: str
    education: list[EducationEntry]
    experience: list[ExperienceEntry]
    projects: list[ProjectEntry]
    links: ResumeLinks
    updated_at: datetime | None


class ResumeReview(BaseModel):
    feedback: str


def resume_document(user_id: str, data: ResumeUpdate) -> dict:
    return {
        "_id": user_id,
        "summary": data.summary,
        "education": [e.model_dump() for e in data.education],
        "experience": [e.model_dump() for e in data.experience],
        "projects": [p.model_dump() for p in data.projects],
        "links": data.links.model_dump(),
        "updated_at": datetime.now(timezone.utc),
    }


def to_public_resume(doc: dict | None) -> ResumePublic:
    if doc is None:
        return ResumePublic(summary="", education=[], experience=[], projects=[], links=ResumeLinks(), updated_at=None)
    return ResumePublic(
        summary=doc.get("summary", ""),
        education=[EducationEntry(**e) for e in doc.get("education", [])],
        experience=[ExperienceEntry(**e) for e in doc.get("experience", [])],
        projects=[ProjectEntry(**p) for p in doc.get("projects", [])],
        links=ResumeLinks(**doc.get("links", {})),
        updated_at=doc.get("updated_at"),
    )
