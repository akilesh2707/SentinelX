import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../src/lib/prisma";

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string; assessmentId: string }> }
) {
    try {
        const params = await props.params;
        const { id: eventId, assessmentId } = params;

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
