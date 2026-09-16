import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { auth } from "../../../../auth";

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await request.json();

        const existingQuestion = await prisma.question.findUnique({
            where: { id },
            include: {
                assessments: true,
            }
        });

        if (!existingQuestion) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        if (existingQuestion.organizerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (body.type && body.type !== existingQuestion.type) {
            return NextResponse.json({ error: "Cannot change question type" }, { status: 400 });
        }

        const updatedQuestion = await prisma.$transaction(async (tx) => {
            if (existingQuestion.type === "MCQ" && body.options) {
                await tx.questionOption.deleteMany({ where: { questionId: id } });
                await tx.questionOption.createMany({
                    data: body.options.map((option: any) => ({
                        questionId: id,
                        optionKey: option.optionKey,
                        text: option.text,
                        isCorrect: Boolean(option.isCorrect),
                        order: option.order,
                    }))
                });
            }

            if (existingQuestion.type === "CODING" && body.testCases) {
                await tx.codingTestCase.deleteMany({ where: { questionId: id } });
                await tx.codingTestCase.createMany({
                    data: body.testCases.map((tc: any) => ({
                        questionId: id,
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        isHidden: tc.isHidden !== false,
                        marks: Number(tc.marks),
                        order: tc.order,
                    }))
                });
            }

            return tx.question.update({
                where: { id },
                data: {
                    title: body.title !== undefined ? body.title : undefined,
                    description: body.description !== undefined ? body.description : undefined,
                    topic: body.topic !== undefined ? body.topic : undefined,
                    difficulty: body.difficulty !== undefined ? body.difficulty : undefined,
                    defaultMarks: body.defaultMarks !== undefined ? Number(body.defaultMarks) : undefined,
                    explanation: body.explanation !== undefined ? body.explanation : undefined,

                    starterCode: body.starterCode !== undefined ? body.starterCode : undefined,
                    inputFormat: body.inputFormat !== undefined ? body.inputFormat : undefined,
                    outputFormat: body.outputFormat !== undefined ? body.outputFormat : undefined,
                    constraints: body.constraints !== undefined ? body.constraints : undefined,
                },
                include: {
                    options: { orderBy: { order: "asc" } },
                    testCases: { orderBy: { order: "asc" } },
                }
            });
        });

        return NextResponse.json({ success: true, question: updatedQuestion });
    } catch (error) {
        console.error("Failed to update question:", error);
        return NextResponse.json({ success: false, error: "Failed to update question" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const existingQuestion = await prisma.question.findUnique({
            where: { id },
            include: {
                assessments: {
                    take: 1
                }
            }
        });

        if (!existingQuestion) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        if (existingQuestion.organizerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (existingQuestion.assessments.length > 0) {
            return NextResponse.json({ 
                error: "Question is used in an assessment and cannot be deleted." 
            }, { status: 409 });
        }

        await prisma.question.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete question:", error);
        return NextResponse.json({ success: false, error: "Failed to delete question" }, { status: 500 });
    }
}
