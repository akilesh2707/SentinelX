import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: attemptId } = await context.params;

        const attempt = await requireCandidateAttempt(attemptId);
        if (!attempt) {
            return NextResponse.json({ error: "Unauthorized or Forbidden" }, { status: 403 });
        }

        // Return just the minimum information needed for the client to test snapshot upload
        const incident = await prisma.incident.findFirst({
            where: { attemptId },
            orderBy: { lastSeen: "desc" },
            select: { id: true }
        });

        return NextResponse.json({ success: true, incidentId: incident?.id || null });
    } catch (error) {
        console.error("Candidate Active Incident API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
