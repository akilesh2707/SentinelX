import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { auth } from "../../../../../auth";

export async function POST(
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

        const { assessmentId, roundName } = body;

        if (!assessmentId) {
            return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
        }

        const event = await prisma.event.findFirst({ where: { id: eventId, organizerId } });
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const assessment = await prisma.assessment.findFirst({ 
            where: { id: assessmentId, organizerId } 
        });
        if (!assessment) {
            return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
        }

        if (event.status !== "DRAFT") {
            return NextResponse.json({ error: "Cannot add assessments to a non-DRAFT event" }, { status: 400 });
        }

        const existingLink = await prisma.eventAssessment.findUnique({
            where: {
                eventId_assessmentId: {
                    eventId,
                    assessmentId
                }
            }
        });

        if (existingLink) {
            return NextResponse.json({ error: "Assessment is already attached to this event" }, { status: 400 });
        }

        // Calculate next order
        const existingAssessments = await prisma.eventAssessment.findMany({
            where: { eventId }
        });
        const nextOrder = existingAssessments.length + 1;

        await prisma.eventAssessment.create({
            data: {
                eventId,
                assessmentId,
                order: nextOrder,
                roundName: roundName || null
            }
        });

        return NextResponse.json({ success: true, order: nextOrder });
    } catch (error) {
        console.error("Attach assessment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
