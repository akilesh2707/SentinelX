import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";

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

        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                assessment: true,
                questions: {
                    include: {
                        answer: true,
                        question: {
                            include: {
                                options: true
                            }
                        }
                    }
                }
            }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        if (attempt.status === "SUBMITTED") {
            // Idempotent return for already submitted
            return NextResponse.json({
                success: true,
                attempt: {
                    id: attempt.id,
                    status: attempt.status,
                    score: attempt.score,
                    maxScore: attempt.maxScore,
                    submittedAt: attempt.submittedAt
                }
            });
        }

        if (attempt.status !== "IN_PROGRESS" && attempt.status !== "EXPIRED") {
            return NextResponse.json({ error: `Cannot submit attempt in state ${attempt.status}` }, { status: 403 });
        }

        if (attempt.assessment.negativeMarking) {
            return NextResponse.json({ error: "Negative marking is not currently supported" }, { status: 501 });
        }

        // --- PRE-TRANSACTION CODING EVALUATION ---
        // Run Docker evaluations independently and outside of the Prisma transaction.
        // This avoids holding DB locks during slow test cases and prevents double evaluation.
        const isExpiredBeforeEval = attempt.expiresAt && new Date() >= attempt.expiresAt;

        if (!isExpiredBeforeEval) {
            const codingQuestions = attempt.questions.filter(aq =>
                aq.question.type === "CODING" &&
                aq.answer &&
                aq.answer.submittedCode &&
                aq.answer.score === null
            );

            const { evaluateCodingQuestion } = await import("../../../../../src/lib/code-execution/coding-judge");

            for (const cq of codingQuestions) {
                await evaluateCodingQuestion(cq.id);
            }
        }

        // Refetch attempt to get updated Answer scores from the coding evaluation
        const updatedAttempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                questions: {
                    include: {
                        answer: true,
                        question: { include: { options: true } }
                    }
                }
            }
        });

        if (!updatedAttempt) throw new Error("Attempt vanished during submission");

        const isExpired = updatedAttempt.expiresAt && new Date() >= updatedAttempt.expiresAt;
        const targetStatus = isExpired ? "EXPIRED" : "SUBMITTED";

        let maxScore = 0;
        let evaluatedScore = 0;
        const answerUpdates: { id: string, isCorrect: boolean | null, score: number | null }[] = [];

        for (const aq of updatedAttempt.questions) {
            maxScore += aq.marks;

            if (aq.question.type === "MCQ") {
                if (!aq.answer || !aq.answer.selectedOptionId) {
                    if (aq.answer) answerUpdates.push({ id: aq.answer.id, isCorrect: false, score: 0 });
                } else {
                    const selectedOpt = aq.question.options.find(o => o.id === aq.answer!.selectedOptionId);
                    if (selectedOpt && selectedOpt.isCorrect) {
                        evaluatedScore += aq.marks;
                        answerUpdates.push({ id: aq.answer.id, isCorrect: true, score: aq.marks });
                    } else {
                        answerUpdates.push({ id: aq.answer.id, isCorrect: false, score: 0 });
                    }
                }
            } else if (aq.question.type === "CODING") {
                if (aq.answer && aq.answer.score !== null) {
                    evaluatedScore += aq.answer.score;
                } else if (aq.answer && aq.answer.score === null) {
                    // Finalize unanswered or un-evaluable coding questions to 0
                    answerUpdates.push({ id: aq.answer.id, isCorrect: false, score: 0 });
                }
            }
        }

        // Transactional Atomic Update
        const finalAttempt = await prisma.$transaction(async (tx: any) => {
            // Update individual answers
            for (const update of answerUpdates) {
                await tx.answer.update({
                    where: { id: update.id },
                    data: {
                        isCorrect: update.isCorrect,
                        score: update.score
                    }
                });
            }

            // Update main attempt
            return await tx.assessmentAttempt.update({
                where: { id: attempt.id },
                data: {
                    status: targetStatus,
                    score: evaluatedScore,
                    maxScore: maxScore,
                    submittedAt: new Date()
                },
                select: {
                    id: true,
                    status: true,
                    score: true,
                    maxScore: true,
                    submittedAt: true
                }
            });
        });

        return NextResponse.json({
            success: true,
            attempt: finalAttempt
        });

    } catch (error) {
        console.error("Submit attempt error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
