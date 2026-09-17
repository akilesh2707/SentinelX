import { SignJWT } from 'jose';
import { encode } from 'next-auth/jwt';

export async function createCandidateSession(candidateId: string, attemptId: string) {
    const SECRET = process.env.CANDIDATE_AUTH_SECRET || "default_dev_secret_only";
    const encodedSecret = new TextEncoder().encode(SECRET);
    
    return new SignJWT({ candidateId, attemptId, type: "candidate" })
        .setProtectedHeader({ alg: "HS256" })
        .sign(encodedSecret);
}

export async function createOrganizerSession(organizerId: string, email: string) {
    const SECRET = process.env.NEXTAUTH_SECRET || "secret";
    
    return encode({
        token: { id: organizerId, email, type: 'organizer' },
        secret: SECRET,
        salt: "authjs.session-token"
    });
}
