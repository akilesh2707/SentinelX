import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, confirmPassword } = body;

        if (!name || !email || !password || !confirmPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await prisma.organizer.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email already exists" }, { status: 409 });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newOrganizer = await prisma.organizer.create({
            data: {
                name,
                email: normalizedEmail,
                passwordHash
            }
        });

        return NextResponse.json({
            success: true,
            organizer: {
                id: newOrganizer.id,
                name: newOrganizer.name,
                email: newOrganizer.email
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
