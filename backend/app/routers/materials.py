from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.core.deps import get_current_user, require_role
from app.core.notify import notify_many
from app.core.ownership import ensure_owns_course, get_course_or_404
from app.core.storage import get_upload_path, save_upload
from app.db.mongodb import get_database
from app.models.material import MaterialPublic, new_material_document, to_public_material
from app.models.notification import NotificationType
from app.models.user import UserPublic, UserRole

router = APIRouter()


@router.post("", response_model=MaterialPublic, status_code=status.HTTP_201_CREATED)
async def upload_material(
    course_id: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: UserPublic = Depends(require_role(UserRole.FACULTY.value)),
):
    course = await get_course_or_404(course_id)
    ensure_owns_course(course, current_user)

    file_name, stored_name = await save_upload(file)

    db = get_database()
    doc = new_material_document(course_id, title, file_name, stored_name)
    result = await db.materials.insert_one(doc)
    doc["_id"] = result.inserted_id

    await notify_many(
        course.get("student_ids", []),
        NotificationType.MATERIAL,
        f"New material: {title}",
        f"{course['name']} has a new material uploaded.",
        "/materials",
    )

    return to_public_material(doc)


@router.get("/course/{course_id}", response_model=list[MaterialPublic])
async def list_materials(course_id: str, current_user: UserPublic = Depends(get_current_user)):
    await get_course_or_404(course_id)
    db = get_database()
    materials = (
        await db.materials.find({"course_id": ObjectId(course_id)}).sort("uploaded_at", -1).to_list(length=200)
    )
    return [to_public_material(m) for m in materials]


@router.get("/{material_id}/download")
async def download_material(material_id: str, current_user: UserPublic = Depends(get_current_user)):
    db = get_database()
    material = await db.materials.find_one({"_id": ObjectId(material_id)})
    if material is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    path = get_upload_path(material["stored_name"])
    return FileResponse(path, filename=material["file_name"])
