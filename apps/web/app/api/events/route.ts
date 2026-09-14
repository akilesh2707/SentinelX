import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const status = searchParams.get("status");

        const where: any = {};
        if (search) {
            where.title = { contains: search, mode: "insensitive" };
        }
        if (status) {
            where.status = status;
        }

        const events = await prisma.event.findMany({
            where,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                status: true,
                createdAt: true,
                _count: {
                    select: { assessments: true }
                },
                assessments: {
                    select: {
                        assessment: {
                            select: {
                                _count: { select: { attempts: true } }
                            }
                        }
                    }
                }
            }
        });

        const formattedEvents = events.map(e => {
            const totalAttempts = e.assessments.reduce((sum, relation) => sum + relation.assessment._count.attempts, 0);

            return {
                id: e.id,
                title: e.title,
                description: e.description,
                startDate: e.startDate,
                endDate: e.endDate,
                status: e.status,
                createdAt: e.createdAt,
                assessmentCount: e._count.assessments,
                totalAttempts
            };
        });

        return NextResponse.json({ success: true, events: formattedEvents });

    } catch (error) {
        console.error("Fetch events error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, description, startDate, endDate, status } = body;

        if (!title || typeof title !== "string" || title.trim() === "") {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (status) {
            const validStatuses = ["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED"];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end <= start) {
                return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
            }
        }

        const event = await prisma.event.create({
            data: {
                title,
                description: description || null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status: status || "DRAFT"
            }
        });

        return NextResponse.json({ success: true, event });
    } catch (error) {
        console.error("Create event error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
