import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";

export async function GET() {
    try {
        const questions = await prisma.question.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                options: {
                    orderBy: {
                        order: "asc",
                    },
                },
                testCases: {
                    select: {
                        id: true,
                        questionId: true,
                        input: true,
                        isHidden: true,
                        marks: true,
                        order: true,
                        createdAt: true,
                    },
                    orderBy: {
                        order: "asc",
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            questions,
        });
    } catch (error) {
        console.error("Failed to fetch questions:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch questions",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.title || !body.type || !body.difficulty) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Title, type, and difficulty are required",
                },
                { status: 400 }
            );
        }

        if (!["MCQ", "CODING"].includes(body.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid question type",
                },
                { status: 400 }
            );
        }

        const question = await prisma.question.create({
            data: {
                type: body.type,
                title: body.title,
                description: body.description || null,
                topic: body.topic || null,
                difficulty: body.difficulty,
                defaultMarks: Number(body.defaultMarks || 1),
                explanation: body.explanation || null,

                starterCode: body.starterCode || null,
                inputFormat: body.inputFormat || null,
                outputFormat: body.outputFormat || null,
                constraints: body.constraints || null,

                options:
                    body.type === "MCQ"
                        ? {
                            create: (body.options || []).map(
                                (
                                    option: {
                                        optionKey: string;
                                        text: string;
                                        isCorrect?: boolean;
                                        order: number;
                                    }
                                ) => ({
                                    optionKey: option.optionKey,
                                    text: option.text,
                                    isCorrect: Boolean(option.isCorrect),
                                    order: option.order,
                                })
                            ),
                        }
                        : undefined,

                testCases:
                    body.type === "CODING"
                        ? {
                            create: (body.testCases || []).map(
                                (
                                    testCase: {
                                        input: string;
                                        expectedOutput: string;
                                        isHidden?: boolean;
                                        marks: number;
                                        order: number;
                                    }
                                ) => ({
                                    input: testCase.input,
                                    expectedOutput: testCase.expectedOutput,
                                    isHidden:
                                        testCase.isHidden !== false,
                                    marks: Number(testCase.marks),
                                    order: testCase.order,
                                })
                            ),
                        }
                        : undefined,
            },
            include: {
                options: {
                    orderBy: {
                        order: "asc",
                    },
                },
                testCases: {
                    select: {
                        id: true,
                        questionId: true,
                        input: true,
                        isHidden: true,
                        marks: true,
                        order: true,
                        createdAt: true,
                    },
                    orderBy: {
                        order: "asc",
                    },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                question,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to create question:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to create question",
            },
            { status: 500 }
        );
    }
}