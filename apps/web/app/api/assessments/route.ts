import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";

function generateAccessCode(length = 6) {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < length; i++) {
        code += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return code;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const accessCode = generateAccessCode();

        const assessment = await prisma.assessment.create({
            data: {
                title: body.title,
                description: body.description || null,
                type: body.type,

                mcqCount: Number(body.mcqCount || 0),
                codingCount: Number(body.codingCount || 0),
                totalMarks: Number(body.totalMarks || 0),
                passingScore: Number(body.passingScore || 0),
                difficulty: body.difficulty,
                duration: Number(body.duration || 60),

                maxAttempts: body.maxAttempts || "1",
                lateJoin: Boolean(body.lateJoin),
                autoSubmit: Boolean(body.autoSubmit),
                randomizeQuestions: Boolean(body.randomizeQuestions),
                negativeMarking: Boolean(body.negativeMarking),

                securityLevel: body.securityLevel || "high",
                identityVerification: Boolean(body.identityVerification),
                primaryCamera: Boolean(body.primaryCamera),
                secondaryCamera: Boolean(body.secondaryCamera),
                browserLock: Boolean(body.browserLock),
                tabDetection: Boolean(body.tabDetection),
                audioMonitoring: Boolean(body.audioMonitoring),
                aiProctoring: Boolean(body.aiProctoring),

                accessCode,
                joinLink: `/join/${accessCode}`,

                status: "PUBLISHED",
            },
        });

        return NextResponse.json(
            {
                success: true,
                assessment,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to create assessment:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to create assessment",
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const assessments = await prisma.assessment.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            success: true,
            assessments,
        });
    } catch (error) {
        console.error("Failed to fetch assessments:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch assessments",
            },
            { status: 500 }
        );
    }
}