import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { auth } from "../../../../auth";

export async function GET(
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

        const event = await prisma.event.findFirst({
            where: { id: eventId, organizerId },
            select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                status: true,
                createdAt: true,
                assessments: {
                    select: {
                        assessment: {
                            select: {
                                id: true,
                                title: true,
                                type: true,
                                duration: true,
                                status: true,
                                _count: {
                                    select: {
                                        questions: true,
                                        attempts: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const formattedAssessments = event.assessments.map(relation => ({
            id: relation.assessment.id,
            title: relation.assessment.title,
            type: relation.assessment.type,
            duration: relation.assessment.duration,
            status: relation.assessment.status,
            questionCount: relation.assessment._count.questions,
            attemptCount: relation.assessment._count.attempts
        }));

        return NextResponse.json({
            success: true,
            event: {
                id: event.id,
                title: event.title,
                description: event.description,
                startDate: event.startDate,
                endDate: event.endDate,
                status: event.status,
                createdAt: event.createdAt
            },
            assessments: formattedAssessments
        });

    } catch (error) {
        console.error("Fetch event detail error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

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

        const { title, description, startDate, endDate, status } = body;

        const existingEvent = await prisma.event.findFirst({ where: { id: eventId, organizerId } });
        if (!existingEvent) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const updateData: any = {};

        if (title !== undefined) {
            if (typeof title !== "string" || title.trim() === "") {
                return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
            }
            updateData.title = title;
        }

        if (description !== undefined) updateData.description = description;

        if (status !== undefined) {
            const validStatuses = ["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED"];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }
            updateData.status = status;
        }

        let newStart = existingEvent.startDate;
        let newEnd = existingEvent.endDate;

        if (startDate !== undefined) {
            newStart = startDate ? new Date(startDate) : null;
            updateData.startDate = newStart;
        }
        if (endDate !== undefined) {
            newEnd = endDate ? new Date(endDate) : null;
            updateData.endDate = newEnd;
        }

        if (newStart && newEnd && newEnd <= newStart) {
            return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
        }

        const event = await prisma.event.update({
            where: { id: eventId },
            data: updateData
        });

        return NextResponse.json({ success: true, event });
    } catch (error) {
        console.error("Update event error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
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

        const existingEvent = await prisma.event.findFirst({ where: { id: eventId, organizerId } });
        if (!existingEvent) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // EventAssessment has onDelete: Cascade, so deleting the event removes links.
        // It does NOT delete Assessments.
        await prisma.event.delete({ where: { id: eventId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete event error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
