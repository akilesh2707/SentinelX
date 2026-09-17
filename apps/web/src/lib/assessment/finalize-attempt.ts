import { prisma } from "../prisma";

export async function finalizeAttempt(attemptId: string) {
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
        throw new Error("Attempt not found");
    }

    if (attempt.status === "SUBMITTED" || attempt.status === "EXPIRED") {
        return {
            id: attempt.id,
            status: attempt.status,
            score: attempt.score,
            maxScore: attempt.maxScore,
            submittedAt: attempt.submittedAt
        };
    }

    if (attempt.status !== "IN_PROGRESS") {
        throw new Error(`Cannot submit attempt in state ${attempt.status}`);
    }

    if (attempt.assessment.negativeMarking) {
        throw new Error("Negative marking is not currently supported");
    }

    // --- PRE-TRANSACTION CODING EVALUATION ---
    const isExpiredBeforeEval = attempt.expiresAt && new Date() >= attempt.expiresAt;

    if (!isExpiredBeforeEval) {
        const codingQuestions = attempt.questions.filter(aq =>
            aq.question.type === "CODING" &&
            aq.answer &&
            aq.answer.submittedCode &&
            aq.answer.score === null
        );

        if (codingQuestions.length > 0) {
            const { evaluateCodingQuestion } = await import("../code-execution/coding-judge");
            for (const cq of codingQuestions) {
                await evaluateCodingQuestion(cq.id);
            }
        }
    }

    // Refetch attempt to get updated Answer scores
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
                answerUpdates.push({ id: aq.answer.id, isCorrect: false, score: 0 });
            }
        }
    }

    // Transactional Atomic Update
    const finalAttempt = await prisma.$transaction(async (tx: any) => {
        for (const update of answerUpdates) {
            await tx.answer.update({
                where: { id: update.id },
                data: {
                    isCorrect: update.isCorrect,
                    score: update.score
                }
            });
        }

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

    return finalAttempt;
}
