import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { auth } from "../../../../auth";

export async function PATCH(
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

        const body = await req.json();
        const { status } = body;

        if (!status || !["UNRESOLVED", "REVIEWED", "DISMISSED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const updated = await prisma.incident.update({
            where: { id: incidentId },
            data: { status }
        });

        return NextResponse.json({ success: true, incident: updated });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
