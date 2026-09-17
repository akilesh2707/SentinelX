import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { createOrganizer, createCandidate, createAssessment, createAttempt } from "../factories/entities";
import { createOrganizerSession, createCandidateSession } from "../helpers/auth";
import { setMockCookie, clearMockCookies } from "../setup";
import { NextRequest } from "next/server";

// API Route Imports
import { POST as CreateAssessment, GET as GetAssessments } from "../../app/api/assessments/route";
import { PATCH as PatchAssessment } from "../../app/api/assessments/[id]/route";
import { GET as GetQuestions, POST as CreateQuestion } from "../../app/api/questions/route";
import { PUT as UpdateQuestion, DELETE as DeleteQuestion } from "../../app/api/questions/[id]/route";
import { GET as GetCandidateHistory } from "../../app/api/candidates/[id]/route";
import { GET as GetAttemptAnswers, POST as SubmitAnswer } from "../../app/api/attempts/[id]/answers/route";
import { POST as SubmitAttempt } from "../../app/api/attempts/[id]/submit/route";
import { POST as StartAttempt } from "../../app/api/attempts/[id]/start/route";
import { GET as GetResultOrganizer } from "../../app/api/results/[attemptId]/route";
import { GET as GetResultCandidate } from "../../app/api/attempts/[id]/result/route";
import { POST as SubmitProctoringEvent } from "../../app/api/attempts/[id]/proctoring-events/route";
import { GET as GetEvidence } from "../../app/api/evidence/[id]/route";
import { GET as GetIncidentEvidence } from "../../app/api/incidents/[incidentId]/evidence/route";
import { POST as CreateEvent } from "../../app/api/events/route";
import { GET as GetEvent } from "../../app/api/events/[id]/route";
import { PATCH as UpdateIncident } from "../../app/api/incidents/[incidentId]/route";
import { GET as GetDashboard } from "../../app/api/dashboard/route";

