from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.core.lookups import get_company_or_404, get_drive_or_404
from app.db.mongodb import get_database
from app.models.application import ApplicationStatus
from app.models.drive import DriveCreate, DrivePublic, new_drive_document, to_public_drive
from app.models.user import UserPublic, UserRole

router = APIRouter()


@router.post("", response_model=DrivePublic, status_code=status.HTTP_201_CREATED)
async def create_drive(
    data: DriveCreate,
    current_user: UserPublic = Depends(require_role(UserRole.PLACEMENT_OFFICER.value)),
):
    company = await get_company_or_404(data.company_id)
    db = get_database()
    doc = new_drive_document(data, company["name"])
    result = await db.drives.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_public_drive(doc)


@router.get("", response_model=list[DrivePublic])
async def list_drives(
    open_only: bool = False, current_user: UserPublic = Depends(get_current_user)
):
    db = get_database()
    drives = await db.drives.find().sort("application_deadline", 1).to_list(length=500)
    result = []
    for d in drives:
        count = await db.applications.count_documents({"drive_id": d["_id"]})
        public = to_public_drive(d, count)
        if open_only and not public.is_open:
            continue
        result.append(public)
    return result


@router.get("/{drive_id}", response_model=DrivePublic)
async def get_drive(drive_id: str, current_user: UserPublic = Depends(get_current_user)):
    drive = await get_drive_or_404(drive_id)
    db = get_database()
    count = await db.applications.count_documents({"drive_id": drive["_id"]})
    return to_public_drive(drive, count)


@router.patch("/{drive_id}", response_model=DrivePublic)
async def update_drive(
    drive_id: str,
    data: DriveCreate,
    current_user: UserPublic = Depends(require_role(UserRole.PLACEMENT_OFFICER.value)),
):
    drive = await get_drive_or_404(drive_id)
    company = await get_company_or_404(data.company_id)
    db = get_database()
    await db.drives.update_one(
        {"_id": drive["_id"]},
        {
            "$set": {
                "company_id": ObjectId(data.company_id),
                "company_name": company["name"],
                "job_role": data.job_role,
                "package": data.package,
                "location": data.location,
                "eligibility": data.eligibility.model_dump(),
                "application_deadline": data.application_deadline,
                "drive_date": data.drive_date,
            }
        },
    )
    updated = await db.drives.find_one({"_id": drive["_id"]})
    count = await db.applications.count_documents({"drive_id": drive["_id"]})
    return to_public_drive(updated, count)


@router.post("/{drive_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_to_drive(
    drive_id: str, current_user: UserPublic = Depends(require_role(UserRole.STUDENT.value))
):
    drive = await get_drive_or_404(drive_id)
    db = get_database()

    existing = await db.applications.find_one(
        {"drive_id": drive["_id"], "student_id": ObjectId(current_user.id)}
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already applied")

    doc = {
        "drive_id": drive["_id"],
        "company_name": drive["company_name"],
        "job_role": drive["job_role"],
        "student_id": ObjectId(current_user.id),
        "student_name": current_user.name,
        "student_email": current_user.email,
        "status": ApplicationStatus.APPLIED.value,
        "applied_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db.applications.insert_one(doc)
    return {"status": "applied"}
