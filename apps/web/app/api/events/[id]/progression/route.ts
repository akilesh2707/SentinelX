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
        const eventId = params.id;

        // Verify Event ownership
        const event = await prisma.event.findFirst({
            where: { id: eventId, organizerId },
            include: {
                assessments: {
                    orderBy: { order: "asc" }
                }
            }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const assessmentIds = event.assessments.map(ea => ea.assessmentId);

        if (assessmentIds.length === 0) {
            return NextResponse.json({ success: true, progression: [] });
        }

        // Get candidates who have attempts in these assessments
        const candidates = await prisma.candidate.findMany({
            where: {
                organizerId,
                attempts: {
                    some: {
                        assessmentId: { in: assessmentIds }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                attempts: {
                    where: {
                        assessmentId: { in: assessmentIds }
                    },
                    select: {
                        assessmentId: true,
                        score: true,
                        status: true
                    },
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        });

        // The user said: "For v1, determine a deterministic applicable finalized attempt. If multiple finalized attempts are possible, document the exact selection rule and implement it consistently."
        // Rule: First, prefer "SUBMITTED" status. If multiple, take the latest. 
        // If no SUBMITTED, take the latest attempt regardless of status.

        const progression = candidates.map(candidate => {
            let totalScore = 0;
            const roundResults = event.assessments.map(ea => {
                // Find all attempts for this candidate for this specific assessment
                const attemptsForRound = candidate.attempts.filter(a => a.assessmentId === ea.assessmentId);
                
                let selectedAttempt = null;
                
                if (attemptsForRound.length > 0) {
                    const submitted = attemptsForRound.filter(a => a.status === "SUBMITTED");
                    if (submitted.length > 0) {
                        // The array is already ordered by createdAt desc, so [0] is the latest
                        selectedAttempt = submitted[0];
                    } else {
                        selectedAttempt = attemptsForRound[0];
                    }
                }

                if (selectedAttempt && selectedAttempt.status === "SUBMITTED" && selectedAttempt.score !== null) {
                    totalScore += selectedAttempt.score;
                }

                return {
                    assessmentId: ea.assessmentId,
                    roundName: ea.roundName,
                    order: ea.order,
                    score: selectedAttempt?.score ?? null,
                    status: selectedAttempt?.status || null
                };
            });

            return {
                candidate: {
                    id: candidate.id,
                    name: candidate.name,
                    email: candidate.email
                },
                totalScore,
                rounds: roundResults
            };
        });

        return NextResponse.json({ success: true, progression });
    } catch (error) {
        console.error("Progression error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
