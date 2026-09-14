# SentinelX Coding Execution Sandbox & Judge System

## Architecture Overview

There are **two distinct** execution flows within SentinelX:

1. **Run Code (Candidate-Facing)**
   - Used for manual, sandbox exploration.
   - Candidates provide custom inputs via stdin.
   - Returns stdout, stderr, and exit codes purely for display.
   - **Does NOT** affect scoring or submission evaluation.

2. **Coding Judge / Hidden Test Evaluation (Server-Side)**
   - Invoked synchronously during Assessment Submission (`/api/attempts/[id]/submit`) or independently via `/api/attempts/[id]/coding-evaluate`.
   - Iterates securely through database-defined `CodingTestCase` records.
   - Evaluates outputs against `expectedOutput`.
   - Hides all expected outputs and test inputs from the HTTP response.
   - Computes marks based on successful test cases and seals the `isCorrect` and `score` fields.

```text
Exam Submission Pipeline
      ↓
API /api/attempts/[id]/submit
      ↓
Coding Judge Service (coding-judge.ts)
      ↓ (For each testCase)
Docker Container (python-runner) ← Injects testCase.input securely via stdin
      ↓
stdout (compared against expectedOutput with trailing whitespace trimmed)
      ↓
Aggregate results (passedTests, earnedMarks)
      ↓
Update Answer record (in memory via short transaction)
      ↓
Finalize Attempt Score
```

## Threat Model and Isolation Strategy

### 1. Why Candidate Code is Untrusted
Candidate-submitted code must be inherently treated as malicious. Candidates may attempt to:
- Access the host filesystem (read SentinelX source code, configuration, or environment secrets).
- Open network connections (e.g., exfiltrate data, perform DDoS, contact external servers).
- Abuse CPU/Memory resources (e.g., infinite loops, fork bombs, allocating massive strings).
- Execute arbitrary shell commands on the server.
- Extract or reverse-engineer hidden expected outputs by writing them out.

### 2. Why Direct Host Execution is Unsafe
Executing code directly via `eval()`, `new Function()`, or `child_process.spawn()` running python natively on the host server provides zero isolation. Even with Python-level restrictions, the interpreter runs under the Node.js process user, possessing the exact same privileges, network access, and file access as the web server itself. A single `os.system()` call could compromise the entire database and server.

Therefore, Docker is utilized for defense-in-depth hardware and kernel namespace isolation.

### 3. Docker Isolation Policies
We enforce strict kernel and daemon-level isolation:
- **`--network none`**: completely disables the container's network stack.
- **`--memory 128m`**: enforces a hard 128MB RAM limit.
- **`--cpus 0.5`**: throttles the container to half a core.
- **`--read-only`**: mounts the container's root filesystem as read-only.
- **`--cap-drop ALL` & `--security-opt no-new-privileges`**: prevents privilege escalation.
- **`--pids-limit 64`**: mitigates fork bombs.
- **Non-Root Execution**: Runs under a dedicated, unprivileged `runner` user inside the container.
- **No Mounts**: Absolutely no host paths, Docker sockets, or credentials are bound into the container.

### 4. Code Execution and Cleanup
- Candidate code is **passed as data (stdin)** to a fixed `runner.py` script; it is **never** interpolated into shell commands.
- We rely on `child_process.execFile` executing the precise `docker` binary, preventing argument injection.
- Execution timeout is rigidly enforced via Node.js's timeout handler for `execFile`, which explicitly `docker rm -f`s the container upon breach.
- Outputs (`stdout`/`stderr`) are aggressively capped (e.g. 50KB) to prevent memory exhaustion on the host parsing large return values.

### 5. Evaluation Safety & Timeouts
- Test cases are executed sequentially.
- A **Timeout** or malicious behavior immediately flags the evaluation as `executionStopped`. The remaining test cases are skipped and earn zero marks to prevent server saturation.
- Test case records and expected outputs never leave the secure server-side Node.js memory boundaries. They are not transmitted over the wire to the frontend.

## Output Comparison Policy
For MVP, the evaluation executes a strict string equivalence:
`actualStdout.trimEnd() === testCase.expectedOutput.trimEnd()`
- It normalizes trailing newline inconsistencies.
- It does not employ aggressive semantic normalization (e.g. `2.0` does not equal `2`).
- Partial points are awarded per successful test case, determined by the `CodingTestCase.marks`. `isCorrect` is strictly reserved for solutions passing 100% of defined tests.
