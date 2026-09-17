from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import get_database
from app.routers import (
    admin,
    analytics,
    applications,
    assignments,
    attendance,
    auth,
    companies,
    courses,
    drives,
    health,
    materials,
    marks,
    messages,
    network,
    quizzes,
    students,
)


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
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(drives.router, prefix="/api/drives", tags=["drives"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(network.router, prefix="/api/network", tags=["network"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
