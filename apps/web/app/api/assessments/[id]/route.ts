import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { auth } from "../../../../auth";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const { id } = await context.params;

        const assessment = await prisma.assessment.findFirst({
            where: { id, organizerId },
        });

        if (!assessment) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Assessment not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            assessment,
        });
    } catch (error) {
        console.error("Failed to fetch assessment:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch assessment",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const { id } = await context.params;
        const body = await request.json();

        // Enforce ownership by finding it first
        const existing = await prisma.assessment.findFirst({
            where: { id, organizerId }
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 });
        }

        const assessment = await prisma.assessment.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description || null,
                type: body.type,

                mcqCount: Number(body.mcqCount || 0),
                codingCount: Number(body.codingCount || 0),
                totalMarks: Number(body.totalMarks || 0),
                passingScore: Number(body.passingScore || 0),
                difficulty: body.difficulty,
                duration: Number(body.duration || 60),

                maxAttempts: body.maxAttempts || "1",
                lateJoin: Boolean(body.lateJoin),
                autoSubmit: Boolean(body.autoSubmit),
                randomizeQuestions: Boolean(body.randomizeQuestions),
                negativeMarking: Boolean(body.negativeMarking),

                securityLevel: body.securityLevel || "high",
                identityVerification: Boolean(body.identityVerification),
                primaryCamera: Boolean(body.primaryCamera),
                secondaryCamera: Boolean(body.secondaryCamera),
                browserLock: Boolean(body.browserLock),
                tabDetection: Boolean(body.tabDetection),
                audioMonitoring: Boolean(body.audioMonitoring),
                aiProctoring: Boolean(body.aiProctoring),
            },
        });

        return NextResponse.json({
            success: true,
            assessment,
        });
    } catch (error) {
        console.error("Failed to update assessment:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to update assessment",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const { id } = await context.params;

        const { count } = await prisma.assessment.deleteMany({
            where: { id, organizerId },
        });

        if (count === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Assessment not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Assessment deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete assessment:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to delete assessment",
            },
            { status: 500 }
        );
    }
}