import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { AssessmentQuestionsService, AssessmentQuestionsError } from "../../../../../../src/features/assessments/services/assessment-questions.service";

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string, questionId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id, questionId } = await context.params;
        const body = await request.json();

        // Server-side validation of marks
        if (body.marks !== undefined) {
            await AssessmentQuestionsService.updateMarks(id, session.user.id, questionId, body.marks);
        } else {
            return NextResponse.json({ error: "Only marks updates are supported on this endpoint. Use bulk reorder for order changes." }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof AssessmentQuestionsError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Failed to update question:", error);
        return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string, questionId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id, questionId } = await context.params;

        await AssessmentQuestionsService.removeQuestion(id, session.user.id, questionId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof AssessmentQuestionsError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Failed to remove question:", error);
        return NextResponse.json({ error: "Failed to remove question" }, { status: 500 });
    }
}
