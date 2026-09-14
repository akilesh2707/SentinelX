import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const assessmentId = searchParams.get("assessmentId");
        const status = searchParams.get("status");

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const attemptFilters: any = {};
        if (assessmentId) attemptFilters.assessmentId = assessmentId;

        if (status) {
            const validStatuses = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "EXPIRED", "ABANDONED"];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 });
            }
            attemptFilters.status = status;
        }

        if (Object.keys(attemptFilters).length > 0) {
            where.attempts = {
                some: attemptFilters
            };
        }

        const candidates = await prisma.candidate.findMany({
            where,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                attempts: {
                    where: Object.keys(attemptFilters).length > 0 ? attemptFilters : undefined,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        status: true,
                        score: true,
                        maxScore: true,
                        createdAt: true,
                        assessment: {
                            select: { title: true }
                        }
                    }
                }
            }
        });

        const safeCandidates = candidates.map(c => {
            const attemptsCount = c.attempts.length;
            const submittedCount = c.attempts.filter(a => a.status === "SUBMITTED").length;

            // Because attempts are ordered by createdAt desc, the first one is the latest (for the subset)
            const latestAttempt = c.attempts.length > 0 ? c.attempts[0] : null;

            return {
                id: c.id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                createdAt: c.createdAt,
                totalAttempts: attemptsCount,
                submittedAttempts: submittedCount,
                latestAttemptAt: latestAttempt?.createdAt || null,
                latestAssessment: latestAttempt?.assessment.title || null,
                latestScore: latestAttempt?.score ?? null,
                latestMaxScore: latestAttempt?.maxScore ?? null,
                latestStatus: latestAttempt?.status || null
            };
        });

        return NextResponse.json({
            success: true,
            candidates: safeCandidates
        });

    } catch (error) {
        console.error("Fetch candidates error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
