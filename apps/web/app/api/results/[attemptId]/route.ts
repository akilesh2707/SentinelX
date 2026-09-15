import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { auth } from "../../../../auth";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ attemptId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizerId = session.user.id;

        const params = await props.params;
        const attemptId = params.attemptId;

        const attempt = await prisma.assessmentAttempt.findFirst({
            where: { id: attemptId, assessment: { organizerId } },
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
                },
                questions: {
                    orderBy: { order: "asc" },
                    select: {
                        id: true,
                        order: true,
                        marks: true,
                        answered: true,
                        question: {
                            select: {
                                id: true,
                                title: true,
                                type: true
                            }
                        },
                        answer: {
                            select: {
                                id: true,
                                score: true,
                                answeredAt: true
                                // isCorrect, submittedCode are intentionally excluded for safety
                            }
                        }
                    }
                }
            }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        let percentage = null;
        if (attempt.maxScore && attempt.maxScore > 0 && attempt.score !== null) {
            percentage = Math.round((attempt.score / attempt.maxScore) * 10000) / 100;
        } else if (attempt.score !== null) {
            percentage = attempt.score > 0 ? 100 : 0;
        }

        const safeDetail = {
            attemptId: attempt.id,
            candidate: attempt.candidate,
            assessment: attempt.assessment,
            status: attempt.status,
            score: attempt.score,
            maxScore: attempt.maxScore,
            percentage,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            questions: attempt.questions.map(q => ({
                id: q.id,
                order: q.order,
                marks: q.marks,
                title: q.question.title,
                type: q.question.type,
                answerStatus: q.answered ? "ANSWERED" : "UNANSWERED",
                answerScore: q.answer?.score ?? null,
                answeredAt: q.answer?.answeredAt ?? null
            }))
        };

        return NextResponse.json({
            success: true,
            detail: safeDetail
        });

    } catch (error) {
        console.error("Fetch result detail error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
