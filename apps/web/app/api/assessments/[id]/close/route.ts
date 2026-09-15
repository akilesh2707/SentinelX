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
        const assessmentId = params.id;

        const assessment = await prisma.assessment.findFirst({
            where: { id: assessmentId, organizerId },
        });

        if (!assessment) {
            return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 });
        }

        if (assessment.status !== "PUBLISHED") {
            return NextResponse.json({ success: false, error: `Only PUBLISHED assessments can be closed` }, { status: 409 });
        }

        const closed = await prisma.assessment.update({
            where: { id: assessmentId },
            data: { status: "CLOSED" }
        });

        return NextResponse.json({ success: true, assessment: closed });

    } catch (error) {
        console.error("Failed to close assessment:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
