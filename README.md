# CampusAI

An AI-powered smart classroom, placement, and student networking platform — built as a college mini-project.

CampusAI unifies academics, an AI assistant, career development, placements, and a campus social network around a single student profile, so data from one area (e.g. marks and skills) can inform another (e.g. placement recommendations).

## Status

🚧 **All 4 roles, Campus Network, Messaging, Notifications, Search, and CampusGPT are live.** Real authentication, complete Faculty/Placement/Admin tools, a working social layer (profiles, feed, follows), direct messaging, a real-time notification center, role-aware global search, and an AI chat assistant for students backed by a swappable OpenAI/Gemini/Claude provider layer — **CampusGPT needs a real API key entered in AI Configuration (Admin) before it will actually respond.** Career AI is what's left — see milestones below.

## Tech stack

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** FastAPI (Python), modular routers
- **Database:** MongoDB (via Docker Compose for local dev)
- **Auth:** Real email + password, bcrypt-hashed, JWT sessions. College-email OTP is deferred until an email-sending provider is set up.
- **AI:** Centralized provider-adapter layer (OpenAI / Gemini / Claude), configured by an admin in AI Configuration and consumed by CampusGPT

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

Copy `backend/.env.example` to `backend/.env` and adjust if your Mongo connection or JWT secret differs. API available at `http://localhost:8000`, health check at `/api/health`.

Seed a few demo accounts (safe to re-run):

```bash
venv\Scripts\python -m app.seed
```

### 3. Frontend

```bash
cd frontend
npm install   # first time only
npm run dev
```

Copy `frontend/.env.example` to `frontend/.env.local` if your backend runs somewhere other than `http://localhost:8000`.

App available at `http://localhost:3000`. Register a new account from the landing page, or log in with one of the seeded demo accounts (shown on the login page under "Demo accounts"):

| Role | Email | Password |
|---|---|---|
| Student | student1@campusai.edu / student2@campusai.edu | Student@123 |
| Faculty | faculty1@campusai.edu / faculty2@campusai.edu | Faculty@123 |
| Placement Officer | placement1@campusai.edu | Placement@123 |
| Administrator | admin1@campusai.edu | Admin@123 |

## Roadmap

- [x] Project scaffold, role-aware navigation shell, Student dashboard (sample data)
- [x] Real authentication (email + password, JWT, seeded multi-user accounts) — college-email OTP layered in later
- [x] Faculty — dashboard, courses, students, attendance, assignments, quizzes, materials, marks
- [x] Placement Officer — dashboard, companies, drives, opportunities, applications, students, analytics
- [x] Admin — dashboard, user management (roles/activation), courses, companies/placement oversight, academic/placement/platform analytics, AI configuration, platform settings
- [x] Campus Network — profiles, feed (posts/likes/comments), follow system, admin moderation
- [x] Messaging — conversations, unread counts, message history, user search (Student/Faculty/Placement Officer)
- [x] Notifications — real-time notification center covering assignments, materials, quizzes, marks, attendance, placement drives, application status, Campus Network activity, and messages, for all 4 roles
- [x] Search — role-aware global search across people, courses, opportunities, companies, materials, and Campus Network posts
- [x] CampusGPT — AI chat assistant for students (doubts, notes, study plans), backed by a swappable OpenAI/Gemini/Claude provider layer configured in AI Configuration — requires a real API key to produce actual responses
- [ ] Career AI
