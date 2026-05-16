---
name: indiamart-peopleflow-ai
description: >
  Use this skill when working on IndiaMART's PeopleFlow AI platform — an
  intelligent, full-stack HR recruitment and employee lifecycle system built
  with React + TypeScript (Vite), Firebase Auth, Supabase (PostgreSQL), and
  the IndiaMART LLM Gateway (Gemini 2.5 Flash). Invoke this skill for tasks
  involving: AI resume screening, interview scheduling, exit interview
  analysis, employee L&D planning, admin dashboards, HR chatbot, role-based
  access, or any code/schema changes to this project.
---

# PeopleFlow AI — Skill Reference

## 1. Project Overview

**IndiaMART PeopleFlow AI** is a production HR platform covering the full
employee lifecycle — from candidate sourcing and AI-powered resume screening,
through interview scheduling and exit interviews, to employee L&D planning
and attrition analytics.

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, `react-router-dom v6` |
| Auth | Firebase Authentication (email/password) |
| Database | Supabase (PostgreSQL) |
| AI / LLM | IndiaMART LLM Gateway → `google/gemini-2.5-flash` |
| PDF Parsing | `pdfjs-dist` (client-side) |
| Notifications | `sonner` toast library |
| Calendar | Google Calendar API (via backend proxy in `server.ts`) |

---

## 2. Repository Layout

```
project/
├── src/
│   ├── App.tsx                        # Root router + AuthContext
│   ├── lib/
│   │   ├── firebase.ts                # Firebase app init + auth export
│   │   ├── supabase.ts                # Supabase client init
│   │   ├── gemini.ts                  # analyzeResume() — AI resume screener
│   │   └── pdf.ts                     # extractTextFromPdf() — pdfjs-dist
│   ├── services/
│   │   ├── exitInterviewService.ts    # ExitInterviewService (chat + insights)
│   │   └── ldService.ts               # LdService (career path + dept strategy)
│   ├── components/
│   │   ├── layout/                    # Navbar, Header, Sidebar
│   │   ├── chatbot/HRChatbot.tsx      # Employee HR chatbot
│   │   └── exit/ExitInterviewChat.tsx # AI exit interview widget
│   └── pages/
│       ├── Home.tsx                   # Public landing page
│       ├── Login.tsx                  # Tri-modal login (candidate/admin/employee)
│       ├── AdminDashboard.tsx         # Interview scheduling + applicant review
│       ├── AdminExitManagement.tsx    # Exit requests + AI insights dashboard
│       ├── AdminLdDashboard.tsx       # Dept-level L&D strategy view
│       ├── AdminEmployeeTrack.tsx     # Employee tracking
│       ├── CandidateDashboard.tsx     # Candidate home + application status
│       ├── Apply.tsx                  # Job application + resume upload
│       ├── ApplicantDetail.tsx        # Per-applicant AI score + actions
│       ├── InterviewPortal.tsx        # Public self-scheduling portal (/schedule/:appId)
│       ├── EmployeePortal.tsx         # Employee home + ticket system
│       ├── EmployeeLd.tsx             # Personal L&D roadmap
│       ├── EmployeeProfile.tsx        # Employee profile management
│       └── HelpCenter.tsx             # HR chatbot help center
├── supabase/
│   ├── schema.sql                     # Full DB schema (authoritative)
│   └── update_*.sql                   # Migration patches
├── server.ts                          # Express backend (Google Calendar proxy)
├── questions.json                     # Static HR FAQ / chatbot seed data
├── .env.example                       # Required env vars
└── skills/interview_scheduler/SKILL.md
```

---

## 3. Authentication & Role Model

Authentication is handled entirely by **Firebase Auth**. Supabase stores
application data; user IDs are stored as `TEXT` (Firebase UIDs), not UUIDs.

Role assignment is derived from email domain at login time in `App.tsx`:

| Email Pattern | Role | Redirect |
|---|---|---|
| `admin@teamstellarx.com` | `admin` | `/admin` |
| `*@indiamart.com` | `employee` | `/portal` |
| Any other email | `candidate` | `/dashboard` |

The `AuthContext` (exported from `App.tsx`) exposes `{ user, role, loading, signOut }`.
Always consume it via `useAuth()`.

**Route guards** use inline `element={user && role === 'X' ? <Page /> : <Navigate to="..." />}`
patterns — do not introduce a separate `ProtectedRoute` wrapper without
updating all existing guards consistently.

---

## 4. LLM Gateway Integration

