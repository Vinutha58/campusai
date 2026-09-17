# CampusAI

An AI-powered smart classroom, placement, and student networking platform — built as a college mini-project.

CampusAI unifies academics, an AI assistant, career development, placements, and a campus social network around a single student profile, so data from one area (e.g. marks and skills) can inform another (e.g. placement recommendations).

## Status

🎉 **The full roadmap is live.** Real authentication, complete Faculty/Placement/Admin tools, a working social layer (profiles, feed, follows), direct messaging, a real-time notification center, role-aware global search, and a complete AI-powered career suite for students — CampusGPT, Career AI chat, a resume builder with AI review, skills/certifications management, an AI career roadmap generator, AI-driven mock interview practice, and a transparent placement-readiness snapshot — all backed by a swappable OpenAI/Gemini/Claude provider layer. **The AI features need a real provider API key entered in AI Configuration (Admin) before they'll actually respond** — until then they fail gracefully with a clear message instead of crashing.

## Tech stack

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** FastAPI (Python), modular routers
- **Database:** MongoDB (via Docker Compose for local dev)
- **Auth:** Real email + password, bcrypt-hashed, JWT sessions. College-email OTP is deferred until an email-sending provider is set up.
- **AI:** Centralized provider-adapter layer (OpenAI / Gemini / Claude), configured by an admin in AI Configuration and consumed by CampusGPT, Career AI, resume review, career roadmap generation, and mock interview practice

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
- [x] Career AI — a full career suite for students: Career AI chat (roadmaps, skill gaps, interview strategy), a resume builder with AI review (no ATS scoring), skills and certifications management, an AI-generated career roadmap, AI-driven mock interview practice with per-answer feedback, and a transparent placement-readiness snapshot built from real attendance/marks/skills/resume/application data — the AI-backed parts share the same provider layer as CampusGPT and need a real API key

## Roadmap complete

Every milestone from the original plan has shipped. From here, further work would mean deepening existing features (e.g. college-email OTP verification, richer analytics) rather than adding new roadmap items.
