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

        const { id: assessmentId } = await context.params;

        const assessment = await prisma.assessment.findUnique({
            where: { id: assessmentId },
            select: { organizerId: true }
        });

        if (!assessment) {
            return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
        }

        if (assessment.organizerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const incidents = await prisma.incident.findMany({
            where: {
                attempt: {
                    assessmentId: assessmentId
                }
            },
            include: {
                attempt: {
                    include: {
                        candidate: true
                    }
                }
            },
            orderBy: {
                lastSeen: "desc"
            }
        });

        return NextResponse.json({ success: true, incidents });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