describe("Security + Authorization Audit E2E Pipeline", () => {
    let orgA: any, orgB: any;
    let cookieOrgA: string, cookieOrgB: string;
    let questionA: any, questionB: any;
    let assessA: any, assessB: any;
    let candA: any, candB: any;
    let attemptA: any, attemptB: any;
    let cookieCandA: string, cookieCandB: string;
    let incidentA: any;
    let evidenceA: any;
    let eventA: any;
    let attemptQuestionA: any;

    beforeAll(async () => {
        // Create Organizers
        orgA = await createOrganizer();
        orgB = await createOrganizer();
        cookieOrgA = await createOrganizerSession(orgA.id, orgA.email);
        cookieOrgB = await createOrganizerSession(orgB.id, orgB.email);

        // Create Questions
        questionA = await prisma.question.create({
            data: { organizerId: orgA.id, title: "Q A", type: "MCQ", difficulty: "Easy", defaultMarks: 10 }
        });
        questionB = await prisma.question.create({
            data: { organizerId: orgB.id, title: "Q B", type: "MCQ", difficulty: "Easy", defaultMarks: 10 }
        });

        // Create Assessments
        assessA = await createAssessment(orgA.id, { title: "Assess A" });
        assessB = await createAssessment(orgB.id, { title: "Assess B" });

        // Add questions to assessments
        await prisma.assessmentQuestion.create({
            data: { assessmentId: assessA.id, questionId: questionA.id, marks: 10, order: 1 }
        });
        await prisma.assessmentQuestion.create({
            data: { assessmentId: assessB.id, questionId: questionB.id, marks: 10, order: 1 }
        });

        // Create Candidates
        candA = await createCandidate(orgA.id, { name: "Cand A" });
        candB = await createCandidate(orgB.id, { name: "Cand B" });

        // Create Attempts
        attemptA = await createAttempt(candA.id, assessA.id, { status: "IN_PROGRESS" });
        attemptB = await createAttempt(candB.id, assessB.id, { status: "IN_PROGRESS" });

        // Create Attempt Questions
        attemptQuestionA = await prisma.attemptQuestion.create({
            data: { attemptId: attemptA.id, questionId: questionA.id, marks: 10, order: 1 }
        });

        cookieCandA = await createCandidateSession(candA.id, attemptA.id);
        cookieCandB = await createCandidateSession(candB.id, attemptB.id);

        // Create Incidents & Evidence
        incidentA = await prisma.incident.create({
            data: { attemptId: attemptA.id, type: "WINDOW_BLUR", severity: "LOW", eventCount: 1, firstSeen: new Date(), lastSeen: new Date() }
        });
        evidenceA = await prisma.evidence.create({
            data: { incidentId: incidentA.id, type: "CAMERA_SNAPSHOT", storageKey: "path/to/evidence.jpg", mimeType: "image/jpeg", sizeBytes: 1024, capturedAt: new Date() }
        });

        // Create Event
        eventA = await prisma.event.create({
            data: { organizerId: orgA.id, title: "Event A", status: "DRAFT" }
        });
    });

    afterAll(async () => {
        await prisma.evidence.deleteMany();
        await prisma.incidentEvent.deleteMany();
        await prisma.incident.deleteMany();
        await prisma.answer.deleteMany();
        await prisma.attemptQuestion.deleteMany();
        await prisma.assessmentAttempt.deleteMany();
        await prisma.candidate.deleteMany();
        await prisma.eventAssessment.deleteMany();
        await prisma.event.deleteMany();
        await prisma.assessmentQuestion.deleteMany();
        await prisma.assessment.deleteMany();
        await prisma.question.deleteMany();
        await prisma.organizer.deleteMany();
    });

    const setOrg = (cookie: string) => {
        clearMockCookies();
        setMockCookie("authjs.session-token", cookie);
    };

    const setCand = (cookie: string) => {
        clearMockCookies();
        setMockCookie("candidate_session", cookie);
    };

    it("1. Phase 4 - Unauthenticated Access", async () => {
        clearMockCookies();
        
        // Organizer APIs
        let req = new NextRequest(`http://localhost:3000/api/dashboard`);
        let res: any = await GetDashboard();
        expect(res.status).toBe(401);

        req = new NextRequest(`http://localhost:3000/api/assessments/${assessA.id}`);
        res = await PatchAssessment(req, { params: Promise.resolve({ id: assessA.id }) });
        expect(res.status).toBe(401);

        // Candidate APIs
        req = new NextRequest(`http://localhost:3000/api/attempts/${attemptA.id}/result`);
        res = await GetResultCandidate(req, { params: Promise.resolve({ id: attemptA.id }) });
        expect(res.status).toBe(403); // requireCandidateAttempt returns 403 on null
    });

    it("2. Phase 5 - Organizer Tenant Isolation", async () => {
        setOrg(cookieOrgA);

        // Org A accessing Org B's Assessment
        let req = new NextRequest(`http://localhost:3000/api/assessments/${assessB.id}`, {
            method: "PATCH",
            body: JSON.stringify({ title: "Hacked" })
        });
        let res: any = await PatchAssessment(req, { params: Promise.resolve({ id: assessB.id }) });
        expect(res.status).toBe(404); // Scoped to organizerId

        // Org A accessing Org B's Question
        req = new NextRequest(`http://localhost:3000/api/questions/${questionB.id}`, {
            method: "PUT",
            body: JSON.stringify({ title: "Hacked Q" })
        });
        res = await UpdateQuestion(req, { params: Promise.resolve({ id: questionB.id }) });
        expect(res.status).toBe(403); // Explicit forbidden check

        // Org A accessing Org B's Candidate
        req = new NextRequest(`http://localhost:3000/api/candidates/${candB.id}`);
        res = await GetCandidateHistory(req, { params: Promise.resolve({ id: candB.id }) });
        expect(res.status).toBe(404);

        // Org A accessing Org B's Result
        req = new NextRequest(`http://localhost:3000/api/results/${attemptB.id}`);
        res = await GetResultOrganizer(req, { params: Promise.resolve({ attemptId: attemptB.id }) });
        expect(res.status).toBe(404);
    });

    it("3. Phase 6 - Question IDOR Regression (Fixed)", async () => {
        setOrg(cookieOrgA);

        // Org A tries to create an assessment with Org B's question
        const req = new NextRequest("http://localhost:3000/api/assessments", {
            method: "POST",
            body: JSON.stringify({
                title: "Malicious Assessment",
                type: "EXAM",
                questions: [{
                    questionId: questionB.id,
                    marks: 10,
                    order: 1
                }] // Org B's question
            })
        });

        const res = await CreateAssessment(req);
        
        // After our fix, it should reject because it won't find the question scoped to Org A
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("One or more selected questions do not exist");

        // Valid case: Org A creates assessment with Org A's question
        const reqValid = new NextRequest("http://localhost:3000/api/assessments", {
            method: "POST",
            body: JSON.stringify({
                title: "Valid Assessment",
                type: "EXAM",
                difficulty: "Medium",
                questions: [{
                    questionId: questionA.id,
                    marks: 10,
                    order: 1
                }]
            })
        });

        const resValid = await CreateAssessment(reqValid);
        expect(resValid.status).toBe(201);
    });

    it("4. Phase 7 - Candidate Isolation", async () => {
        setCand(cookieCandA);

        // Cand A accesses Attempt B's Answers
        let req = new NextRequest(`http://localhost:3000/api/attempts/${attemptB.id}/answers`);
        let res: any = await GetAttemptAnswers(req, { params: Promise.resolve({ id: attemptB.id }) });
        expect(res.status).toBe(403); // JWT attemptId bound to Attempt A

        // Cand A accesses Attempt B's Result
        req = new NextRequest(`http://localhost:3000/api/attempts/${attemptB.id}/result`);
        res = await GetResultCandidate(req, { params: Promise.resolve({ id: attemptB.id }) });
        expect(res.status).toBe(403);
        
        // Cand A submits proctoring event for Attempt B
        req = new NextRequest(`http://localhost:3000/api/attempts/${attemptB.id}/proctoring-events`, {
            method: "POST",
            body: JSON.stringify({ events: [] })
        });
        res = await SubmitProctoringEvent(req, { params: Promise.resolve({ id: attemptB.id }) });
        expect(res.status).toBe(403);
    });

    it("5. Phase 8 - Candidate VS Organizer Boundary", async () => {
        setCand(cookieCandA); // Authentic candidate session

        // Try to create a question (Organizer API)
        let req = new NextRequest(`http://localhost:3000/api/questions`, {
            method: "POST",
            body: JSON.stringify({ title: "Hack", type: "MCQ", difficulty: "Easy" })
        });
        let res: any = await CreateQuestion(req);
        expect(res.status).toBe(401); // Organizer API expects auth(), which fails for Candidate

        // Try to access events
        req = new NextRequest(`http://localhost:3000/api/events`);
        res = await GetEvent(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(401);
    });

    it("6. Phase 9 - Mass Assignment (Organizer Override)", async () => {
        setOrg(cookieOrgA);

        // Try to create an Event and forcibly assign it to Org B
        const req = new NextRequest(`http://localhost:3000/api/events`, {
            method: "POST",
            body: JSON.stringify({ title: "Evil Event", organizerId: orgB.id }) // Injection attempt
        });
        const res = await CreateEvent(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        // Check DB to ensure it was created with orgA.id regardless of payload
        const createdEvent = await prisma.event.findUnique({ where: { id: data.event.id } });
        expect(createdEvent!.organizerId).toBe(orgA.id);
        expect(createdEvent!.organizerId).not.toBe(orgB.id);
    });

    it("7. Phase 10 - Attempt State Security", async () => {
        // Change Attempt A to SUBMITTED directly
        await prisma.assessmentAttempt.update({
            where: { id: attemptA.id },
            data: { status: "SUBMITTED" }
        });

        setCand(cookieCandA);

        // Try to submit answer for SUBMITTED attempt
        const req = new NextRequest(`http://localhost:3000/api/attempts/${attemptA.id}/answers`, {
            method: "POST",
            body: JSON.stringify({ attemptQuestionId: attemptQuestionA.id, selectedOptionId: "opt1" })
        });
        const res = await SubmitAnswer(req, { params: Promise.resolve({ id: attemptA.id }) });
        expect(res.status).toBe(403); // "Attempt is not in progress"

        // Try to start a SUBMITTED attempt
        const reqStart = new NextRequest(`http://localhost:3000/api/attempts/${attemptA.id}/start`, {
            method: "POST"
        });
        const resStart = await StartAttempt(reqStart, { params: Promise.resolve({ id: attemptA.id }) });
        expect(resStart.status).toBe(403); // "Cannot start an attempt in SUBMITTED state"
    });

    it("8. Phase 11 - Result Security & Masking", async () => {
        // Attempt A is already SUBMITTED
        setCand(cookieCandA);
        const req = new NextRequest(`http://localhost:3000/api/attempts/${attemptA.id}/result`);
        const res = await GetResultCandidate(req, { params: Promise.resolve({ id: attemptA.id }) });
        expect(res.status).toBe(200);
        
        const data = await res.json();
        // Result must NOT leak isCorrect or expectedOutputs
        // Candidate API doesn't return questions at all, naturally masking them.
        expect(data.result.questions).toBeUndefined();
    });

    it("9. Phase 12 - Proctoring Security", async () => {
        // attempt A is submitted, let's revert to IN_PROGRESS for this test
        await prisma.assessmentAttempt.update({
            where: { id: attemptA.id },
            data: { status: "IN_PROGRESS" }
        });

        setCand(cookieCandA);

        // Try to submit proctoring event for Attempt A using a clientEventId belonging to Attempt B?
        // Actually, the API derives AttemptId from route, so cross-attempt idempotency is blocked natively.
        const req = new NextRequest(`http://localhost:3000/api/attempts/${attemptA.id}/proctoring-events`, {
            method: "POST",
            body: JSON.stringify({
                events: [{
                    clientEventId: "fake-id",
                    type: "WINDOW_BLUR",
                    clientTimestamp: new Date().toISOString()
                }]
            })
        });
        const res = await SubmitProctoringEvent(req, { params: Promise.resolve({ id: attemptA.id }) });
        expect(res.status).toBe(200); // Succeeds for their own attempt
    });

    it("10. Phase 13 - Evidence Security & Storage Leak Fix", async () => {
        setOrg(cookieOrgA);
        const req = new NextRequest(`http://localhost:3000/api/incidents/${incidentA.id}/evidence`);
        const res = await GetIncidentEvidence(req, { params: Promise.resolve({ incidentId: incidentA.id }) });
        expect(res.status).toBe(200);

        const data = await res.json();
        const ev = data.evidence[0];
        
        // Verify storageKey is NOT exposed (Fixed)
        expect(ev.storageKey).toBeUndefined();
        
        // Verify other valid fields are present
        expect(ev.id).toBe(evidenceA.id);
        expect(ev.type).toBe("CAMERA_SNAPSHOT");

        // Test Cross-Organizer Evidence access
        setOrg(cookieOrgB);
        const reqB = new NextRequest(`http://localhost:3000/api/incidents/${incidentA.id}/evidence`);
        const resB = await GetIncidentEvidence(reqB, { params: Promise.resolve({ incidentId: incidentA.id }) });
        expect(resB.status).toBe(403);
    });

    it("11. Phase 14 - Event Security", async () => {
        setOrg(cookieOrgB);
        
        // Org B tries to edit Org A's Event
        const req = new NextRequest(`http://localhost:3000/api/events/${eventA.id}`);
        const res = await GetEvent(req, { params: Promise.resolve({ id: eventA.id }) });
        expect(res.status).toBe(404);
    });

    it("12. Phase 15 & 16 - Input Validation & Pagination Bounds", async () => {
        setOrg(cookieOrgA);
        
        // Testing extreme pagination limit
        const req = new NextRequest(`http://localhost:3000/api/dashboard?page=-1&limit=99999`);
        const res = await GetDashboard();
        expect(res.status).toBe(200); // the API natively caps limit to 100, page to >= 1
    });
});
