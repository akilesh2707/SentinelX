import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { auth } from "../../../../auth";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ attemptId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const { attemptId } = await context.params;

        const attempt = await prisma.assessmentAttempt.findFirst({
            where: { id: attemptId, assessment: { organizerId } },
            select: {
                id: true,
                status: true,
                riskScore: true,
                startedAt: true,
                expiresAt: true,
                submittedAt: true,
                candidate: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                assessment: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        const incidents = await prisma.incident.findMany({
            where: { attemptId },
            orderBy: { firstSeen: 'asc' },
            take: 100,
            select: {
                id: true,
                type: true,
                severity: true,
                status: true,
                firstSeen: true,
                lastSeen: true,
                eventCount: true,
                evidence: {
                    select: {
                        id: true,
                        type: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            attempt,
            incidents
        });

    } catch (error) {
        console.error("Fetch proctoring attempt detail error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
