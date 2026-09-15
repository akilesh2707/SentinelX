import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { auth } from "../../../auth";

type AssessmentQuestionInput = {
    questionId: string;
    marks: number;
    order: number;
};

function generateAccessCode(length = 6) {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < length; i++) {
        code += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return code;
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const body = await request.json();

        // Validate questions payload
        if (!body.questions || !Array.isArray(body.questions) || body.questions.length === 0) {
            return NextResponse.json(
                { success: false, error: "At least one question must be selected" },
                { status: 400 }
            );
        }

        const uniqueQuestionIds = new Set(body.questions.map((q: AssessmentQuestionInput) => q.questionId));
        if (uniqueQuestionIds.size !== body.questions.length) {
            return NextResponse.json(
                { success: false, error: "Duplicate questions are not allowed" },
                { status: 400 }
            );
        }

        const uniqueOrders = new Set(body.questions.map((q: AssessmentQuestionInput) => q.order));
        if (uniqueOrders.size !== body.questions.length) {
            return NextResponse.json(
                { success: false, error: "Duplicate order values are not allowed" },
                { status: 400 }
            );
        }

        for (const q of body.questions as AssessmentQuestionInput[]) {
            if (typeof q.questionId !== 'string' || q.questionId.trim() === '') {
                return NextResponse.json(
                    { success: false, error: "Invalid question ID" },
                    { status: 400 }
                );
            }
            if (!Number.isInteger(q.marks) || q.marks <= 0) {
                return NextResponse.json(
                    { success: false, error: "Invalid question marks" },
                    { status: 400 }
                );
            }
            if (!Number.isInteger(q.order) || q.order < 0) {
                return NextResponse.json(
                    { success: false, error: "Invalid question order" },
                    { status: 400 }
                );
            }
        }

        // Fetch questions to derive truth
        const dbQuestions = await prisma.question.findMany({
            where: { id: { in: Array.from(uniqueQuestionIds) as string[] } },
        });

        if (dbQuestions.length !== uniqueQuestionIds.size) {
            return NextResponse.json(
                { success: false, error: "One or more selected questions do not exist" },
                { status: 400 }
            );
        }

        // Derive statistics server-side
        let mcqCount = 0;
        let codingCount = 0;
        let totalMarks = 0;

        for (const q of body.questions) {
            const dbQ = dbQuestions.find(dbq => dbq.id === q.questionId);
            if (dbQ?.type === "MCQ") mcqCount++;
            if (dbQ?.type === "CODING") codingCount++;
            totalMarks += Number(q.marks);
        }

        const accessCode = generateAccessCode();

        const assessment = await prisma.$transaction(async (tx) => {
            const createdAssessment = await tx.assessment.create({
                data: {
                    title: body.title,
                    description: body.description || null,
                    type: body.type,

                    mcqCount,
                    codingCount,
                    totalMarks,
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

                    accessCode,
                    joinLink: `/join/${accessCode}`,
                    status: "PUBLISHED",
                    organizerId,
                },
            });

            await tx.assessmentQuestion.createMany({
                data: body.questions.map((q: AssessmentQuestionInput) => ({
                    assessmentId: createdAssessment.id,
                    questionId: q.questionId,
                    marks: Number(q.marks),
                    order: Number(q.order),
                    required: true,
                })),
            });

            return createdAssessment;
        });

        return NextResponse.json(
            {
                success: true,
                assessment,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to create assessment:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to create assessment",
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const assessments = await prisma.assessment.findMany({
            where: { organizerId: session.user.id },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            success: true,
            assessments,
        });
    } catch (error) {
        console.error("Failed to fetch assessments:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch assessments",
            },
            { status: 500 }
        );
    }
}