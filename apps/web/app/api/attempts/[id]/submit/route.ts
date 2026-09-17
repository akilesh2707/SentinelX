import { NextRequest, NextResponse } from "next/server";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";
import { finalizeAttempt } from "../../../../../src/lib/assessment/finalize-attempt";

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

        const finalAttempt = await finalizeAttempt(attemptId);

        return NextResponse.json({
            success: true,
            attempt: finalAttempt
        });

    } catch (error: any) {
        console.error("Submit attempt error:", error);
        
        if (error.message === "Attempt not found") {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }
        
        if (error.message.startsWith("Cannot submit attempt in state")) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        
        if (error.message === "Negative marking is not currently supported") {
            return NextResponse.json({ error: error.message }, { status: 501 });
        }
        
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
