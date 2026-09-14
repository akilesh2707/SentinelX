import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const assessmentId = searchParams.get("assessmentId");
        const search = searchParams.get("search");
        const status = searchParams.get("status");

        const where: any = {};

        if (assessmentId) {
            where.assessmentId = assessmentId;
        }

        if (status) {
            const validStatuses = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "EXPIRED", "ABANDONED"];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 });
            }
            where.status = status;
        }

        if (search) {
            where.candidate = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        const attempts = await prisma.assessmentAttempt.findMany({
            where,
            orderBy: [
                { submittedAt: 'desc' },
                { startedAt: 'desc' }
            ],
            select: {
                id: true,
                status: true,
                score: true,
                maxScore: true,
                startedAt: true,
                submittedAt: true,
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                assessment: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        const safeResults = attempts.map(attempt => {
            let percentage = null;
            if (attempt.maxScore && attempt.maxScore > 0 && attempt.score !== null) {
                percentage = Math.round((attempt.score / attempt.maxScore) * 10000) / 100;
            } else if (attempt.score !== null) {
                // maxScore is 0 or null, but score exists
                percentage = attempt.score > 0 ? 100 : 0;
            }

            return {
                attemptId: attempt.id,
                candidate: attempt.candidate,
                assessment: attempt.assessment,
                status: attempt.status,
                score: attempt.score,
                maxScore: attempt.maxScore,
                percentage,
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt
            };
        });

        return NextResponse.json({
            success: true,
            results: safeResults
        });

    } catch (error) {
        console.error("Fetch results error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
