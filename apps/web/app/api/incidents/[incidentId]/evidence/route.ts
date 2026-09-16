import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { auth } from "../../../../../auth";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ incidentId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { incidentId } = await context.params;

        const incident = await prisma.incident.findUnique({
            where: { id: incidentId },
            include: {
                attempt: {
                    include: {
                        assessment: {
                            select: { organizerId: true }
                        }
                    }
                }
            }
        });

        if (!incident) {
            return NextResponse.json({ error: "Incident not found" }, { status: 404 });
        }

        if (incident.attempt.assessment.organizerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const evidence = await prisma.evidence.findMany({
            where: { incidentId },
            select: {
                id: true,
                incidentId: true,
                type: true,
                storageKey: true,
                mimeType: true,
                sizeBytes: true,
                capturedAt: true,
                createdAt: true
            },
            orderBy: {
                capturedAt: 'asc'
            }
        });

        return NextResponse.json({ success: true, evidence });
    } catch (error) {
        console.error("Organizer Evidence API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
