import { prisma } from "../prisma";
import { runPythonCode } from "./docker-runner";

export type TestCaseStatus = "PASSED" | "FAILED" | "TIMEOUT" | "ERROR";

export type TestCaseResult = {
    id: string;
    status: TestCaseStatus;
    runtimeMs: number;
};

export type CodingEvaluationResult = {
    passedTests: number;
    totalTests: number;
    score: number;
    maxScore: number;
    isCorrect: boolean;
    details?: TestCaseResult[];
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

    // Prevent re-evaluation if already fully evaluated (score and details present)
    if (attemptQuestion.answer.score !== null && attemptQuestion.answer.evaluationDetails !== null) {
        return {
            passedTests: -1, // Hidden internally for cached results
            totalTests: attemptQuestion.question.testCases.length,
            score: attemptQuestion.answer.score,
            maxScore: attemptQuestion.marks,
            isCorrect: !!attemptQuestion.answer.isCorrect,
            details: attemptQuestion.answer.evaluationDetails as any
        };
    }

    const testCases = attemptQuestion.question.testCases;
    let earnedTestMarks = 0;
    let totalTestMarks = testCases.reduce((sum, tc) => sum + tc.marks, 0);
    let passedTests = 0;
    
    const evaluationDetails: TestCaseResult[] = [];

    for (const test of testCases) {
        let status: TestCaseStatus = "FAILED";
        const result = await runPythonCode(attemptQuestion.answer.submittedCode, test.input);

        if (result.timedOut) {
            status = "TIMEOUT";
        } else if (result.exitCode !== 0) {
            status = "ERROR";
            console.error("Docker Execution Error stderr:", result.stderr);
        } else {
            const actual = result.stdout.trimEnd();
            const expected = test.expectedOutput.trimEnd();

            if (actual === expected) {
                status = "PASSED";
                earnedTestMarks += test.marks;
                passedTests++;
            } else {
                status = "FAILED";
            }
        }

        evaluationDetails.push({
            id: test.id,
            status,
            runtimeMs: result.durationMs
        });
    }

    let finalScore = 0;
    let isCorrect = false;

    if (totalTestMarks > 0) {
        finalScore = Math.round((earnedTestMarks / totalTestMarks) * attemptQuestion.marks);
        if (finalScore < 0) finalScore = 0;
        if (finalScore > attemptQuestion.marks) finalScore = attemptQuestion.marks;
        isCorrect = passedTests === testCases.length && testCases.length > 0;
    } else {
        // total test marks == 0 -> invalid configuration
        finalScore = 0;
        isCorrect = false;
    }

    await prisma.answer.update({
        where: { id: attemptQuestion.answer.id },
        data: {
            score: finalScore,
            isCorrect: isCorrect,
            evaluationDetails: evaluationDetails as any
        }
    });

    return {
        passedTests,
        totalTests: testCases.length,
        score: finalScore,
        maxScore: attemptQuestion.marks,
        isCorrect,
        details: evaluationDetails
    };
}
