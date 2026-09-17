import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { createCandidateSession } from "../../../src/lib/auth/candidate-session";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { accessCode, name, email } = body;

        // 1. Basic Validation
        if (!accessCode || typeof accessCode !== "string") {
            return NextResponse.json({ error: "Access code is required" }, { status: 400 });
        }
        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
            return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
        }

        // 2. Assessment Validation
        const assessment = await prisma.assessment.findUnique({
            where: { accessCode },
            include: {
                questions: {
                    include: {
                        question: true,
                    },
                    orderBy: { order: "asc" }
                }
            }
        });

        if (!assessment) {
            return NextResponse.json({ error: "Invalid access code" }, { status: 404 });
        }

        if (assessment.status !== "PUBLISHED") {
            return NextResponse.json({ error: "Assessment is not available" }, { status: 403 });
        }

        if (assessment.questions.length === 0) {
            return NextResponse.json({ error: "Assessment has no questions" }, { status: 400 });
        }

        // Strictly validate maxAttempts as a positive integer
        const maxAttemptsStr = assessment.maxAttempts.trim();
        if (!/^[1-9]\d*$/.test(maxAttemptsStr)) {
            return NextResponse.json({ error: "Invalid assessment configuration" }, { status: 500 });
        }
        const maxAllowedAttempts = parseInt(maxAttemptsStr, 10);

        // 3. Candidate & Attempt Limit Validation inside Transaction
        // We use a transaction to ensure attempt is not partially created
        const result = await prisma.$transaction(async (tx) => {
            // Find or create Candidate (scoped by organizerId)
            let candidate = await tx.candidate.findFirst({
                where: { email, organizerId: assessment.organizerId }
            });

            if (candidate) {
                // Update name if different
                if (candidate.name !== name) {
                    candidate = await tx.candidate.update({
                        where: { id: candidate.id },
                        data: { name }
                    });
                }
            } else {
                candidate = await tx.candidate.create({
                    data: {
                        organizerId: assessment.organizerId,
                        email,
                        name,
                    }
                });
            }

            // Check existing attempts
            const existingAttemptsCount = await tx.assessmentAttempt.count({
                where: {
                    candidateId: candidate.id,
                    assessmentId: assessment.id,
                }
            });

            if (existingAttemptsCount >= maxAllowedAttempts) {
                throw new Error("MAX_ATTEMPTS_REACHED");
            }

            // 4. Create Attempt
            const attempt = await tx.assessmentAttempt.create({
                data: {
                    candidateId: candidate.id,
                    assessmentId: assessment.id,
                    status: "NOT_STARTED",
                    // startedAt, expiresAt are left null intentionally
                }
            });

            // 5. Randomize Questions if configured
            let questionsToAssign = [...assessment.questions];
            if (assessment.randomizeQuestions) {
                // Fisher-Yates shuffle
                for (let i = questionsToAssign.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [questionsToAssign[i], questionsToAssign[j]] = [questionsToAssign[j], questionsToAssign[i]];
                }
            }

            // 6. Create AttemptQuestions
            const attemptQuestionsData = questionsToAssign.map((aq, index) => ({
                attemptId: attempt.id,
                questionId: aq.questionId,
                order: index, // New order (randomized or preserved)
                marks: aq.marks,
                visited: false,
                answered: false,
            }));

            await tx.attemptQuestion.createMany({
                data: attemptQuestionsData
            });

            return attempt;
        });

        // 7. Issue Candidate Session
        await createCandidateSession(result.candidateId, result.id);

        // 8. Response Security
        return NextResponse.json({
            success: true,
            attempt: {
                id: result.id,
                assessmentId: result.assessmentId,
                status: result.status,
            }
        });

    } catch (error: any) {
        if (error.message === "MAX_ATTEMPTS_REACHED") {
            return NextResponse.json({ error: "Maximum attempts reached for this assessment" }, { status: 403 });
        }

        console.error("Attempt creation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
