import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../src/lib/prisma";
import { auth } from "../../../../../../auth";

export async function PATCH(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const params = await props.params;
        const eventId = params.id;
        const body = await req.json();

        const { assessmentIds } = body;

        if (!assessmentIds || !Array.isArray(assessmentIds)) {
            return NextResponse.json({ error: "assessmentIds array is required" }, { status: 400 });
        }

        const uniqueIds = new Set(assessmentIds);
        if (uniqueIds.size !== assessmentIds.length) {
            return NextResponse.json({ error: "Duplicate assessment IDs provided" }, { status: 400 });
        }

        // Verify Event ownership
        const event = await prisma.event.findFirst({
            where: { id: eventId, organizerId }
        });
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (event.status !== "DRAFT") {
            return NextResponse.json({ error: "Cannot reorder assessments in a non-DRAFT event" }, { status: 400 });
        }

        // Fetch existing assessments for this event
        const existingLinks = await prisma.eventAssessment.findMany({
            where: { eventId }
        });

        const existingIds = new Set(existingLinks.map(link => link.assessmentId));

        // Validate that provided IDs match exactly the existing ones
        if (existingIds.size !== assessmentIds.length) {
            return NextResponse.json({ error: "Provided assessment IDs do not match the event's assessments" }, { status: 400 });
        }

        for (const id of assessmentIds) {
            if (!existingIds.has(id)) {
                return NextResponse.json({ error: `Assessment ID ${id} is not attached to this event` }, { status: 400 });
            }
        }

        // Transactionally update the order (1-based sequential)
        await prisma.$transaction(
            assessmentIds.map((assessmentId, index) =>
                prisma.eventAssessment.update({
                    where: {
                        eventId_assessmentId: {
                            eventId,
                            assessmentId
                        }
                    },
                    data: {
                        order: index + 1
                    }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reorder assessments error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