All AI calls route through **IndiaMART's internal LLM Gateway** — not the
public Gemini or OpenAI APIs.

```
Endpoint : https://imllm.intermesh.net/v1/chat/completions
Auth     : Bearer ${VITE_LLM_GATEWAY_TOKEN}
Model    : google/gemini-2.5-flash
Format   : OpenAI-compatible (messages array, choices[0].message.content)
```

### Service Modules

#### `src/lib/gemini.ts` — `analyzeResume(resumeText, jobDescription)`
- Returns `AIAnalysisResult`: `{ score, matchedSkills, missingSkills, experienceRelevance, recommendation, summary }`
- Temperature: `0.1` (deterministic scoring)
- Strict prompt guards: no hallucination, explicit skill matching only
- Recommendation tiers: `"Strong Match" | "Moderate Match" | "Weak Match"`

#### `src/services/exitInterviewService.ts` — `ExitInterviewService`
- `getChatResponse(history)` — conversational exit interview (max 5 questions, temp `0.7`)
- `generateInsights(transcript)` — structured attrition analytics, returns full JSON
  with `themes`, `sentiment`, `redFlags`, `greenFlags`, `improvementAreas`, `summary`
- Root cause themes are a closed list (9 categories) — do not add new ones

#### `src/services/ldService.ts` — `LdService`
- `generatePath(employee)` — individual L&D roadmap with `gap_analysis`,
  `readiness_score`, `roadmap[]`, `recommendations[]`, `what_to_build`
- `generateDepartmentStrategy(dept, employees[])` — collective gap analysis +
  infrastructure recommendation for the department
- `generateGlobalInsights(employees[], progress[], courses[])` — org-level
  L&D trend analysis (one-sentence strategic recommendation + focus area)
- Temperature: `0.2` for roadmaps, `0.3` for global insights

### Response Parsing Pattern

All services strip markdown fences before `JSON.parse`:
```typescript
if (text.includes('```')) {
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
}
```
Always apply this pattern when adding new LLM calls. Never assume raw JSON output.

---

## 5. Database Schema (Supabase)

Key tables — see `supabase/schema.sql` for full definitions.

| Table | Primary Key | Notes |
|---|---|---|
| `jobs` | `UUID` | Active job postings |
| `candidates` | `TEXT` (Firebase UID) | Candidate profiles |
| `applications` | `UUID` | Links candidate ↔ job; stores `resume_text` |
| `ai_scores` | `UUID` | AI analysis results per application |
| `interviews` | `UUID` | Scheduled interviews with Google Calendar event ID |
| `interviewer_availability` | `UUID` | Weekly availability slots |
| `interviewer_tokens` | `UUID` | OAuth refresh tokens for Calendar API |
| `chatbot_conversations` | `UUID` | HR chatbot history |
| `employee_tickets` | `UUID` | Employee support tickets |
| `employee_profiles` | `TEXT` (Firebase UID) | Internal employee data |
| `exit_requests` | `UUID` | Employee exit/resignation requests |
| `courses` | `UUID` | L&D course catalogue |
| `employee_progress` | `UUID` | Course completion + quiz scores |

**Critical:** All `user_id` / `candidate_id` foreign keys are `TEXT` (Firebase UIDs).
Never cast these to `UUID`. Use `auth.uid()::text` in Supabase RLS policies.

---

## 6. Key Feature Flows

### 6.1 AI Resume Screening
1. Candidate uploads PDF on `/apply/:id` (`Apply.tsx`)
2. `extractTextFromPdf(file)` → plain text via `pdfjs-dist`
3. Resume text stored in `applications.resume_text`
4. Admin opens `/admin/applicant/:id` (`ApplicantDetail.tsx`)
5. Calls `analyzeResume(resumeText, jobDescription)` → `AIAnalysisResult`
6. Result saved to `ai_scores` table and displayed with score badge + skill tags

### 6.2 Interview Scheduling (Admin)
1. Admin selects candidate + PM on `AdminDashboard.tsx`
2. `GET /api/calendar/list?employeeEmail=<pm>` → PM busy slots
3. Admin picks date + time in form
4. `POST /api/calendar/schedule` → creates Google Calendar event, sends invites
5. Interview record saved to `interviews` table with `calendar_event_id`

### 6.3 Self-Scheduling Portal
- Public route: `/schedule/:appId` → `InterviewPortal.tsx`
- No auth required; candidate picks from available slots
- Calls same `/api/calendar/schedule` backend endpoint

### 6.4 Exit Interview (Employee)
1. Employee submits exit request → saved in `exit_requests`
2. `ExitInterviewChat.tsx` renders conversational AI chat widget
3. `ExitInterviewService.getChatResponse(history)` drives the interview (≤5 Qs)
4. On completion, `generateInsights(transcript)` produces structured JSON
5. Admin reviews in `AdminExitManagement.tsx` with sentiment, red/green flags, recommendations

### 6.5 L&D Planner
- Employee: `/portal/ld` → `EmployeeLd.tsx` calls `LdService.generatePath(employee)`
- Admin: `/admin/ld-planner` → `AdminLdDashboard.tsx` calls `generateDepartmentStrategy()`
  and `generateGlobalInsights()` for org-wide view

### 6.6 HR Chatbot
- `HRChatbot.tsx` and `HelpCenter.tsx` provide an employee-facing chatbot
- Chatbot history persisted to `chatbot_conversations` table
- Unresolved issues escalate to `employee_tickets`

---

## 7. Environment Variables

All required vars are listed in `.env.example`. The two most critical:

| Variable | Used In | Purpose |
|---|---|---|
| `VITE_LLM_GATEWAY_TOKEN` | All AI services | Bearer token for IndiaMART LLM Gateway |
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` | Supabase client |
| Firebase config vars | `src/lib/firebase.ts` | Firebase Auth init |
| `GOOGLE_CLIENT_ID/SECRET` | `server.ts` | Google Calendar OAuth |

