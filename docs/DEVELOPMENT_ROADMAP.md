# SentinelX Development Roadmap

This document outlines the features and milestones for SentinelX.

## COMPLETED

- **Project Foundation:** Initial Next.js App Router scaffolding and monorepo setup.
- **Database Architecture:** PostgreSQL database integrated with Prisma ORM.
- **Organizer Authentication:** Secure login using Auth.js (NextAuth) and bcrypt.
- **Assessment Ownership:** Strict IDOR prevention and ownership isolation using `organizerId`.
- **Question Bank:** Global and organizer-specific creation of MCQ and CODING questions.
- **Assessment Builder:** UI for assembling exams with configured parameters and questions.
- **Candidate Join:** Public gateway for candidates to join via Access Code.
- **Attempt System:** Candidate identities bound to secure, scoped stateless JWTs.
- **Server-Authoritative Timer:** Backend validation of attempt expirations.
- **Answer Autosave:** Client-side throttling and continuous syncing of exam answers.
- **MCQ Evaluation:** Instant, secure grading of multiple-choice answers upon submission.
- **Docker Coding Execution:** Isolated container sandbox for raw code execution.
- **Coding Judge:** Server-side evaluation against hidden test cases.
- **Results:** Organizer views for attempts and individual candidate scores.
- **Dashboard:** High-level metrics and aggregated attempt activity.
- **Candidates:** Centralized view of all candidate records.
- **Events:** Logical grouping of assessments into broad hiring/testing events.
- **Reports:** Granular analytics on attempt completion and score distribution.
- **System Health:** Basic Liveness and readiness endpoints.
- **Candidate Security:** Locked-down UI to prevent unintended exits or interference.
- **Basic Proctoring:** Client-side event aggregation (`TAB_SWITCH`, `FULLSCREEN_EXIT`, etc.).
- **Camera Monitoring:** Preflight permission checks and active tracking of webcam lifecycle.
- **Microphone Monitoring:** Preflight permission checks and active tracking of microphone lifecycle.
- **Proctoring Incident Engine:** Rule-based engine analyzing telemetry in 5-minute sliding episodes, generating Incident and IncidentEvent traceability with severities.
- **Attempt Risk Scoring:** Calculates riskScore 0-100 per attempt.
- **Incident APIs:** Organizer APIs for incident management with strict ownership/IDOR protection.

---

## NEXT / FUTURE

> [!NOTE]
> The features listed below are currently in the planning or early development phase. They do NOT exist in the current MVP.

### Phase 1: Background Proctoring Workers
**Purpose:** Move the Incident Engine processing from synchronous API requests to Redis-backed background workers for better scalability and decoupled processing.

### Phase 2: Evidence & Screenshots
**Purpose:** Enhance the proctoring engine to capture actual periodic screenshots of the candidate's screen and webcam snapshots, storing them securely for later organizer review.

### Phase 3: Computer Vision (CV) & Face Recognition
**Purpose:** Integrate local or cloud-based CV models to analyze webcam feeds for absence, multiple faces, identity verification beyond the current foundation, or unauthorized objects (e.g., cell phones).

### Phase 4: Advanced Behavioral Analysis
**Purpose:** Employ advanced AI to analyze the sequence of telemetry and CV events, detecting complex cheating patterns beyond simple rule thresholds.

### Phase 5: Realtime Command Center
**Purpose:** Replace batch HTTP telemetry flushing with secure WebSockets/SSE to provide organizers with a live realtime command center of active candidates.

### Phase 6: Production Coding Execution Service
**Purpose:** Decouple the Docker execution sandbox from the Next.js backend, moving it into an independently scalable, highly isolated gRPC/HTTP microservice tailored for serverless platform compatibility.

### Phase 9: Advanced Event Rounds & Leaderboards
**Purpose:** Support multi-stage events (e.g., Round 1 MCQ $\to$ Round 2 Coding), cutoff scores, and public or private competitive leaderboards.

### Phase 10: CI/CD, Observability, Performance & Security Audit
**Purpose:** Implement complete end-to-end testing, observability (tracing/metrics), performance tuning, and conduct a professional security audit before public enterprise release.
