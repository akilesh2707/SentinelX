import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { evaluateCodingQuestion } from "../../../../../src/lib/code-execution/coding-judge";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";
import { finalizeAttempt } from "../../../../../src/lib/assessment/finalize-attempt";

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
        const { attemptQuestionId } = body;

        if (!attemptQuestionId) {
            return NextResponse.json({ error: "Missing attemptQuestionId" }, { status: 400 });
        }

        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        if (attempt.status !== "IN_PROGRESS") {
            return NextResponse.json({ error: "Coding evaluation is only available while attempt is in progress" }, { status: 403 });
        }

        if (attempt.expiresAt && new Date() >= attempt.expiresAt) {
            await finalizeAttempt(attemptId);
            return NextResponse.json({ error: "Attempt has expired and was automatically submitted" }, { status: 403 });
        }

        // Validate attemptQuestion belongs to attempt
        const attemptQuestion = await prisma.attemptQuestion.findUnique({
            where: { id: attemptQuestionId },
            include: { question: true }
        });

        if (!attemptQuestion || attemptQuestion.attemptId !== attemptId) {
            return NextResponse.json({ error: "Invalid attemptQuestionId" }, { status: 403 });
        }

        if (attemptQuestion.question.type !== "CODING") {
            return NextResponse.json({ error: "Question is not a CODING question" }, { status: 400 });
        }

        const result = await evaluateCodingQuestion(attemptQuestionId);

        if (!result) {
            return NextResponse.json({ error: "No submitted code found to evaluate" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            result // only passedTests, totalTests, score, maxScore, isCorrect. No expectedOutput.
        });

    } catch (error: any) {
        console.error("Coding evaluate error:", error);
        return NextResponse.json({ error: "Internal server error during evaluation" }, { status: 500 });
    }
}
