import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { createOrganizer, createCandidate, createAssessment, createAttempt } from '../factories/entities';
import { createOrganizerSession, createCandidateSession } from '../helpers/auth';
import { NextRequest } from 'next/server';
import { setMockCookie, clearMockCookies } from '../setup';

// Route handlers
import { GET as getEvents, POST as postEvents } from '../../app/api/events/route';
import { GET as getEvent, PATCH as patchEvent } from '../../app/api/events/[id]/route';
import { POST as attachAssessment } from '../../app/api/events/[id]/assessments/route';
import { DELETE as removeAssessment } from '../../app/api/events/[id]/assessments/[assessmentId]/route';
import { PATCH as reorderAssessments } from '../../app/api/events/[id]/assessments/reorder/route';
import { GET as getProgression } from '../../app/api/events/[id]/progression/route';
import { PATCH as updateRound } from '../../app/api/events/[id]/assessments/[assessmentId]/route';

describe('Events Integration Tests', () => {
    let orgA: any, orgB: any, cand: any;
    let cookieA: string, cookieB: string, cookieC: string;
    let a1: any, a2: any, b1: any;
    let eventA: any;

    beforeAll(async () => {
        orgA = await createOrganizer();
        orgB = await createOrganizer();
        cand = await createCandidate();

        cookieA = await createOrganizerSession(orgA.id, orgA.email);
        cookieB = await createOrganizerSession(orgB.id, orgB.email);
        cookieC = await createCandidateSession(cand.id, 'dummy-attempt');

        a1 = await createAssessment(orgA.id);
        a2 = await createAssessment(orgA.id);
        b1 = await createAssessment(orgB.id);
    });

    afterAll(async () => {
        await prisma.eventAssessment.deleteMany();
        await prisma.event.deleteMany();
        await prisma.assessmentAttempt.deleteMany();
        await prisma.assessment.deleteMany();
        await prisma.organizer.deleteMany();
        await prisma.candidate.deleteMany();
    });

    const mockRequest = (method: string, body?: any, cookieToken?: string, cookieName: string = 'authjs.session-token') => {
        clearMockCookies();
        if (cookieToken) {
            setMockCookie(cookieName, cookieToken);
        }
        
        return new NextRequest('http://localhost/api/fake', {
            method,
            body: body ? JSON.stringify(body) : undefined
        });
    };

    it('A. unauthenticated event list returns 401', async () => {
        const req = mockRequest('GET');
        const res = await getEvents(req);
        expect(res.status).toBe(401);
    });

    it('creates an event successfully', async () => {
        const req = mockRequest('POST', { title: 'Event A' }, cookieA);
        const res = await postEvents(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        eventA = data.event;
        expect(eventA.id).toBeDefined();
    });

    it('B. unauthenticated event detail returns 401', async () => {
        const req = mockRequest('GET');
        const res = await getEvent(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(401);
    });

    it('O. candidate session cannot access organizer event APIs', async () => {
        const req = mockRequest('GET', undefined, cookieC, 'candidate_session');
        const res = await getEvent(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status === 401 || res.status === 404).toBe(true);
    });

    it('C. organizer A sees own event', async () => {
        const req = mockRequest('GET', undefined, cookieA);
        const res = await getEvent(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(200);
    });

    it('D. organizer B cannot access organizer A event', async () => {
        const req = mockRequest('GET', undefined, cookieB);
        const res = await getEvent(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(404);
    });

    it('E. organizer A cannot attach organizer B assessment', async () => {
        const req = mockRequest('POST', { assessmentId: b1.id }, cookieA);
        const res = await attachAssessment(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(404);
    });

    it('attaches valid assessments', async () => {
        let req = mockRequest('POST', { assessmentId: a1.id }, cookieA);
        let res = await attachAssessment(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(200);

        req = mockRequest('POST', { assessmentId: a2.id }, cookieA);
        res = await attachAssessment(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(200);
    });

    it('F. duplicate assessment attachment rejected', async () => {
        const req = mockRequest('POST', { assessmentId: a1.id }, cookieA);
        const res = await attachAssessment(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(400);
    });

    it('G. invalid assessment ID returns 404', async () => {
        const req = mockRequest('POST', { assessmentId: 'invalid-id' }, cookieA);
        const res = await attachAssessment(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(404);
    });

    it('H. round metadata update works', async () => {
        const req = mockRequest('PATCH', { roundName: 'Qualifiers' }, cookieA);
        const res = await updateRound(req, { params: Promise.resolve({ id: eventA.id, assessmentId: a1.id }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.roundName).toBe('Qualifiers');
    });

    it('I. atomic reorder works and persists correctly', async () => {
        const reqPatch = mockRequest('PATCH', { assessmentIds: [a2.id, a1.id] }, cookieA);
        const resPatch = await reorderAssessments(reqPatch, { params: Promise.resolve({ id: eventA.id }) });
        expect(resPatch.status).toBe(200);

        const reqGet = mockRequest('GET', undefined, cookieA);
        const resGet = await getEvent(reqGet, { params: Promise.resolve({ id: eventA.id }) });
        const data = await resGet.json();
        expect(data.assessments[0].id).toBe(a2.id);
    });

    it('J. duplicate IDs in reorder rejected', async () => {
        const req = mockRequest('PATCH', { assessmentIds: [a1.id, a1.id] }, cookieA);
        const res = await reorderAssessments(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(400);
    });

    it('K. incomplete assessment set in reorder rejected', async () => {
        const req = mockRequest('PATCH', { assessmentIds: [a1.id] }, cookieA);
        const res = await reorderAssessments(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(400);
    });

    it('L. cross-owner progression rejected', async () => {
        const req = mockRequest('GET', undefined, cookieB);
        const res = await getProgression(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(404);
    });

    it('M, N, P. Progression API returns correct scores and safe DTOs', async () => {
        await createAttempt(cand.id, a1.id, { status: 'SUBMITTED', score: 75, startedAt: new Date(), submittedAt: new Date() });

        const req = mockRequest('GET', undefined, cookieA);
        const res = await getProgression(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        
        expect(data.progression.length).toBe(1);
        const progData = data.progression[0];
        expect(progData.totalScore).toBe(75);

        const a1Round = progData.rounds.find((r: any) => r.assessmentId === a1.id);
        const a2Round = progData.rounds.find((r: any) => r.assessmentId === a2.id);
        expect(a1Round.score).toBe(75);
        expect(a2Round.score).toBeNull();

        const keys = Object.keys(progData.candidate);
        expect(keys).not.toContain('password');
        expect(keys).not.toContain('evaluationDetails');
    });

    it('Q. lifecycle restrictions for PUBLISHED event', async () => {
        const reqPublish = mockRequest('PATCH', { status: 'PUBLISHED' }, cookieA);
        await patchEvent(reqPublish, { params: Promise.resolve({ id: eventA.id }) });

        const reqAdd = mockRequest('POST', { assessmentId: a1.id }, cookieA);
        const resAdd = await attachAssessment(reqAdd, { params: Promise.resolve({ id: eventA.id }) });
        expect(resAdd.status).toBe(400);

        const reqRemove = mockRequest('DELETE', undefined, cookieA);
        const resRemove = await removeAssessment(reqRemove, { params: Promise.resolve({ id: eventA.id, assessmentId: a1.id }) });
        expect(resRemove.status).toBe(400);

        const reqReorder = mockRequest('PATCH', { assessmentIds: [a1.id, a2.id] }, cookieA);
        const resReorder = await reorderAssessments(reqReorder, { params: Promise.resolve({ id: eventA.id }) });
        expect(resReorder.status).toBe(400);
    });
});
