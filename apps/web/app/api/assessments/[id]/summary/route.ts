import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { auth } from "../../../../../auth";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const params = await props.params;
        const assessmentId = params.id;

        const assessment = await prisma.assessment.findUnique({
            where: { id: assessmentId, organizerId },
        });

        if (!assessment) {
            return NextResponse.json({ error: "Assessment not found or unauthorized" }, { status: 404 });
        }

        const attempts = await prisma.assessmentAttempt.findMany({
            where: { assessmentId },
            select: {
                status: true,
                score: true,
                maxScore: true
            }
        });

        let totalAttempts = 0;
        let submitted = 0;
        let expired = 0;
        let inProgress = 0;
        let notStarted = 0;

        let scoreSum = 0;
        let validScoresCount = 0;
        let highestScore: number | null = null;
        let lowestScore: number | null = null;

        for (const attempt of attempts) {
            totalAttempts++;
            if (attempt.status === "SUBMITTED") submitted++;
            else if (attempt.status === "EXPIRED") expired++;
            else if (attempt.status === "IN_PROGRESS") inProgress++;
            else if (attempt.status === "NOT_STARTED") notStarted++;

            // Ignore null scores for score statistics
            if (attempt.score !== null) {
                scoreSum += attempt.score;
                validScoresCount++;

                if (highestScore === null || attempt.score > highestScore) {
                    highestScore = attempt.score;
                }
                if (lowestScore === null || attempt.score < lowestScore) {
                    lowestScore = attempt.score;
                }
            }
        }

        const averageScore = validScoresCount > 0 ? Math.round(scoreSum / validScoresCount) : null;

        return NextResponse.json({
            success: true,
            summary: {
                totalAttempts,
                submitted,
                expired,
                inProgress,
                notStarted,
                averageScore,
                highestScore,
                lowestScore
            }
        });

    } catch (error) {
        console.error("Fetch assessment summary error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
