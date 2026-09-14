import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "../prisma";

const SECRET = process.env.CANDIDATE_AUTH_SECRET || "default_dev_secret_only";
const encodedSecret = new TextEncoder().encode(SECRET);
const COOKIE_NAME = "candidate_session";

export type CandidateJwtPayload = {
    candidateId: string;
    attemptId: string;
    type: "candidate";
};

export async function createCandidateSession(candidateId: string, attemptId: string) {
    const token = await new SignJWT({ candidateId, attemptId, type: "candidate" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("12h") // standard attempt timeframe + buffer
        .sign(encodedSecret);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 12 * 60 * 60, // 12 hours
    });
}

/**
 * Validates the candidate session cookie against the requested attempt ID.
 * Returns the minimally selected Attempt context if authorized, null otherwise.
 */
export async function requireCandidateAttempt(requestedAttemptId: string) {
    const cookieStore = await cookies();
    const tokenStr = cookieStore.get(COOKIE_NAME)?.value;

    if (!tokenStr) return null;

    try {
        const { payload } = await jwtVerify(tokenStr, encodedSecret);

        if (
            payload.type !== "candidate" ||
            !payload.candidateId ||
            !payload.attemptId ||
            payload.attemptId !== requestedAttemptId
        ) {
            return null;
        }

        // Database Ownership Check
        // Minimal explicitly selected attempt context
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: requestedAttemptId },
            select: {
                id: true,
                candidateId: true,
                assessmentId: true,
                status: true,
                expiresAt: true
            }
        });

        if (!attempt || attempt.candidateId !== payload.candidateId) {
            return null;
        }

        return attempt;

    } catch (err) {
        // Token expired or invalid signature
        return null;
    }
}
