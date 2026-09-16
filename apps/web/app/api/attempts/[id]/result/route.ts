import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const attemptId = params.id;

        // Candidate session authorization checks attempt ownership natively
        const authAttempt = await requireCandidateAttempt(attemptId);
        if (!authAttempt) {
            return NextResponse.json({ error: "Unauthorized access to attempt" }, { status: 403 });
        }

        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                assessment: {
                    select: {
                        title: true
                    }
                }
            }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        // Only return finalized results for submitted or expired attempts
        // If it is somehow in progress, they shouldn't view results yet
        if (attempt.status !== "SUBMITTED" && attempt.status !== "EXPIRED") {
            return NextResponse.json({ error: `Results not available for state ${attempt.status}` }, { status: 400 });
        }

        const score = attempt.score ?? 0;
        const maxScore = attempt.maxScore ?? 0;

        const percentage = maxScore > 0 
            ? Math.round((score / maxScore) * 100) 
            : 0;

        return NextResponse.json({
            success: true,
            result: {
                attemptId: attempt.id,
                assessmentId: attempt.assessmentId,
                assessmentTitle: attempt.assessment.title,
                status: attempt.status,
                score: attempt.score,
                maxScore: attempt.maxScore,
                percentage,
                submittedAt: attempt.submittedAt,
                startedAt: attempt.startedAt
            }
        });

    } catch (error) {
        console.error("Result fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
