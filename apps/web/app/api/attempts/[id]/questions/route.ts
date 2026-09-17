import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";
import { finalizeAttempt } from "../../../../../src/lib/assessment/finalize-attempt";

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

        // 1. Verify Attempt Exists & State
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            select: { status: true, expiresAt: true }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        if (attempt.status !== "IN_PROGRESS") {
            return NextResponse.json({ error: "Questions are only available when the attempt is in progress" }, { status: 403 });
        }

        if (attempt.expiresAt && new Date() >= attempt.expiresAt) {
            // Lazy Evaluation
            await finalizeAttempt(attemptId);
            return NextResponse.json({ error: "Attempt has expired and was automatically submitted" }, { status: 403 });
        }

        // 2. Fetch securely
        const attemptQuestions = await prisma.attemptQuestion.findMany({
            where: { attemptId },
            orderBy: { order: "asc" },
            select: {
                id: true,
                order: true,
                marks: true,
                answered: true,
                visited: true,
                question: {
                    select: {
                        id: true,
                        type: true,
                        title: true,
                        description: true,
                        topic: true,
                        difficulty: true,
                        inputFormat: true,
                        outputFormat: true,
                        constraints: true,
                        starterCode: true,
                        options: {
                            orderBy: { order: "asc" },
                            select: {
                                id: true,
                                optionKey: true,
                                text: true,
                                order: true,
                                // isCorrect is explicitly EXCLUDED
                            }
                        }
                        // testCases and expectedOutput are explicitly EXCLUDED
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            questions: attemptQuestions
        });

    } catch (error) {
        console.error("Fetch questions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
