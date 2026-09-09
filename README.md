# CampusAI

An AI-powered smart classroom, placement, and student networking platform — built as a college mini-project.

CampusAI unifies academics, an AI assistant, career development, placements, and a campus social network around a single student profile, so data from one area (e.g. marks and skills) can inform another (e.g. placement recommendations).

## Status

🚧 **Phase 1 — Basic dashboard scaffold.** Project structure, auth shell (demo role picker), role-aware navigation, and the Student dashboard are in place with sample data. Real authentication, the other role dashboards, and every AI/placement/network feature are being added incrementally — see milestones below.

## Tech stack

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** FastAPI (Python), modular routers
- **Database:** MongoDB (via Docker Compose for local dev)
- **AI:** Centralized provider-adapter layer (OpenAI / Gemini / Claude) — added in a later milestone

## Project structure

```
CampusAI/
├── frontend/          Next.js app
├── backend/           FastAPI app
├── docker-compose.yml MongoDB for local dev
└── README.md
```

## Getting started

### 1. Database

```bash
docker compose up -d
```

Requires Docker Desktop running.

### 2. Backend

```bash
cd backend
venv\Scripts\pip install -r requirements.txt   # first time only
venv\Scripts\uvicorn app.main:app --reload --port 8000
```

Copy `backend/.env.example` to `backend/.env` and adjust if your Mongo connection differs. API available at `http://localhost:8000`, health check at `/api/health`.

### 3. Frontend

```bash
cd frontend
npm install   # first time only
npm run dev
```

App available at `http://localhost:3000`. From the landing page, click **Login** and pick a role — real college-email OTP login isn't wired up yet, so this is a temporary stand-in that lets every role's dashboard be previewed.

## Roadmap

- [x] Project scaffold, role-aware navigation shell, Student dashboard (sample data)
- [ ] Real authentication (college email + OTP)
- [ ] Faculty / Placement Officer / Admin dashboards
- [ ] Smart Classroom (courses, materials, attendance, assignments, marks, quizzes)
- [ ] CampusGPT and Career AI
- [ ] Placement Portal
- [ ] Campus Network
- [ ] Messaging, notifications, search, analytics
