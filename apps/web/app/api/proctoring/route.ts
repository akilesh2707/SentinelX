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
        const assessmentId = searchParams.get("assessmentId");
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
            if (!isNaN(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 100) {
                pageSize = parsedLimit;
            }
        }

        const skip = (page - 1) * pageSize;

        const where: any = {
            assessment: { organizerId }
        };

        if (assessmentId) {
            where.assessmentId = assessmentId;
        }

        if (status) {
            const validStatuses: AttemptStatus[] = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "EXPIRED", "ABANDONED"];
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

        const [totalRecords, attempts] = await Promise.all([
            prisma.assessmentAttempt.count({ where }),
            prisma.assessmentAttempt.findMany({
                where,
                orderBy: [
                    { riskScore: 'desc' },
                    { startedAt: 'desc' }
                ],
                skip,
                take: pageSize,
                select: {
                    id: true,
                    status: true,
                    riskScore: true,
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
            })
        ]);

        const totalPages = Math.ceil(totalRecords / pageSize);

        return NextResponse.json({
            success: true,
            attempts,
            pagination: {
                page,
                pageSize,
                totalRecords,
                totalPages
            }
        });

    } catch (error) {
        console.error("Fetch proctoring attempts error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
