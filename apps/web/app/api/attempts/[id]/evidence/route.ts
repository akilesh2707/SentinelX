import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";

const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

        if (attempt.status !== "IN_PROGRESS") {
            return NextResponse.json({ error: "Attempt is not IN_PROGRESS" }, { status: 403 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { incidentId, type, storageKey, mimeType, sizeBytes, capturedAt, clientEvidenceId } = body;

        if (!incidentId || type !== "CAMERA_SNAPSHOT" || !storageKey || !mimeType || typeof sizeBytes !== "number" || !capturedAt) {
            return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
        }

        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            return NextResponse.json({ error: "Invalid mimeType" }, { status: 400 });
        }

        if (sizeBytes <= 0 || sizeBytes > MAX_EVIDENCE_SIZE) {
            return NextResponse.json({ error: "Invalid sizeBytes" }, { status: 400 });
        }

        const parsedCapturedAt = new Date(capturedAt);
        if (isNaN(parsedCapturedAt.getTime())) {
            return NextResponse.json({ error: "Invalid capturedAt" }, { status: 400 });
        }

        // Verify incident belongs to this attempt
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId }
        });

        if (!incident || incident.attemptId !== attemptId) {
            return NextResponse.json({ error: "Incident not found or unauthorized" }, { status: 403 });
        }

        if (clientEvidenceId) {
            const existing = await prisma.evidence.findUnique({
                where: {
                    incidentId_clientEvidenceId: {
                        incidentId,
                        clientEvidenceId
                    }
                }
            });
            if (existing) {
                return NextResponse.json({ success: true, evidence: {
                    id: existing.id,
                    incidentId: existing.incidentId,
                    type: existing.type,
                    storageKey: existing.storageKey,
                    mimeType: existing.mimeType,
                    sizeBytes: existing.sizeBytes,
                    capturedAt: existing.capturedAt,
                    createdAt: existing.createdAt
                } });
            }
        } else {
            // Best effort deduplication based on storageKey and capturedAt
            const existing = await prisma.evidence.findFirst({
                where: {
                    incidentId,
                    storageKey,
                    capturedAt: parsedCapturedAt
                }
            });
            if (existing) {
                return NextResponse.json({ success: true, evidence: {
                    id: existing.id,
                    incidentId: existing.incidentId,
                    type: existing.type,
                    storageKey: existing.storageKey,
                    mimeType: existing.mimeType,
                    sizeBytes: existing.sizeBytes,
                    capturedAt: existing.capturedAt,
                    createdAt: existing.createdAt
                } });
            }
        }

        const evidence = await prisma.evidence.create({
            data: {
                incidentId,
                clientEvidenceId: clientEvidenceId || null,
                type: "CAMERA_SNAPSHOT",
                storageKey,
                mimeType,
                sizeBytes,
                capturedAt: parsedCapturedAt
            }
        });

        return NextResponse.json({ success: true, evidence: {
            id: evidence.id,
            incidentId: evidence.incidentId,
            type: evidence.type,
            storageKey: evidence.storageKey,
            mimeType: evidence.mimeType,
            sizeBytes: evidence.sizeBytes,
            capturedAt: evidence.capturedAt,
            createdAt: evidence.createdAt
        } });
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (error.message === "FORBIDDEN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        console.error("Candidate Evidence API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
