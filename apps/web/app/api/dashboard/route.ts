import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { auth } from "../../../auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        // 1. Core Metrics
        const totalAssessments = await prisma.assessment.count({ where: { organizerId } });
        const publishedAssessments = await prisma.assessment.count({ where: { organizerId, status: "PUBLISHED" } });
        const totalCandidates = await prisma.candidate.count({ where: { attempts: { some: { assessment: { organizerId } } } } });
        const totalAttempts = await prisma.assessmentAttempt.count({ where: { assessment: { organizerId } } });

        const submittedAttempts = await prisma.assessmentAttempt.count({ where: { assessment: { organizerId }, status: "SUBMITTED" } });
        const inProgressAttempts = await prisma.assessmentAttempt.count({ where: { assessment: { organizerId }, status: "IN_PROGRESS" } });

        // 2. Average Score Percentage
        const evaluatedAttempts = await prisma.assessmentAttempt.findMany({
            where: {
                assessment: { organizerId },
                status: "SUBMITTED",
                score: { not: null },
                maxScore: { gt: 0 }
            },
            select: {
                score: true,
                maxScore: true
            }
        });

        let averageScorePercentage = null;
        if (evaluatedAttempts.length > 0) {
            const totalPercentage = evaluatedAttempts.reduce((sum, attempt) => {
                const perc = (attempt.score! / attempt.maxScore!) * 100;
                return sum + perc;
            }, 0);
            averageScorePercentage = Math.round((totalPercentage / evaluatedAttempts.length) * 100) / 100;
        }

        // 3. Recent Assessments
        const recentAssessmentsRaw = await prisma.assessment.findMany({
            where: { organizerId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                title: true,
                status: true,
                type: true,
                duration: true,
                _count: {
                    select: {
                        questions: true,
                        attempts: true
                    }
                }
            }
        });

        const recentAssessments = recentAssessmentsRaw.map(a => ({
            id: a.id,
            title: a.title,
            status: a.status,
            type: a.type,
            duration: a.duration,
            questionCount: a._count.questions,
            attemptCount: a._count.attempts
        }));

        // 4. Recent Activity (Recent Results/Attempts)
        const recentActivity = await prisma.assessmentAttempt.findMany({
            where: { assessment: { organizerId } },
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
                id: true,
                status: true,
                score: true,
                maxScore: true,
                updatedAt: true,
                candidate: { select: { name: true, email: true } },
                assessment: { select: { title: true } }
            }
        });

        const safeRecentActivity = recentActivity.map(act => {
            let percentage = null;
            if (act.maxScore && act.maxScore > 0 && act.score !== null) {
                percentage = Math.round((act.score / act.maxScore) * 10000) / 100;
            } else if (act.score !== null) {
                percentage = act.score > 0 ? 100 : 0;
            }

            return {
                id: act.id,
                status: act.status,
                score: act.score,
                maxScore: act.maxScore,
                percentage,
                timestamp: act.updatedAt,
                candidateName: act.candidate.name,
                candidateEmail: act.candidate.email,
                assessmentTitle: act.assessment.title
            };
        });

        return NextResponse.json({
            success: true,
            metrics: {
                totalAssessments,
                publishedAssessments,
                totalCandidates,
                totalAttempts,
                submittedAttempts,
                inProgressAttempts,
                averageScorePercentage
            },
            recentAssessments,
            recentActivity: safeRecentActivity
        });

    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
