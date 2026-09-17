import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const attemptId = params.id;

        const authAttempt = await requireCandidateAttempt(attemptId);
        if (!authAttempt) {
            return NextResponse.json({ error: "Unauthorized access to attempt" }, { status: 403 });
        }

        // 1. Fetch attempt and check current state
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                assessment: {
                    select: { 
                        duration: true,
                        startDate: true,
                        endDate: true,
                        lateJoin: true
                    }
                }
            }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        // 2. Handle already IN_PROGRESS (idempotent start)
        if (attempt.status === "IN_PROGRESS") {
            // Re-evaluate if it's expired
            if (attempt.expiresAt && new Date() >= attempt.expiresAt) {
                // If it's effectively expired, don't let them "start" it again
                return NextResponse.json({ error: "Attempt has expired" }, { status: 403 });
            }

            return NextResponse.json({
                success: true,
                attempt: {
                    id: attempt.id,
                    assessmentId: attempt.assessmentId,
                    status: attempt.status,
                    startedAt: attempt.startedAt,
                    expiresAt: attempt.expiresAt,
                }
            });
        }

        // 3. Reject invalid states
        if (attempt.status !== "NOT_STARTED") {
            return NextResponse.json({ error: `Cannot start an attempt in ${attempt.status} state` }, { status: 403 });
        }

        // 4. Validate Assessment Window and Late Join
        const now = new Date();
        const { startDate, endDate, lateJoin } = attempt.assessment;

        if (startDate && now < startDate) {
            return NextResponse.json({ error: "Assessment has not started yet" }, { status: 403 });
        }

        if (endDate && now > endDate) {
            return NextResponse.json({ error: "Assessment window has closed" }, { status: 403 });
        }

        if (startDate && now > startDate && !lateJoin) {
            return NextResponse.json({ error: "Late join is not permitted for this assessment" }, { status: 403 });
        }

        // 5. Calculate timing
        const durationMs = attempt.assessment.duration * 60000;
        const baseExpiresAt = new Date(now.getTime() + durationMs);
        
        let expiresAt = baseExpiresAt;
        if (endDate && baseExpiresAt > endDate) {
            expiresAt = endDate;
        }

        // 6. Atomic Update
        // Use updateMany to safely constrain on status: "NOT_STARTED" to prevent concurrent double-starts
        const updateResult = await prisma.assessmentAttempt.updateMany({
            where: {
                id: attemptId,
                status: "NOT_STARTED"
            },
            data: {
                status: "IN_PROGRESS",
                startedAt: now,
                expiresAt: expiresAt,
            }
        });

        if (updateResult.count === 0) {
            return NextResponse.json({ error: "Attempt state changed concurrently. Please refresh." }, { status: 409 });
        }

        // Return secure response
        return NextResponse.json({
            success: true,
            attempt: {
                id: attempt.id,
                assessmentId: attempt.assessmentId,
                status: "IN_PROGRESS",
                startedAt: now,
                expiresAt: expiresAt,
            }
        });

    } catch (error) {
        console.error("Start attempt error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
