import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { auth } from "../../../auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const incidents = await prisma.incident.findMany({
            where: {
                attempt: {
                    assessment: {
                        organizerId: session.user.id
                    }
                }
            },
            include: {
                attempt: {
                    include: {
                        candidate: true,
                        assessment: {
                            select: { title: true }
                        }
                    }
                }
            },
            orderBy: {
                lastSeen: "desc"
            },
            take: 100 // Limit for global dashboard
        });

        return NextResponse.json({ success: true, incidents });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
