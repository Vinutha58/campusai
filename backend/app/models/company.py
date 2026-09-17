from datetime import datetime, timezone

from pydantic import BaseModel, Field


class CompanyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str = ""
    industry: str = ""
    website: str = ""
    location: str = ""


class CompanyPublic(BaseModel):
    id: str
    name: str
    description: str
    industry: str
    website: str
    location: str
    created_at: datetime


def new_company_document(data: CompanyCreate) -> dict:
    return {
        "name": data.name,
        "description": data.description,
        "industry": data.industry,
        "website": data.website,
        "location": data.location,
        "created_at": datetime.now(timezone.utc),
    }


def to_public_company(doc: dict) -> CompanyPublic:
    return CompanyPublic(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description", ""),
        industry=doc.get("industry", ""),
        website=doc.get("website", ""),
        location=doc.get("location", ""),
        created_at=doc["created_at"],
    )
