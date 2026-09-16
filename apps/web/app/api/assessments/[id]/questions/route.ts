import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { AssessmentQuestionsService, AssessmentQuestionsError } from "../../../../../src/features/assessments/services/assessment-questions.service";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await context.params;
        const questions = await AssessmentQuestionsService.getQuestions(id, session.user.id);
        
        return NextResponse.json({ success: true, questions });
    } catch (error: any) {
        if (error instanceof AssessmentQuestionsError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Failed to fetch assessment questions:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await context.params;
        const body = await request.json();
        
        await AssessmentQuestionsService.addQuestions(id, session.user.id, body.questionIds);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof AssessmentQuestionsError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Failed to attach questions:", error);
        return NextResponse.json({ error: "Failed to attach questions" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await context.params;
        const body = await request.json();
        
        const updatedQuestions = await AssessmentQuestionsService.atomicReorder(id, session.user.id, body.questionIds);

        return NextResponse.json({ success: true, questions: updatedQuestions });
    } catch (error: any) {
        if (error instanceof AssessmentQuestionsError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Failed to reorder questions:", error);
        return NextResponse.json({ error: "Failed to reorder questions" }, { status: 500 });
    }
}
