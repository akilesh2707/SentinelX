import { NextRequest, NextResponse } from "next/server";
import { runPythonCode } from "../../../../src/lib/code-execution/docker-runner";

import { requireCandidateAttempt } from "../../../../src/lib/auth/candidate-session";
import { prisma } from "../../../../src/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { language, code, input, attemptId, questionId } = body;

        if (!attemptId || !questionId) {
            return NextResponse.json({ error: "Missing attemptId or questionId" }, { status: 400 });
        }

        const authAttempt = await requireCandidateAttempt(attemptId);
        if (!authAttempt) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        if (authAttempt.status !== "IN_PROGRESS") {
            return NextResponse.json({ error: "Attempt is not in progress" }, { status: 403 });
        }

        if (authAttempt.expiresAt && new Date() >= authAttempt.expiresAt) {
            return NextResponse.json({ error: "Attempt has expired" }, { status: 403 });
        }

        const attemptQuestion = await prisma.attemptQuestion.findFirst({
            where: {
                attemptId: attemptId,
                questionId: questionId
            },
            include: { question: true }
        });

        if (!attemptQuestion) {
            return NextResponse.json({ error: "Question does not belong to this attempt" }, { status: 403 });
        }

        if (attemptQuestion.question.type !== "CODING") {
            return NextResponse.json({ error: "Not a CODING question" }, { status: 400 });
        }

        // Strict Server-Side Validation Boundaries
        if (language !== "python") {
            return NextResponse.json({ error: "Only python is currently supported" }, { status: 400 });
        }

        if (typeof code !== "string" || code.trim() === "") {
            return NextResponse.json({ error: "Code cannot be empty" }, { status: 400 });
        }

        if (code.length > 50000) { // 50KB limit on source code
            return NextResponse.json({ error: "Code exceeds maximum allowed length" }, { status: 400 });
        }

        const safeInput = typeof input === "string" ? input : "";
        if (safeInput.length > 50000) { // 50KB limit on input
            return NextResponse.json({ error: "Input exceeds maximum allowed length" }, { status: 400 });
        }

        // Execute in Sandbox
        const result = await runPythonCode(code, safeInput);

        return NextResponse.json({
            success: true,
            result
        });

    } catch (error: any) {
        console.error("Code execution API error:", error);
        return NextResponse.json({ error: "Internal server error during code execution" }, { status: 500 });
    }
}
