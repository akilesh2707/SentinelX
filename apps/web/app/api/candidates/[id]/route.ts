import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { auth } from "../../../../auth";

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
        const candidateId = params.id;

        // Verify authorization: The candidate must belong to this organizer
        const hasAuthorization = await prisma.candidate.findUnique({
            where: {
                id: candidateId,
                organizerId
            }
        });

        if (!hasAuthorization) {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                attempts: {
                    where: {
                        assessment: { organizerId }
                    },
                    orderBy: { startedAt: "desc" },
                    select: {
                        id: true,
                        status: true,
                        score: true,
                        maxScore: true,
                        riskScore: true,
                        startedAt: true,
                        submittedAt: true,
                        assessmentId: true,
                        assessment: {
                            select: { title: true }
                        }
                    }
                }
            }
        });

        if (!candidate) {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        const safeHistory = candidate.attempts.map(attempt => {
            let percentage = null;
            if (attempt.maxScore && attempt.maxScore > 0 && attempt.score !== null) {
                percentage = Math.round((attempt.score / attempt.maxScore) * 10000) / 100;
            } else if (attempt.score !== null) {
                percentage = attempt.score > 0 ? 100 : 0;
            }

            return {
                attemptId: attempt.id,
                assessmentId: attempt.assessmentId,
                assessmentTitle: attempt.assessment.title,
                status: attempt.status,
                score: attempt.score,
                maxScore: attempt.maxScore,
                riskScore: attempt.riskScore,
                percentage,
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt
            };
        });

        return NextResponse.json({
            success: true,
            candidate: {
                id: candidate.id,
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                createdAt: candidate.createdAt
            },
            history: safeHistory
        });

    } catch (error) {
        console.error("Fetch candidate detail error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
