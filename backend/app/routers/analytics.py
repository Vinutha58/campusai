from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.deps import require_role
from app.db.mongodb import get_database
from app.models.user import UserPublic, UserRole

router = APIRouter()


class CompanyBreakdown(BaseModel):
    company_name: str
    applications: int


class PlacementAnalytics(BaseModel):
    total_companies: int
    total_drives: int
    open_drives: int
    total_applications: int
    by_status: dict[str, int]
    by_company: list[CompanyBreakdown]


@router.get("/placement", response_model=PlacementAnalytics)
async def placement_analytics(
    current_user: UserPublic = Depends(require_role(UserRole.PLACEMENT_OFFICER.value)),
):
    db = get_database()

    total_companies = await db.companies.count_documents({})
    drives = await db.drives.find().to_list(length=1000)
    total_drives = len(drives)

    applications = await db.applications.find().to_list(length=5000)
    total_applications = len(applications)

    by_status: dict[str, int] = {}
    for a in applications:
        by_status[a["status"]] = by_status.get(a["status"], 0) + 1

    by_company_counts: dict[str, int] = {}
    for a in applications:
        name = a.get("company_name", "Unknown")
        by_company_counts[name] = by_company_counts.get(name, 0) + 1
    by_company = [
        CompanyBreakdown(company_name=name, applications=count)
        for name, count in sorted(by_company_counts.items(), key=lambda kv: -kv[1])
    ]

    now = datetime.utcnow()
    open_drives = sum(
        1
        for d in drives
        if (
            d["application_deadline"].replace(tzinfo=None)
            if d["application_deadline"].tzinfo
            else d["application_deadline"]
        )
        > now
    )

    return PlacementAnalytics(
        total_companies=total_companies,
        total_drives=total_drives,
        open_drives=open_drives,
        total_applications=total_applications,
        by_status=by_status,
        by_company=by_company,
    )
