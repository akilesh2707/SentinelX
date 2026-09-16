import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";
import { EvidenceStorage } from "../../../../../src/lib/storage";
import crypto from "crypto";

const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024; // 10MB

function getValidatedImageType(buffer: Buffer): { ext: string, mime: string } | null {
    if (buffer.length < 12) return null;

    // JPEG magic bytes: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return { ext: "jpeg", mime: "image/jpeg" };
    }

    // WebP magic bytes: RIFF....WEBP
    const riff = buffer.toString('ascii', 0, 4);
    const webp = buffer.toString('ascii', 8, 12);
    if (riff === 'RIFF' && webp === 'WEBP') {
        return { ext: "webp", mime: "image/webp" };
    }

    return null;
}

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

        let formData;
        try {
            formData = await req.formData();
        } catch {
            return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
        }

        const incidentId = formData.get("incidentId") as string;
        const clientEvidenceId = formData.get("clientEvidenceId") as string | null;
        const type = formData.get("type") as string;
        const capturedAt = formData.get("capturedAt") as string;
        const file = formData.get("file") as File | null;

        if (!incidentId || type !== "CAMERA_SNAPSHOT" || !capturedAt || !file) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (file.size <= 0 || file.size > MAX_EVIDENCE_SIZE) {
            return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
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

        // Check Idempotency before reading the file fully and saving
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
        }

        // Read file bytes
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Server-side validation of actual file content (do not trust client mimeType/extension)
        const imageType = getValidatedImageType(buffer);
        if (!imageType) {
            return NextResponse.json({ error: "Invalid image format. Only JPEG or WebP allowed." }, { status: 400 });
        }

        const evidenceId = crypto.randomUUID();
        
        // Save file locally outside public/
        const storageKey = await EvidenceStorage.save(attemptId, evidenceId, imageType.ext, buffer);

        // Save DB metadata
        const evidence = await prisma.evidence.create({
            data: {
                id: evidenceId,
                incidentId,
                clientEvidenceId: clientEvidenceId || null,
                type: "CAMERA_SNAPSHOT",
                storageKey,
                mimeType: imageType.mime,
                sizeBytes: buffer.length,
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
