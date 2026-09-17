import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { createOrganizer, createCandidate, createAssessment, createAttempt } from '../factories/entities';
import { createCandidateSession } from '../helpers/auth';
import { NextRequest } from 'next/server';
import { setMockCookie, clearMockCookies } from '../setup';

// Route handlers
import { POST as startAttempt } from '../../app/api/attempts/[id]/start/route';
import { GET as getQuestions } from '../../app/api/attempts/[id]/questions/route';

describe('Runtime Enforcement Integration Tests', () => {
    let organizer: any, candidate: any;
    let cookieToken: string;

    const mockRequest = (method: string, body?: any) => {
        clearMockCookies();
        if (cookieToken) {
            setMockCookie('candidate_session', cookieToken);
        }
        
        const headers = new Headers();
        if (body) headers.set('Content-Type', 'application/json');
        
        return new NextRequest('http://localhost/api/fake', {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
    };

    beforeAll(async () => {
        organizer = await createOrganizer();
        candidate = await createCandidate(organizer.id);
    });

    afterAll(async () => {
        await prisma.assessmentAttempt.deleteMany();
        await prisma.assessment.deleteMany();
        await prisma.question.deleteMany();
        await prisma.organizer.deleteMany();
        await prisma.candidate.deleteMany();
    });

    it('1. Before startDate -> 403', async () => {
        const future = new Date(Date.now() + 1000 * 60 * 60);
        const assessment = await createAssessment(organizer.id, { startDate: future, status: 'PUBLISHED' });
        const attempt = await createAttempt(candidate.id, assessment.id);
        cookieToken = await createCandidateSession(candidate.id, attempt.id);

        const req = mockRequest('POST');
        const res = await startAttempt(req, { params: Promise.resolve({ id: attempt.id }) });
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data.error).toBe('Assessment has not started yet');
    });

    it('2. After endDate -> 403', async () => {
        const past = new Date(Date.now() - 1000 * 60 * 60);
        const assessment = await createAssessment(organizer.id, { endDate: past, status: 'PUBLISHED' });
        const attempt = await createAttempt(candidate.id, assessment.id);
        cookieToken = await createCandidateSession(candidate.id, attempt.id);

        const req = mockRequest('POST');
        const res = await startAttempt(req, { params: Promise.resolve({ id: attempt.id }) });
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data.error).toBe('Assessment window has closed');
    });

    it('3. After startDate without lateJoin -> 403', async () => {
        const past = new Date(Date.now() - 1000 * 60 * 60);
        const assessment = await createAssessment(organizer.id, { startDate: past, lateJoin: false, status: 'PUBLISHED' });
        const attempt = await createAttempt(candidate.id, assessment.id);
        cookieToken = await createCandidateSession(candidate.id, attempt.id);

        const req = mockRequest('POST');
        const res = await startAttempt(req, { params: Promise.resolve({ id: attempt.id }) });
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data.error).toBe('Late join is not permitted for this assessment');
    });

    it('4. After startDate with lateJoin -> 200', async () => {
        const past = new Date(Date.now() - 1000 * 60 * 60);
        const assessment = await createAssessment(organizer.id, { startDate: past, lateJoin: true, status: 'PUBLISHED' });
        const attempt = await createAttempt(candidate.id, assessment.id);
        cookieToken = await createCandidateSession(candidate.id, attempt.id);

        const req = mockRequest('POST');
        const res = await startAttempt(req, { params: Promise.resolve({ id: attempt.id }) });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('5 & 6. Expired attempt questions endpoint triggers lazy expiration', async () => {
        const past = new Date(Date.now() - 1000 * 60 * 60);
        const assessment = await createAssessment(organizer.id, { status: 'PUBLISHED' });
        const attempt = await createAttempt(candidate.id, assessment.id, { status: 'IN_PROGRESS', expiresAt: past });
        cookieToken = await createCandidateSession(candidate.id, attempt.id);

        const req = mockRequest('GET');
        const res = await getQuestions(req, { params: Promise.resolve({ id: attempt.id }) });
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data.error).toBe('Attempt has expired and was automatically submitted');

        // Verify status in database
        const updatedAttempt = await prisma.assessmentAttempt.findUnique({ where: { id: attempt.id } });
        expect(updatedAttempt?.status).toBe('EXPIRED');
    });
});
