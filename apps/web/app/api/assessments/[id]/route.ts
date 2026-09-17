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

        if (existing.status === "CLOSED") {
            return NextResponse.json({ success: false, error: "Cannot edit a CLOSED assessment" }, { status: 409 });
        }

        let updateData: any = {};

        if (existing.status === "PUBLISHED") {
            // Check for locked fields
            const lockedFields = [
                'title', 'questions', 'mcqCount', 'codingCount', 'type', 'duration', 'totalMarks',
                'passingScore', 'maxAttempts', 'randomizeQuestions', 'negativeMarking', 'securityLevel',
                'identityVerification', 'primaryCamera', 'secondaryCamera', 'browserLock', 'tabDetection',
                'audioMonitoring', 'aiProctoring', 'accessCode'
            ];
            const attemptedLockedFields = lockedFields.filter(field => body[field] !== undefined);
            
            if (attemptedLockedFields.length > 0) {
                return NextResponse.json({ 
                    success: false, 
                    error: `Cannot modify locked fields in PUBLISHED state: ${attemptedLockedFields.join(', ')}` 
                }, { status: 409 });
            }

            // Allow operational fields
            if (body.description !== undefined) updateData.description = body.description || null;
            if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
            if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
            if (body.lateJoin !== undefined) updateData.lateJoin = Boolean(body.lateJoin);
            // DO NOT allow autoSubmit to change, per user requirement
        } else {
            // DRAFT state: normal editing
            updateData = {
                title: body.title !== undefined ? body.title : existing.title,
                description: body.description !== undefined ? body.description || null : existing.description,
                type: body.type !== undefined ? body.type : existing.type,

                mcqCount: body.mcqCount !== undefined ? Number(body.mcqCount) : existing.mcqCount,
                codingCount: body.codingCount !== undefined ? Number(body.codingCount) : existing.codingCount,
                totalMarks: body.totalMarks !== undefined ? Number(body.totalMarks) : existing.totalMarks,
                passingScore: body.passingScore !== undefined ? Number(body.passingScore) : existing.passingScore,
                difficulty: body.difficulty !== undefined ? body.difficulty : existing.difficulty,
                duration: body.duration !== undefined ? Number(body.duration) : existing.duration,
                
                startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : existing.startDate,
                endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : existing.endDate,

                maxAttempts: body.maxAttempts !== undefined ? body.maxAttempts : existing.maxAttempts,
                lateJoin: body.lateJoin !== undefined ? Boolean(body.lateJoin) : existing.lateJoin,
                autoSubmit: body.autoSubmit !== undefined ? Boolean(body.autoSubmit) : existing.autoSubmit,
                randomizeQuestions: body.randomizeQuestions !== undefined ? Boolean(body.randomizeQuestions) : existing.randomizeQuestions,
                negativeMarking: body.negativeMarking !== undefined ? Boolean(body.negativeMarking) : existing.negativeMarking,

                securityLevel: body.securityLevel !== undefined ? body.securityLevel : existing.securityLevel,
                identityVerification: body.identityVerification !== undefined ? Boolean(body.identityVerification) : existing.identityVerification,
                primaryCamera: body.primaryCamera !== undefined ? Boolean(body.primaryCamera) : existing.primaryCamera,
                secondaryCamera: body.secondaryCamera !== undefined ? Boolean(body.secondaryCamera) : existing.secondaryCamera,
                browserLock: body.browserLock !== undefined ? Boolean(body.browserLock) : existing.browserLock,
                tabDetection: body.tabDetection !== undefined ? Boolean(body.tabDetection) : existing.tabDetection,
                audioMonitoring: body.audioMonitoring !== undefined ? Boolean(body.audioMonitoring) : existing.audioMonitoring,
                aiProctoring: body.aiProctoring !== undefined ? Boolean(body.aiProctoring) : existing.aiProctoring,
            };
        }

        const assessment = await prisma.assessment.update({
            where: { id },
            data: updateData,
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

        const existing = await prisma.assessment.findFirst({
            where: { id, organizerId }
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 });
        }

        if (existing.status !== "DRAFT") {
            return NextResponse.json({ success: false, error: "Only DRAFT assessments can be deleted" }, { status: 409 });
        }

        await prisma.assessment.delete({
            where: { id },
        });

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