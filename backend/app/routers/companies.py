from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user, require_role
from app.core.lookups import get_company_or_404
from app.db.mongodb import get_database
from app.models.company import CompanyCreate, CompanyPublic, new_company_document, to_public_company
from app.models.user import UserPublic, UserRole

router = APIRouter()


@router.post("", response_model=CompanyPublic, status_code=status.HTTP_201_CREATED)
async def create_company(
    data: CompanyCreate,
    current_user: UserPublic = Depends(
        require_role(UserRole.PLACEMENT_OFFICER.value, UserRole.ADMIN.value)
    ),
):
    db = get_database()
    doc = new_company_document(data)
    result = await db.companies.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_public_company(doc)


@router.get("", response_model=list[CompanyPublic])
async def list_companies(current_user: UserPublic = Depends(get_current_user)):
    db = get_database()
    companies = await db.companies.find().sort("created_at", -1).to_list(length=500)
    return [to_public_company(c) for c in companies]


@router.patch("/{company_id}", response_model=CompanyPublic)
async def update_company(
    company_id: str,
    data: CompanyCreate,
    current_user: UserPublic = Depends(
        require_role(UserRole.PLACEMENT_OFFICER.value, UserRole.ADMIN.value)
    ),
):
    company = await get_company_or_404(company_id)
    db = get_database()
    await db.companies.update_one(
        {"_id": company["_id"]},
        {
            "$set": {
                "name": data.name,
                "description": data.description,
                "industry": data.industry,
                "website": data.website,
                "location": data.location,
            }
        },
    )
    updated = await db.companies.find_one({"_id": company["_id"]})
    return to_public_company(updated)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: str,
    current_user: UserPublic = Depends(
        require_role(UserRole.PLACEMENT_OFFICER.value, UserRole.ADMIN.value)
    ),
):
    company = await get_company_or_404(company_id)
    db = get_database()
    if await db.drives.find_one({"company_id": company["_id"]}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Can't delete a company that has placement drives",
        )
    await db.companies.delete_one({"_id": company["_id"]})
