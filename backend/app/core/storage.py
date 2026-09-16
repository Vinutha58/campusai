import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".txt", ".zip"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


async def save_upload(file: UploadFile) -> tuple[str, str]:
    """Validates and saves an uploaded file. Returns (original_filename, stored_filename)."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' isn't allowed",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File is larger than the 20MB limit"
        )

    stored_name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / stored_name).write_bytes(contents)
    return file.filename or stored_name, stored_name


def get_upload_path(stored_name: str) -> Path:
    path = (UPLOAD_DIR / stored_name).resolve()
    if UPLOAD_DIR.resolve() not in path.parents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file reference")
    return path
