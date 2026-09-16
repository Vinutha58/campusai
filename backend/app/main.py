from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import get_database
from app.routers import assignments, attendance, auth, courses, health, materials, marks, quizzes


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = get_database()
    await db.users.create_index("email", unique=True)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["quizzes"])
app.include_router(materials.router, prefix="/api/materials", tags=["materials"])
app.include_router(marks.router, prefix="/api/marks", tags=["marks"])
