import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";

const ALLOWED_EVENT_TYPES = [
    "TAB_SWITCH",
    "WINDOW_BLUR",
    "FULLSCREEN_EXIT",
    "NETWORK_DISCONNECT",
    "NETWORK_RECONNECT",
    "PAGE_RELOAD",
    "CAMERA_UNAVAILABLE",
    "MICROPHONE_UNAVAILABLE",
    "EXAM_STARTED",
    "EXAM_SUBMITTED"
];

const MAX_BATCH_SIZE = 50;

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: attemptId } = await context.params;

        const attempt = await requireCandidateAttempt(attemptId);

        if (!attempt) {
            return NextResponse.json({ error: "Unauthorized or Forbidden" }, { status: 403 });
        }

        // 2. Validate Attempt State
        if (attempt.status !== "IN_PROGRESS") {
            return NextResponse.json({ error: "Events can only be recorded while attempt is IN_PROGRESS" }, { status: 403 });
        }

        // 3. Payload Validation
        let payload;
        try {
            payload = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!payload || !Array.isArray(payload.events)) {
            return NextResponse.json({ error: "Missing or invalid 'events' array" }, { status: 400 });
        }

        if (payload.events.length > MAX_BATCH_SIZE) {
            return NextResponse.json({ error: `Batch size exceeds limit of ${MAX_BATCH_SIZE}` }, { status: 400 });
        }

        // 4. Construct Data for DB
        const serverTimestamp = new Date();
        const eventsToCreate = [];

        for (const event of payload.events) {
            if (!event || typeof event !== "object") continue;

            const { type, clientTimestamp, metadata } = event;

            // Reject invalid event types
            if (!ALLOWED_EVENT_TYPES.includes(type)) {
                return NextResponse.json({ error: `Invalid event type: ${type}` }, { status: 400 });
            }

            // Enforce basic metadata limits (e.g. reject massive payloads)
            const metadataString = metadata ? JSON.stringify(metadata) : null;
            if (metadataString && metadataString.length > 5000) {
                return NextResponse.json({ error: "Metadata size exceeds limits" }, { status: 400 });
            }

            // Ensure a valid client timestamp (fallback to server if missing/invalid)
            const parsedClientTimestamp = clientTimestamp ? new Date(clientTimestamp) : serverTimestamp;
            const validClientTimestamp = isNaN(parsedClientTimestamp.getTime()) ? serverTimestamp : parsedClientTimestamp;

            eventsToCreate.push({
                attemptId,
                eventType: type,
                timestamp: serverTimestamp, // Authoritative
                clientTimestamp: validClientTimestamp, // Untrusted
                metadata: metadata ? metadata : undefined
            });
        }

        // 5. Insert Batch
        if (eventsToCreate.length > 0) {
            await prisma.proctoringEvent.createMany({
                data: eventsToCreate
            });
        }

        return NextResponse.json({ success: true, count: eventsToCreate.length });

    } catch (error: any) {
        if (error.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (error.message === "FORBIDDEN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        console.error("Proctoring API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
