import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { auth } from "../../../../../auth";

export async function POST(
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
        const assessmentId = params.id;

        const assessment = await prisma.assessment.findFirst({
            where: { id: assessmentId, organizerId },
            include: {
                questions: {
                    include: {
                        question: {
                            include: {
                                options: true,
                                testCases: true
                            }
                        }
                    }
                }
            }
        });

        if (!assessment) {
            return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 });
        }

        if (assessment.status !== "DRAFT") {
            return NextResponse.json({ success: false, error: `Cannot publish assessment in ${assessment.status} state` }, { status: 409 });
        }

        // Validation
        if (!assessment.title || assessment.title.trim() === "") {
            return NextResponse.json({ success: false, error: "Title is required to publish" }, { status: 400 });
        }
        if (assessment.duration <= 0) {
            return NextResponse.json({ success: false, error: "Duration must be positive" }, { status: 400 });
        }
        if (assessment.totalMarks <= 0) {
            return NextResponse.json({ success: false, error: "Total marks must be positive" }, { status: 400 });
        }
        if (assessment.passingScore < 0 || assessment.passingScore > assessment.totalMarks) {
            return NextResponse.json({ success: false, error: "Passing score is invalid" }, { status: 400 });
        }
        if (assessment.questions.length === 0) {
            return NextResponse.json({ success: false, error: "Assessment must have at least one question" }, { status: 400 });
        }
        if (!assessment.accessCode) {
            return NextResponse.json({ success: false, error: "Access code is missing" }, { status: 400 });
        }

        // Question-level validation
        for (const aq of assessment.questions) {
            if (aq.marks <= 0) {
                return NextResponse.json({ success: false, error: `Question ${aq.questionId} has invalid marks` }, { status: 400 });
            }
            if (!aq.question) {
                return NextResponse.json({ success: false, error: "Invalid question reference" }, { status: 400 });
            }

            if (aq.question.type === "MCQ") {
                if (!aq.question.options || aq.question.options.length < 2) {
                    return NextResponse.json({ success: false, error: `MCQ question ${aq.questionId} must have at least 2 options` }, { status: 400 });
                }
                const hasCorrect = aq.question.options.some((o: any) => o.isCorrect);
                if (!hasCorrect) {
                    return NextResponse.json({ success: false, error: `MCQ question ${aq.questionId} must have a correct option` }, { status: 400 });
                }
            } else if (aq.question.type === "CODING") {
                if (!aq.question.testCases || aq.question.testCases.length === 0) {
                    return NextResponse.json({ success: false, error: `CODING question ${aq.questionId} must have test cases` }, { status: 400 });
                }
                if (!aq.question.starterCode) {
                    return NextResponse.json({ success: false, error: `CODING question ${aq.questionId} must have starter code` }, { status: 400 });
                }
            }
        }

        const published = await prisma.assessment.update({
            where: { id: assessmentId },
            data: { status: "PUBLISHED" }
        });

        return NextResponse.json({ success: true, assessment: published });

    } catch (error) {
        console.error("Failed to publish assessment:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
