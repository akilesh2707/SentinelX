import { prisma } from "../prisma";
import { runPythonCode } from "./docker-runner";

export type CodingEvaluationResult = {
    passedTests: number;
    totalTests: number;
    score: number;
    maxScore: number;
    isCorrect: boolean;
};

export async function evaluateCodingQuestion(attemptQuestionId: string): Promise<CodingEvaluationResult | null> {
    const attemptQuestion = await prisma.attemptQuestion.findUnique({
        where: { id: attemptQuestionId },
        include: {
            answer: true,
            question: {
                include: {
                    testCases: {
                        orderBy: { order: "asc" }
                    }
                }
            }
        }
    });

    if (!attemptQuestion || attemptQuestion.question.type !== "CODING") {
        throw new Error("Invalid coding question");
    }

    if (!attemptQuestion.answer || !attemptQuestion.answer.submittedCode) {
        return null;
    }

    // Prevent re-evaluation
    if (attemptQuestion.answer.score !== null) {
        return {
            passedTests: -1, // Hidden internally for cached results
            totalTests: attemptQuestion.question.testCases.length,
            score: attemptQuestion.answer.score,
            maxScore: attemptQuestion.marks,
            isCorrect: !!attemptQuestion.answer.isCorrect
        };
    }

    const testCases = attemptQuestion.question.testCases;
    let earnedCodingMarks = 0;
    let totalCodingMarks = testCases.reduce((sum, tc) => sum + tc.marks, 0);
    let passedTests = 0;
    let executionStopped = false;

    for (const test of testCases) {
        if (executionStopped) {
            // Further tests get 0 marks
            continue;
        }

        const result = await runPythonCode(attemptQuestion.answer.submittedCode, test.input);

        if (result.timedOut) {
            // Execution abuse / infinite loop - halt evaluation
            executionStopped = true;
            continue;
        }

        if (result.exitCode === 0) {
            // Normalize trailing whitespace and newlines for robust comparison
            const actual = result.stdout.trimEnd();
            const expected = test.expectedOutput.trimEnd();

            if (actual === expected) {
                earnedCodingMarks += test.marks;
                passedTests++;
            }
        } else {
            // Runtime error or syntax error -> fail this test, but keep evaluating others unless we want to halt on all errors.
            // For MVP, we continue evaluating subsequent tests on normal failure/runtime error.
        }
    }

    const isCorrect = passedTests === testCases.length && testCases.length > 0;

    // Persist individually using a short transaction / update
    await prisma.answer.update({
        where: { id: attemptQuestion.answer.id },
        data: {
            score: earnedCodingMarks,
            isCorrect: isCorrect
        }
    });

    return {
        passedTests,
        totalTests: testCases.length,
        score: earnedCodingMarks,
        maxScore: totalCodingMarks,
        isCorrect
    };
}
