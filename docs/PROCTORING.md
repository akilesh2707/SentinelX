# SentinelX Proctoring System

This document explains **ONLY** the currently implemented proctoring system within the MVP.

## 1. Overview

The SentinelX proctoring engine relies on client-side telemetry captured during an active assessment attempt. The raw events are aggregated on the candidate's browser, queued in memory, and periodically flushed to the server for persistent storage.

## 2. Telemetry Events Captured

The current implementation captures the following `ProctoringEventType` enums:

- `TAB_SWITCH`: Triggered when the candidate navigates to a different browser tab.
- `WINDOW_BLUR`: Triggered when the browser window loses focus.
- `FULLSCREEN_EXIT`: Triggered when the candidate drops out of the forced fullscreen mode.
- `NETWORK_DISCONNECT`: Triggered when the browser detects a loss of internet connectivity.
- `NETWORK_RECONNECT`: Triggered when the browser regains internet connectivity.
- `PAGE_RELOAD`: Triggered if the candidate refreshes the page during an exam.
- `CAMERA_UNAVAILABLE`: Triggered if the webcam track is stopped, disconnected, or permissions are revoked during the exam.
- `MICROPHONE_UNAVAILABLE`: Triggered if the microphone track is stopped, disconnected, or permissions are revoked.
- `EXAM_STARTED`: Emitted at the start of the session.
- `EXAM_SUBMITTED`: Emitted when the exam is voluntarily submitted.

## 3. Data Flow

1. **Candidate Browser:** Event listeners (e.g., `visibilitychange`, media track `onended`) detect anomalies.
2. **Proctoring Engine (Client):** Events are tagged with a `clientTimestamp` and pushed into an in-memory queue.
3. **Batch Flush:** The queue flushes periodically (e.g., every few seconds) or upon `visibilitychange` via `navigator.sendBeacon`.
4. **Proctoring API (`POST /api/attempts/[id]/proctoring-events`):** The server receives the batch.
5. **Server Validation:** The server verifies the JWT authorization, validates the enums, assigns a trusted server `timestamp`, and inserts the batch into the PostgreSQL `ProctoringEvent` table.

## 4. Hardware Monitoring Lifecycle

- **Preflight:** Before the exam starts, candidates are forced through a hardware check that explicitly requests webcam and microphone permissions.
- **Active Exam Monitoring:** Once granted, the MediaStream tracks are monitored continuously. If a track fires an `ended` event (e.g., hardware unplugged, OS revoked permission), an unavailable event is queued.
- **Cleanup:** Streams are properly stopped and detached upon exam submission.

## 5. Incident Engine (Implemented)

The platform includes an inline **Proctoring Incident Engine**. As events are submitted, the engine processes them synchronously:
- Groups related events into 5-minute sliding **incident episodes**.
- Provides **IncidentEvent traceability** linking telemetry to incidents.
- Assigns **Incident severity** and calculates an attempt-level **riskScore (0-100)**.
- Implements **telemetry clientEventId idempotency** to prevent duplicate processing.

## 6. NOT Currently Implemented (Future Roadmap)

> [!WARNING]
> The following features are **NOT** currently implemented in the codebase and belong to the future roadmap:
> 
> - **AI/CV Proctoring:** Face recognition, identity verification beyond the current foundation, head-pose tracking, or advanced behavioral analysis are not active.
> - **Screenshots / Evidence Capture:** The system does not capture, store, or transmit screenshots or webcam snapshots.
> - **Real-time Command Center:** Real-time WebSocket/SSE alerts are not implemented.
> - **Background Workers:** The Incident Engine currently runs inline during the HTTP request; Redis/background workers are planned for the future.
