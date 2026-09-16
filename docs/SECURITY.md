# SentinelX Security Architecture

This document describes the security architecture currently implemented in SentinelX.

## 1. Threat Model

| Threat | Mitigation | Current Status |
|---|---|---|
| IDOR (Insecure Direct Object Reference) | All organizer database queries are strictly scoped with `organizerId === session.user.id`. | Implemented |
| Unauthorized Assessment Access | Attempting to access an assessment owned by another organizer yields a 404. | Implemented |
| Candidate Attempt Hijacking | Candidates use a stateless, server-signed JWT scoped to their specific attempt and assessment. | Implemented |
| Correct-Answer Leakage | Correct MCQ options and scores are stripped from client-facing API responses during the active exam. | Implemented |
| Hidden-Test Leakage | Coding test cases marked `isHidden=true` are never sent to the client; evaluation happens server-side. | Implemented |
| Malicious Code Execution | Sandboxed via Docker with dropped capabilities, no-new-privileges, and `--network none`. | Implemented |
| Resource Exhaustion | Docker limits memory to 128MB, CPU to 0.5, and restricts output stream sizes and execution time. | Implemented |

---

## 2. Organizer Authentication & Isolation

SentinelX uses **Auth.js (NextAuth)** to manage organizer sessions via securely encrypted, `HttpOnly` cookies.

- **Password Hashing:** Uses `bcryptjs` for secure salt/hashing of organizer passwords.
- **Data Ownership:** Every `Assessment` is bound to an `organizerId`.
- **Database Filters:** All API routes interacting with organizer data (Assessments, Results, Reports, Dashboard, Events, Incidents) rely on server-side NextAuth `session.user.id`. 
- **Validation:** Trust is never placed on client-provided IDs. `where: { organizerId: session.user.id }` is universally applied in Prisma queries.

---

## 3. Candidate Authentication

Candidate identities are generated during the MVP "join" flow using an access code. 

- **Token Generation:** The server signs a custom JWT (`CANDIDATE_AUTH_SECRET`) containing the `attemptId` and `assessmentId`.
- **Delivery:** This JWT is delivered via `HttpOnly` cookies (or authorization headers) and acts as the sole credential for the duration of the exam.
- **Authorization:** `GET /api/attempts/[id]/*` validates that the token belongs to the requested attempt.
- **Limitation:** Currently, candidate identity relies purely on the initial join payload. Integration with enterprise SSO for candidates is a future roadmap item.

---

## 4. Exam Integrity (Data Leakage)

- **Answer Validation:** The API strips `isCorrect` and internal database IDs before sending the question payload to the browser.
- **Hidden Coding Test Cases:** Evaluated strictly inside the backend Docker sandbox. The client only sees the execution results of public test cases during a "Run".

---

## 5. Docker Sandbox Security

The `POST /api/code/run` and evaluation pipelines execute untrusted candidate Python code. The execution happens inside a highly restricted, ephemeral Docker container:

- **Network Isolation:** `--network none` entirely prevents internet access or lateral network movement.
- **CPU/Memory Limits:** Hard-capped to `128m` RAM and `0.5` CPUs.
- **Process Limits:** `--pids-limit 64` prevents fork bombs.
- **Filesystem:** `--read-only` enforces a read-only root filesystem.
- **Privileges:** Drops all capabilities (`--cap-drop ALL`) and enforces `--security-opt no-new-privileges`.
- **User:** Runs as an unprivileged user (not root).
- **Timeouts:** Node.js backend enforces strict process timeouts.
- **Stream limits:** Standard output and error streams are truncated if they exceed predefined byte limits to prevent memory exhaustion in the Next.js process.

### Production Consideration
Running Docker internally requires socket access (`/var/run/docker.sock`). While secure within local development, standard serverless environments (like Vercel or Railway) do not expose nested Docker daemons. Moving the coding execution to a standalone containerized service (gRPC/HTTP) is recommended for scalable production deployments.
