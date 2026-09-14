import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const eventId = params.id;
        const body = await req.json();

        const { assessmentId } = body;

        if (!assessmentId) {
            return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
        }

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
        if (!assessment) {
            return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
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

        await prisma.eventAssessment.create({
            data: {
                eventId,
                assessmentId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Attach assessment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
