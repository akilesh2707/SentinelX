import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { auth } from "../../../../auth";
import { EvidenceStorage } from "../../../../src/lib/storage";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await context.params;

        const evidence = await prisma.evidence.findUnique({
            where: { id },
            include: {
                incident: {
                    include: {
                        attempt: {
                            include: {
                                assessment: {
                                    select: { organizerId: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!evidence) {
            return new NextResponse("Evidence not found", { status: 404 });
        }

        if (evidence.incident.attempt.assessment.organizerId !== session.user.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        try {
            const buffer = await EvidenceStorage.read(evidence.storageKey);
            return new NextResponse(buffer as unknown as BodyInit, {
                headers: {
                    "Content-Type": evidence.mimeType,
                    "Cache-Control": "private, max-age=3600"
                }
            });
        } catch (storageError) {
            console.error("Storage error:", storageError);
            return new NextResponse("File not found on server", { status: 404 });
        }

    } catch (error) {
        console.error("Organizer GET Evidence API Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const evidence = await prisma.evidence.findUnique({
            where: { id },
            include: {
                incident: {
                    include: {
                        attempt: {
                            include: {
                                assessment: {
                                    select: { organizerId: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!evidence) {
            return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
        }

        if (evidence.incident.attempt.assessment.organizerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.evidence.delete({
            where: { id }
        });

        // Gracefully delete physical file
        await EvidenceStorage.delete(evidence.storageKey);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Organizer Delete Evidence API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
