import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { auth } from "../../../auth";

type AttemptStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "ABANDONED";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const status = searchParams.get("status") as AttemptStatus | null;
        
        const pageParam = searchParams.get("page");
        const pageSizeParam = searchParams.get("pageSize");

        let page = 1;
        if (pageParam) {
            const parsedPage = parseInt(pageParam, 10);
            if (!isNaN(parsedPage) && parsedPage >= 1) {
                page = parsedPage;
            }
        }

        let pageSize = 50;
        if (pageSizeParam) {
            const parsedLimit = parseInt(pageSizeParam, 10);
            if (!isNaN(parsedLimit) && parsedLimit >= 1) {
                pageSize = Math.min(parsedLimit, 100);
            }
        }

        const skip = (page - 1) * pageSize;

        // Base where: Candidate must have at least one attempt for an assessment owned by this organizer
        const where: any = {
            attempts: {
                some: {
                    assessment: { organizerId }
                }
            }
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const attemptFilters: any = {
            assessment: { organizerId }
        };

        if (status) {
            const validStatuses: AttemptStatus[] = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "EXPIRED", "ABANDONED"];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 });
            }
            attemptFilters.status = status;
            
            // If filtering by status, the candidate MUST have an attempt matching this status for this organizer
            where.attempts.some.status = status;
        }

        const [totalRecords, candidates] = await Promise.all([
            prisma.candidate.count({ where }),
            prisma.candidate.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    createdAt: true,
                    attempts: {
                        where: attemptFilters,
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
            })
        ]);

        const safeCandidates = candidates.map(c => {
            const attemptsCount = c.attempts.length;
            const submittedCount = c.attempts.filter(a => a.status === "SUBMITTED").length;

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

        const totalPages = Math.ceil(totalRecords / pageSize);

        return NextResponse.json({
            success: true,
            candidates: safeCandidates,
            pagination: {
                page,
                pageSize,
                totalRecords,
                totalPages
            }
        });

    } catch (error) {
        console.error("Fetch candidates error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