Never hardcode tokens. Always read from `import.meta.env.VITE_*` (frontend)
or `process.env.*` (backend `server.ts`).

---

## 8. Implementation Guidelines

### Adding a New AI Feature
1. Add a new method to the appropriate service class (`ExitInterviewService`,
   `LdService`) or create a new service in `src/services/`.
2. Use the standard gateway fetch pattern with `model: "google/gemini-2.5-flash"`.
3. Wrap output parsing with the markdown-strip + try/catch pattern.
4. Use temperature `≤ 0.2` for structured JSON, `0.5–0.7` for conversational.
5. Never expose `VITE_LLM_GATEWAY_TOKEN` in logs or error messages.

### Adding a New Page / Route
1. Create the component in `src/pages/`.
2. Add a `<Route>` in `App.tsx` following the existing role-guard pattern.
3. Add navigation link in `Sidebar.tsx` under the correct role section.
4. If the page needs auth, always check both `user` and `role`.

### Database Migrations
1. Write migration SQL in `supabase/update_<feature>.sql`.
2. Test locally with Supabase CLI before applying to production.
3. Never alter existing column types (especially `TEXT` UID columns) without
   updating all dependent RLS policies.

### Error Handling
- Backend API errors → JSON `{ error: { message: string } }` with appropriate HTTP status.
- Frontend AI errors → `toast.error(...)` via `sonner`. Never silently swallow errors.
- LLM Gateway non-200 → throw `new Error(\`LLM Gateway Error (\${response.status}): ...\`)`.

---

## 9. Inputs & Outputs by Feature

### Resume Screening
**Input:** `resumeText: string`, `jobDescription: string`
**Output:** `AIAnalysisResult` JSON → `ai_scores` table row

### Exit Interview
**Input:** Employee `exit_requests` record + chat `history[]`
**Output:** Conversational messages + structured attrition insight JSON

### L&D Planner
**Input:** Employee profile object (role, skills, department, experience)
**Output:** Roadmap JSON with steps, certifications, readiness score

### Interview Scheduling
**Input:** `employeeEmail`, `candidateEmail`, `title`, `date`, `time`, `duration`
**Output:** Google Calendar event created; `interviews` row inserted

---

## 10. Known Constraints & Gotchas

- **Firebase UID vs UUID:** Supabase tables use `TEXT` primary keys for user-facing
  records. If a query returns a type mismatch error, check for missing `::text` cast.
- **pdfjs Worker:** Worker source is pinned to `unpkg.com` CDN. If PDF parsing
  fails in a new environment, verify the CDN URL matches `pdfjsLib.version`.
- **LLM JSON fragility:** The gateway occasionally wraps JSON in markdown fences.
  Always strip before parsing. Use `jsonMatch` regex fallback for array responses.
- **Google Calendar proxy:** All Calendar API calls must go through `server.ts`
  to keep OAuth credentials server-side. Never call the Calendar API directly
  from the frontend.
- **Role detection is email-based:** There is no roles table. Changing the admin
  email or employee domain requires updating the logic in `App.tsx` `useEffect`.