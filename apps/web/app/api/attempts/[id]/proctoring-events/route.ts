import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";

const INCIDENT_POINTS: Record<string, number> = {
    WINDOW_BLUR: 2,
    TAB_SWITCH: 5,
    FULLSCREEN_EXIT: 5,
    PAGE_RELOAD: 2,
    CAMERA_UNAVAILABLE: 10,
    MICROPHONE_UNAVAILABLE: 5,
    NETWORK_DISCONNECT: 0,
    AI_NO_FACE: 3,
    AI_MULTIPLE_FACES: 4,
    AI_LOOKING_AWAY: 2,
    AI_CAMERA_OBSTRUCTED: 4
};

const IGNORED_EVENTS = ["EXAM_STARTED", "EXAM_SUBMITTED", "NETWORK_RECONNECT"];

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
    "EXAM_SUBMITTED",
    "AI_NO_FACE",
    "AI_MULTIPLE_FACES",
    "AI_LOOKING_AWAY",
    "AI_CAMERA_OBSTRUCTED"
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
        const validEvents: any[] = [];

        for (const event of payload.events) {
            if (!event || typeof event !== "object") continue;

            const { clientEventId, type, clientTimestamp, metadata } = event;

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

            validEvents.push({
                attemptId,
                eventType: type,
                timestamp: serverTimestamp, // Authoritative
                clientTimestamp: validClientTimestamp, // Untrusted
                clientEventId: typeof clientEventId === 'string' ? clientEventId : undefined,
                metadata: metadata ? metadata : undefined
            });
        }

        if (validEvents.length === 0) {
            return NextResponse.json({ success: true, count: 0 });
        }

        // Sort chronologically by clientTimestamp to process episodes correctly
        validEvents.sort((a, b) => a.clientTimestamp.getTime() - b.clientTimestamp.getTime());

        let newRiskPoints = 0;
        const eventIncidents: Record<string, string> = {};

        await prisma.$transaction(async (tx) => {
            for (const ev of validEvents) {
                // Deduplicate by clientEventId
                if (ev.clientEventId) {
                    const existingRaw = await tx.proctoringEvent.findUnique({
                        where: {
                            attemptId_clientEventId: {
                                attemptId,
                                clientEventId: ev.clientEventId
                            }
                        }
                    });
                    if (existingRaw) {
                        continue;
                    }
                }

                // Insert raw event
                const createdEvent = await tx.proctoringEvent.create({
                    data: ev
                });

                if (IGNORED_EVENTS.includes(ev.eventType)) {
                    continue;
                }

                const incidentType = ev.eventType as any;
                const episodeWindowMs = 5 * 60 * 1000;
                const windowStart = new Date(ev.clientTimestamp.getTime() - episodeWindowMs);

                // Find active episode
                const existingIncident = await tx.incident.findFirst({
                    where: {
                        attemptId,
                        type: incidentType,
                        lastSeen: { gte: windowStart }
                    },
                    orderBy: { lastSeen: 'desc' }
                });

                if (existingIncident) {
                    // We found an active episode, add to it
                    await tx.incident.update({
                        where: { id: existingIncident.id },
                        data: {
                            lastSeen: ev.clientTimestamp > existingIncident.lastSeen ? ev.clientTimestamp : existingIncident.lastSeen,
                            eventCount: { increment: 1 }
                        }
                    });

                    await tx.incidentEvent.create({
                        data: {
                            incidentId: existingIncident.id,
                            proctoringEventId: createdEvent.id
                        }
                    });

                    if (ev.clientEventId) {
                        eventIncidents[ev.clientEventId] = existingIncident.id;
                    }
                } else {
                    // Start new episode
                    const points = INCIDENT_POINTS[ev.eventType] || 0;
                    const severity = points >= 10 ? "HIGH" : (points >= 5 ? "MEDIUM" : "LOW");
                    
                    const newIncident = await tx.incident.create({
                        data: {
                            attemptId,
                            type: incidentType,
                            severity,
                            firstSeen: ev.clientTimestamp,
                            lastSeen: ev.clientTimestamp,
                            eventCount: 1,
                        }
                    });

                    await tx.incidentEvent.create({
                        data: {
                            incidentId: newIncident.id,
                            proctoringEventId: createdEvent.id
                        }
                    });

                    if (ev.clientEventId) {
                        eventIncidents[ev.clientEventId] = newIncident.id;
                    }

                    newRiskPoints += points;
                }
            }

            if (newRiskPoints > 0) {
                const currentAttempt = await tx.assessmentAttempt.findUnique({ where: { id: attemptId } });
                if (currentAttempt) {
                    const updatedScore = Math.min(100, (currentAttempt.riskScore || 0) + newRiskPoints);
                    await tx.assessmentAttempt.update({
                        where: { id: attemptId },
                        data: { riskScore: updatedScore }
                    });
                }
            }
        });

        return NextResponse.json({ success: true, count: validEvents.length, incidents: eventIncidents });

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
