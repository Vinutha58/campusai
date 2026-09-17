from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.db.mongodb import get_database


async def get_company_or_404(company_id: str) -> dict:
    try:
        oid = ObjectId(company_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    db = get_database()
    company = await db.companies.find_one({"_id": oid})
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return company


async def get_drive_or_404(drive_id: str) -> dict:
    try:
        oid = ObjectId(drive_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drive not found")

    db = get_database()
    drive = await db.drives.find_one({"_id": oid})
    if drive is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drive not found")
    return drive


async def get_application_or_404(application_id: str) -> dict:
    try:
        oid = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    db = get_database()
    application = await db.applications.find_one({"_id": oid})
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application
