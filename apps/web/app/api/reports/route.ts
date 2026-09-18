import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { auth } from "../../../auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const { searchParams } = new URL(req.url);
        const assessmentId = searchParams.get("assessmentId");

        const whereCondition: any = {
            assessment: { organizerId }
        };
        if (assessmentId) {
            whereCondition.assessmentId = assessmentId;
        }

        // Fetch all attempts for the scope (to avoid multiple count queries where we'd need them anyway for distribution)
        const attempts = await prisma.assessmentAttempt.findMany({
            where: whereCondition,
            select: {
                id: true,
                status: true,
                score: true,
                maxScore: true,
                assessmentId: true,
                assessment: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        const totalAttempts = attempts.length;
        let submittedAttempts = 0;
        let inProgressAttempts = 0;
        let expiredAttempts = 0;
        let abandonedAttempts = 0;
        let notStartedAttempts = 0;

        let eligibleScoreSum = 0;
        let eligibleScoreCount = 0;

        const scoreDistribution = {
            "0-20": 0,
            "21-40": 0,
            "41-60": 0,
            "61-80": 0,
            "81-100": 0
        };

        const assessmentBreakdownMap: Record<string, {
            id: string;
            title: string;
            totalAttempts: number;
            submittedAttempts: number;
            eligibleScoreSum: number;
            eligibleScoreCount: number;
        }> = {};

        for (const attempt of attempts) {
            // Overall Status Breakdown
            if (attempt.status === "SUBMITTED") submittedAttempts++;
            else if (attempt.status === "IN_PROGRESS") inProgressAttempts++;
            else if (attempt.status === "EXPIRED") expiredAttempts++;
            else if (attempt.status === "ABANDONED") abandonedAttempts++;
            else if (attempt.status === "NOT_STARTED") notStartedAttempts++;

            // Assessment Breakdown mapping
            if (!assessmentBreakdownMap[attempt.assessmentId]) {
                assessmentBreakdownMap[attempt.assessmentId] = {
                    id: attempt.assessmentId,
                    title: attempt.assessment.title,
                    totalAttempts: 0,
                    submittedAttempts: 0,
                    eligibleScoreSum: 0,
                    eligibleScoreCount: 0
                };
            }
            const b = assessmentBreakdownMap[attempt.assessmentId];
            b.totalAttempts++;
            if (attempt.status === "SUBMITTED") b.submittedAttempts++;

            // Analytics logic for Evaluated Attempts
            if (attempt.status === "SUBMITTED" && attempt.score !== null && attempt.maxScore !== null && attempt.maxScore > 0) {
                const percentage = (attempt.score / attempt.maxScore) * 100;

                eligibleScoreSum += percentage;
                eligibleScoreCount++;
                b.eligibleScoreSum += percentage;
                b.eligibleScoreCount++;

                // Binning explicit boundaries
                if (percentage >= 0 && percentage <= 20) {
                    scoreDistribution["0-20"]++;
                } else if (percentage > 20 && percentage <= 40) {
                    scoreDistribution["21-40"]++;
                } else if (percentage > 40 && percentage <= 60) {
                    scoreDistribution["41-60"]++;
                } else if (percentage > 60 && percentage <= 80) {
                    scoreDistribution["61-80"]++;
                } else if (percentage > 80 && percentage <= 100) {
                    scoreDistribution["81-100"]++;
                }
            }
        }

        const completionRate = totalAttempts > 0 ? (submittedAttempts / totalAttempts) * 100 : 0;
        const averageScorePercentage = eligibleScoreCount > 0 ? eligibleScoreSum / eligibleScoreCount : 0;

        const assessmentBreakdown = Object.values(assessmentBreakdownMap).map(b => ({
            assessmentId: b.id,
            title: b.title,
            totalAttempts: b.totalAttempts,
            submittedAttempts: b.submittedAttempts,
            completionRate: b.totalAttempts > 0 ? (b.submittedAttempts / b.totalAttempts) * 100 : 0,
            averageScorePercentage: b.eligibleScoreCount > 0 ? b.eligibleScoreSum / b.eligibleScoreCount : 0
        })).sort((x, y) => y.totalAttempts - x.totalAttempts); // Sort by participation

        return NextResponse.json({
            success: true,
            overall: {
                totalAttempts,
                notStartedAttempts,
                submittedAttempts,
                inProgressAttempts,
                expiredAttempts,
                abandonedAttempts,
                completionRate: Number(completionRate.toFixed(2)),
                averageScorePercentage: Number(averageScorePercentage.toFixed(2))
            },
            scoreDistribution,
            assessmentBreakdown
        });

    } catch (error) {
        console.error("Reports API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
