import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../src/lib/prisma";
import { auth } from "../../../../../../auth";

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string; assessmentId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const params = await props.params;
        const { id: eventId, assessmentId } = params;

        // Verify ownership
        const assessment = await prisma.assessment.findFirst({
            where: { id: assessmentId, organizerId }
        });
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

        if (!existingLink) {
            return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
        }

        await prisma.eventAssessment.delete({
            where: {
                eventId_assessmentId: {
                    eventId,
                    assessmentId
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Remove assessment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
