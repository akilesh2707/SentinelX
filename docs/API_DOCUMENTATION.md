# SentinelX API Documentation

This document describes all currently implemented API routes in the SentinelX MVP.

## Authentication Roles & Boundaries

The SentinelX API utilizes two distinct authentication boundaries:
1. **Organizer APIs:** Protected via Auth.js (NextAuth) session cookies (`session.user.id`).
2. **Candidate APIs (`/api/attempts/*`)**: Protected via custom, stateless JSON Web Tokens (JWT) issued upon joining an assessment.
3. **Public APIs**: Endpoints required for initial join/signup flows.

---

## 1. Authentication

### `POST /api/auth/signup`
- **Purpose**: Register a new Organizer account.
- **Auth**: Public
- **Body**: `{ name, email, password }`
- **Response**: `201 Created`

### `GET/POST /api/auth/*`
- **Purpose**: NextAuth routes for session management (e.g., login, CSRF, session retrieval).
- **Auth**: Public

---

## 2. Assessments

### `GET /api/assessments`
- **Purpose**: Fetch all assessments belonging to the logged-in organizer.
- **Auth**: Organizer
- **Authorization**: Scoped to `organizerId === session.user.id`.
- **Response**: `200 OK` with list of assessments.

### `POST /api/assessments`
- **Purpose**: Create a new assessment.
- **Auth**: Organizer
- **Body**: `{ title, type, passingScore, duration, questions, ... }`
- **Security**: The server forces `organizerId = session.user.id` upon creation, ignoring any client-provided ID.

### `GET /api/assessments/[id]`
- **Purpose**: Fetch details of a specific assessment.
- **Auth**: Organizer
- **Authorization**: Validates `id` AND `organizerId`.

### `PATCH /api/assessments/[id]`
- **Purpose**: Update an existing assessment.
- **Auth**: Organizer
- **Authorization**: Validates ownership via `findFirst` before `update`.

### `DELETE /api/assessments/[id]`
- **Purpose**: Delete an assessment.
- **Auth**: Organizer
- **Authorization**: Enforces ownership via `deleteMany`.

---

## 3. Candidates (Organizer Facing)

### `GET /api/candidates`
- **Purpose**: List candidates who have attempted the organizer's assessments.
- **Auth**: Organizer

### `GET /api/candidates/[id]`
- **Purpose**: Get specific candidate details.
- **Auth**: Organizer

---

## 4. Candidate Exam Flow (Public & JWT)

### `POST /api/attempts`
- **Purpose**: Join an assessment via an access code (Public). Creates a candidate record and returns a scoped JWT.
- **Auth**: Public
- **Body**: `{ accessCode, name, email }`
- **Response**: JWT token in response or set as a cookie (depending on auth flow).

### `POST /api/attempts/[id]/start`
- **Purpose**: Transition attempt from `NOT_STARTED` to `IN_PROGRESS` and begin the timer.
- **Auth**: Candidate JWT

### `GET /api/attempts/[id]/questions`
- **Purpose**: Fetch the assigned questions for the exam attempt. Excludes `isCorrect` fields and hidden test cases.
- **Auth**: Candidate JWT

### `PATCH /api/attempts/[id]/answers`
- **Purpose**: Autosave candidate answers (MCQ option or raw code).
- **Auth**: Candidate JWT
- **Body**: `{ questionId, selectedOptionId?, submittedCode?, language? }`

### `POST /api/attempts/[id]/submit`
- **Purpose**: Finalize the exam, evaluate MCQs, and mark as `SUBMITTED`.
- **Auth**: Candidate JWT

---

## 5. Coding Execution & Evaluation

### `POST /api/code/run`
- **Purpose**: Execute raw code against provided inputs in an isolated Docker sandbox. Used for candidate "Run Code" functionality during the exam.
- **Auth**: Candidate JWT (or Public depending on middleware strictness, typically JWT).
- **Body**: `{ code, language, input }`
- **Response**: `{ stdout, stderr, executionTime }`
- **Security**: Runs in a locked-down Docker container with `--network none`, `memory=128m`, `cpus=0.5`.

### `POST /api/attempts/[id]/coding-evaluate`
- **Purpose**: Execute a submitted coding answer against hidden test cases to generate a final score.
- **Auth**: Candidate JWT (Triggered during submission) or Organizer (Triggered during review).
- **Security**: Test cases are retrieved securely from the database and NEVER sent to the client.

---

## 6. Proctoring

### `POST /api/attempts/[id]/proctoring-events`
- **Purpose**: Submit batched client-side telemetry events (e.g., `TAB_SWITCH`, `CAMERA_UNAVAILABLE`).
- **Auth**: Candidate JWT
- **Body**: `{ events: [{ type, timestamp, clientTimestamp, metadata }] }`
- **Validation**: Enforces valid `ProctoringEventType` enum values.

### `GET /api/incidents`
### `GET /api/assessments/[id]/incidents`
### `GET /api/attempts/[id]/incidents`
- **Purpose**: Fetch incidents grouped by attempt, assessment, or globally.
- **Auth**: Organizer
- **Authorization**: Protects against IDOR by validating `organizerId === session.user.id`.

### `GET /api/incidents/[incidentId]`
- **Purpose**: Fetch details for a specific incident.
- **Auth**: Organizer
- **Authorization**: Ensures the incident belongs to an attempt on an assessment owned by the organizer.

### `PATCH /api/incidents/[incidentId]`
- **Purpose**: Update incident status (e.g., mark as RESOLVED).
- **Auth**: Organizer
- **Authorization**: Ensures the incident belongs to an attempt on an assessment owned by the organizer.

---

## 7. Results & Reports

### `GET /api/results`
- **Purpose**: Fetch assessment attempts and scores.
- **Auth**: Organizer
- **Authorization**: Restricts to attempts belonging to assessments owned by `session.user.id`.
- **Query**: `?assessmentId=...&status=...&search=...`

### `GET /api/results/[attemptId]`
- **Purpose**: Get detailed view of a specific attempt (questions, submitted answers, scores).
- **Auth**: Organizer
- **Authorization**: Verifies `assessment.organizerId === session.user.id`.

### `GET /api/reports`
- **Purpose**: Fetch aggregated analytics (completion rate, score distribution).
- **Auth**: Organizer
- **Authorization**: Scoped to the organizer's assessments.

### `GET /api/dashboard`
- **Purpose**: Fetch top-level dashboard metrics (totals, recent activity).
- **Auth**: Organizer
- **Authorization**: Fully scoped to `organizerId`.

---

## 8. Events

### `GET /api/events`
### `GET /api/events/[id]`
- **Purpose**: Fetch events (groups of assessments).
- **Auth**: Organizer

### `POST /api/events/[id]/assessments`
- **Purpose**: Attach an assessment to an event.
- **Auth**: Organizer
- **Authorization**: Verifies that the `assessmentId` being attached belongs to the `organizerId`.

### `DELETE /api/events/[id]/assessments/[assessmentId]`
- **Purpose**: Remove an assessment from an event.
- **Auth**: Organizer
- **Authorization**: Verifies ownership of the assessment.

---

## 9. Questions

### `GET /api/questions`
- **Purpose**: Fetch the global/organizer question bank.
- **Auth**: Organizer

---

## 10. System Health

### `GET /api/system-health`
- **Purpose**: Liveness probe. Verifies database connectivity.
- **Auth**: Public
- **Response**: `200 OK` `{ status: "healthy", database: "connected" }`
