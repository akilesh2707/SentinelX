import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";

// GET /api/attempts/[id]/answers
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const attemptId = params.id;

        const authAttempt = await requireCandidateAttempt(attemptId);
        if (!authAttempt) {
            return NextResponse.json({ error: "Unauthorized access to attempt" }, { status: 403 });
        }

        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            select: { status: true, expiresAt: true }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        if (attempt.status !== "IN_PROGRESS") {
            return NextResponse.json({ error: "Answers can only be retrieved while attempt is in progress" }, { status: 403 });
        }

        if (attempt.expiresAt && new Date() >= attempt.expiresAt) {
            return NextResponse.json({ error: "Attempt has expired" }, { status: 403 });
        }

        const answers = await prisma.answer.findMany({
            where: {
                attemptQuestion: { attemptId }
            },
            select: {
                id: true,
                attemptQuestionId: true,
                selectedOptionId: true,
                submittedCode: true,
                language: true,
                answeredAt: true
            }
        });

        return NextResponse.json({ success: true, answers });

    } catch (error) {
        console.error("Fetch answers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/attempts/[id]/answers
export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const attemptId = params.id;

        const authAttempt = await requireCandidateAttempt(attemptId);
        if (!authAttempt) {
            return NextResponse.json({ error: "Unauthorized access to attempt" }, { status: 403 });
        }

        const body = await req.json();

        const { attemptQuestionId, selectedOptionId, submittedCode, language } = body;

        if (!attemptQuestionId) {
            return NextResponse.json({ error: "attemptQuestionId is required" }, { status: 400 });
        }

        // 1. Fetch Attempt and validate state
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            select: { status: true, expiresAt: true }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        if (attempt.status !== "IN_PROGRESS") {
            return NextResponse.json({ error: "Attempt is not in progress" }, { status: 403 });
        }

        if (attempt.expiresAt && new Date() >= attempt.expiresAt) {
            return NextResponse.json({ error: "Attempt has expired" }, { status: 403 });
        }

        // 2. Validate AttemptQuestion belongs to Attempt and fetch related Question
        const attemptQuestion = await prisma.attemptQuestion.findUnique({
            where: { id: attemptQuestionId },
            include: {
                question: {
                    include: { options: true }
                }
            }
        });

        if (!attemptQuestion) {
            return NextResponse.json({ error: "AttemptQuestion not found" }, { status: 404 });
        }

        if (attemptQuestion.attemptId !== attemptId) {
            return NextResponse.json({ error: "Cross-attempt injection rejected" }, { status: 403 });
        }

        const question = attemptQuestion.question;

        // 3. Prepare payload and strictly validate based on Question type
        let savePayload: any = {
            answeredAt: new Date()
        };

        if (question.type === "MCQ") {
            if (!selectedOptionId) {
                return NextResponse.json({ error: "selectedOptionId is required for MCQ" }, { status: 400 });
            }

            // Secure validation: confirm option actually belongs to this specific question
            const isValidOption = question.options.some((opt: any) => opt.id === selectedOptionId);
            if (!isValidOption) {
                return NextResponse.json({ error: "Invalid option for this question" }, { status: 400 });
            }

            savePayload.selectedOptionId = selectedOptionId;
            savePayload.submittedCode = null;
            savePayload.language = null;
        } else if (question.type === "CODING") {
            if (submittedCode === undefined) {
                return NextResponse.json({ error: "submittedCode is required for CODING" }, { status: 400 });
            }

            savePayload.selectedOptionId = null;
            savePayload.submittedCode = submittedCode;
            savePayload.language = language || "javascript";
        } else {
            return NextResponse.json({ error: "Unsupported question type" }, { status: 400 });
        }

        // 4. Atomic Upsert & State Mutation (Transaction)
        const result = await prisma.$transaction(async (tx: any) => {
            const answer = await tx.answer.upsert({
                where: { attemptQuestionId },
                update: savePayload,
                create: {
                    attemptQuestionId,
                    ...savePayload
                },
                select: {
                    id: true,
                    attemptQuestionId: true,
                    answeredAt: true
                }
            });

            await tx.attemptQuestion.update({
                where: { id: attemptQuestionId },
                data: { answered: true }
            });

            return answer;
        });

        return NextResponse.json({
            success: true,
            answer: result
        });

    } catch (error) {
        console.error("Save answer error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
