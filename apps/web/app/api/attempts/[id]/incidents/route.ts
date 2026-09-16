import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { auth } from "../../../../../auth";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: attemptId } = await context.params;

        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: { assessment: { select: { organizerId: true } } }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        if (attempt.assessment.organizerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const incidents = await prisma.incident.findMany({
            where: { attemptId },
            orderBy: {
                lastSeen: "desc"
            },
            include: {
                events: {
                    include: {
                        proctoringEvent: true
                    },
                    orderBy: {
                        proctoringEvent: {
                            clientTimestamp: 'asc'
                        }
                    }
                }
            }
        });

        return NextResponse.json({ success: true, incidents });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
