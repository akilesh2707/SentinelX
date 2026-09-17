import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { createOrganizer } from "../factories/entities";
import { createOrganizerSession, createCandidateSession } from "../helpers/auth";
import { setMockCookie, clearMockCookies } from "../setup";
import { NextRequest } from "next/server";

import { POST as StartAttempt } from "../../app/api/attempts/[id]/start/route";
import { POST as ProctoringEvents } from "../../app/api/attempts/[id]/proctoring-events/route";
import { POST as SubmitEvidence } from "../../app/api/attempts/[id]/evidence/route";
import { GET as OrganizerAttemptDetails } from "../../app/api/proctoring/[attemptId]/route";
import { PATCH as UpdateIncident } from "../../app/api/incidents/[incidentId]/route";
import { GET as GetEvidence, DELETE as DeleteEvidence } from "../../app/api/evidence/[id]/route";

describe("Proctoring Pipeline Integration", () => {
    let orgA: any;
    let orgB: any;
    let cookieOrgA: string;
    let cookieOrgB: string;

    let assessmentId: string;
    let attemptId: string;
    let candidateId: string;
    let cookieCandidateA: string;

    let incidentId1: string;

    beforeAll(async () => {
        orgA = await createOrganizer();
        orgB = await createOrganizer();
        cookieOrgA = await createOrganizerSession(orgA.id, orgA.email);
        cookieOrgB = await createOrganizerSession(orgB.id, orgB.email);

        const assessment = await prisma.assessment.create({
            data: {
                title: "Proctoring Exam",
                type: "EXAM",
                duration: 60,
                difficulty: "Medium",
                lateJoin: true,
                totalMarks: 10,
                passingScore: 5,
                status: "PUBLISHED",
                organizerId: orgA.id,
                accessCode: "PROCT1",
                joinLink: "http://test/PROCT1"
            }
        });
        assessmentId = assessment.id;

        const candidate = await prisma.candidate.create({
            data: {
                organizerId: orgA.id,
                name: "Proct Cand",
                email: "proctcand@test.com"
            }
        });
        candidateId = candidate.id;

        const attempt = await prisma.assessmentAttempt.create({
            data: {
                candidateId: candidate.id,
                assessmentId: assessment.id,
                status: "NOT_STARTED",
            }
        });
        attemptId = attempt.id;

        cookieCandidateA = await createCandidateSession(candidate.id, attempt.id);
    });

    afterAll(async () => {
        await prisma.evidence.deleteMany();
        await prisma.incidentEvent.deleteMany();
        await prisma.incident.deleteMany();
        await prisma.proctoringEvent.deleteMany();
        await prisma.assessmentAttempt.deleteMany();
        await prisma.candidate.deleteMany();
        await prisma.assessment.deleteMany();
        await prisma.organizer.deleteMany();
    });

    const setCandidateAuth = () => {
        clearMockCookies();
        setMockCookie("candidate_session", cookieCandidateA);
    };

    const setOrgAuth = (cookie: string) => {
        clearMockCookies();
        setMockCookie("authjs.session-token", cookie);
    };

    it("1. Exam events are ignored before attempt starts (403)", async () => {
        setCandidateAuth();
        const req = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/proctoring-events`, {
            method: "POST",
            body: JSON.stringify({ events: [{ clientEventId: "pre", type: "TAB_SWITCH" }] })
        });
        const res = await ProctoringEvents(req, { params: Promise.resolve({ id: attemptId }) });
        expect(res.status).toBe(403);
    });

    it("2. EXAM_STARTED transitions state but does not create security incidents", async () => {
        setCandidateAuth();
        const startReq = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/start`, { method: "POST" });
        const startRes = await StartAttempt(startReq, { params: Promise.resolve({ id: attemptId }) });
        expect(startRes.status).toBe(200);

        const eventReq = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/proctoring-events`, {
            method: "POST",
            body: JSON.stringify({
                events: [
                    { clientEventId: "start1", type: "EXAM_STARTED", clientTimestamp: new Date().toISOString() }
                ]
            })
        });
        const eventRes = await ProctoringEvents(eventReq, { params: Promise.resolve({ id: attemptId }) });
        expect(eventRes.status).toBe(200);

        const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
        expect(attempt!.riskScore).toBe(0);

        const incidents = await prisma.incident.findMany({ where: { attemptId } });
        expect(incidents.length).toBe(0); // Lifecycle event does not create incident
    });

    it("3. Incident Grouping - 5 minute sliding window", async () => {
        setCandidateAuth();
        
        const t0 = new Date("2026-01-01T10:00:00Z");
        const t1 = new Date("2026-01-01T10:04:00Z"); // +4m
        const t2 = new Date("2026-01-01T10:08:00Z"); // +4m from t1 (inside 5m window of t1)
        const t3 = new Date("2026-01-01T10:14:00Z"); // +6m from t2 (outside 5m window)

        const req1 = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/proctoring-events`, {
            method: "POST",
            body: JSON.stringify({
                events: [
                    { clientEventId: "ev1", type: "TAB_SWITCH", clientTimestamp: t0.toISOString() },
                    { clientEventId: "ev2", type: "TAB_SWITCH", clientTimestamp: t1.toISOString() },
                    { clientEventId: "ev3", type: "TAB_SWITCH", clientTimestamp: t2.toISOString() }
                ]
            })
        });
        const res1 = await ProctoringEvents(req1, { params: Promise.resolve({ id: attemptId }) });
        expect(res1.status).toBe(200);

        let incidents = await prisma.incident.findMany({ where: { attemptId } });
        expect(incidents.length).toBe(1); // Grouped into 1 episode
        expect(incidents[0].eventCount).toBe(3);
        expect(incidents[0].firstSeen.getTime()).toBe(t0.getTime());
        expect(incidents[0].lastSeen.getTime()).toBe(t2.getTime());

        // Wait, risk score for TAB_SWITCH is 5.
        let attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
        expect(attempt!.riskScore).toBe(5); 

        // Now outside window
        const req2 = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/proctoring-events`, {
            method: "POST",
            body: JSON.stringify({
                events: [
                    { clientEventId: "ev4", type: "TAB_SWITCH", clientTimestamp: t3.toISOString() }
                ]
            })
        });
        const res2 = await ProctoringEvents(req2, { params: Promise.resolve({ id: attemptId }) });
        expect(res2.status).toBe(200);

        incidents = await prisma.incident.findMany({ where: { attemptId }, orderBy: { firstSeen: 'asc' } });
        expect(incidents.length).toBe(2); 
        expect(incidents[1].firstSeen.getTime()).toBe(t3.getTime());

        attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
        expect(attempt!.riskScore).toBe(10); // 5 + 5

        incidentId1 = incidents[0].id;
    });

    it("4. Idempotency of Events", async () => {
        setCandidateAuth();
        const t_idem = new Date("2026-01-01T10:14:00Z"); 
        
        // Sending ev4 again!
        const req = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/proctoring-events`, {
            method: "POST",
            body: JSON.stringify({
                events: [
                    { clientEventId: "ev4", type: "TAB_SWITCH", clientTimestamp: t_idem.toISOString() }
                ]
            })
        });
        const res = await ProctoringEvents(req, { params: Promise.resolve({ id: attemptId }) });
        expect(res.status).toBe(200);

        const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
        expect(attempt!.riskScore).toBe(10); // Still 10, no change!

        const events = await prisma.proctoringEvent.findMany({ where: { clientEventId: "ev4" } });
        expect(events.length).toBe(1);
    });

    it("5. Risk Score cap at 100 & specific event weights", async () => {
        setCandidateAuth();
        // Currently score is 10.
        // We will add 10x CAMERA_UNAVAILABLE (10 pts each) across different time windows to exceed 100.
        const events = [];
        let time = new Date("2026-01-01T11:00:00Z");
        for (let i = 0; i < 12; i++) {
            events.push({
                clientEventId: `cam_${i}`,
                type: "CAMERA_UNAVAILABLE",
                clientTimestamp: time.toISOString()
            });
            time = new Date(time.getTime() + 10 * 60000); // +10 minutes per event
        }

        // Include NETWORK_DISCONNECT (0 points)
        events.push({
            clientEventId: "net_down",
            type: "NETWORK_DISCONNECT",
            clientTimestamp: time.toISOString()
        });
        
        // Include AI signals
        time = new Date(time.getTime() + 10 * 60000);
        events.push({
            clientEventId: "ai_1",
            type: "AI_MULTIPLE_FACES", // 4 pts
            clientTimestamp: time.toISOString()
        });

        const req = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/proctoring-events`, {
            method: "POST",
            body: JSON.stringify({ events })
        });
        const res = await ProctoringEvents(req, { params: Promise.resolve({ id: attemptId }) });
        expect(res.status).toBe(200);

        const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
        expect(attempt!.riskScore).toBe(100); // Capped at 100, not 10 + 120 + 0 + 4 = 134
        
        const incidents = await prisma.incident.findMany({ where: { type: "NETWORK_DISCONNECT" } });
        expect(incidents.length).toBe(1); // Created incident for visibility
    });

    it("6. Evidence Automatic Storage & Idempotency", async () => {
        setCandidateAuth();

        const formData1 = new FormData();
        formData1.append("incidentId", incidentId1);
        formData1.append("clientEvidenceId", "snap1");
        formData1.append("type", "CAMERA_SNAPSHOT");
        formData1.append("capturedAt", new Date().toISOString());
        // Create 1px webp valid payload
        const webpBytes = Buffer.from("RIFF\x14\x00\x00\x00WEBPVP8 \x08\x00\x00\x00\x9d\x01\x2a\x01\x00\x01\x00", "ascii");
        formData1.append("file", new File([webpBytes], "snap.webp", { type: "image/webp" }));

        const req1 = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/evidence`, { method: "POST", body: formData1 });
        const res1 = await SubmitEvidence(req1, { params: Promise.resolve({ id: attemptId }) });
        expect(res1.status).toBe(200);

        const data1 = await res1.json();
        expect(data1.evidence.storageKey).toBeUndefined(); // Storage key MUST NOT be leaked!

        // Idempotency: Duplicate upload
        const req2 = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/evidence`, { method: "POST", body: formData1 });
        const res2 = await SubmitEvidence(req2, { params: Promise.resolve({ id: attemptId }) });
        expect(res2.status).toBe(200);

        const dbEvidence = await prisma.evidence.findMany({ where: { clientEvidenceId: "snap1" } });
        expect(dbEvidence.length).toBe(1); // Only 1 created
    });

    it("7. Organizer Authorization & DTO Security", async () => {
        setOrgAuth(cookieOrgA);
        const req1 = new NextRequest(`http://localhost:3000/api/proctoring/${attemptId}`);
        const res1 = await OrganizerAttemptDetails(req1, { params: Promise.resolve({ attemptId }) });
        expect(res1.status).toBe(200);
        const dataA = await res1.json();
        
        expect(dataA.attempt.candidate.name).toBeDefined();
        // Should not expose auth keys or raw db secrets
        expect(dataA.attempt.candidate.passwordHash).toBeUndefined();
        
        // Evidence is nested
        const tabSwitchIncident = dataA.incidents.find((i: any) => i.id === incidentId1);
        expect(tabSwitchIncident).toBeDefined();
        expect(tabSwitchIncident.evidence.length).toBeGreaterThan(0);
        // Storage key is NOT exposed
        expect(tabSwitchIncident.evidence[0].storageKey).toBeUndefined();

        // Cross-Organizer Reject
        setOrgAuth(cookieOrgB);
        const req2 = new NextRequest(`http://localhost:3000/api/proctoring/${attemptId}`);
        const res2 = await OrganizerAttemptDetails(req2, { params: Promise.resolve({ attemptId }) });
        expect(res2.status).toBe(404); // Attempt not found for Org B
    });

    it("8. Incident Status Mutation does not alter Risk Score", async () => {
        setOrgAuth(cookieOrgA);
        
        const req = new NextRequest(`http://localhost:3000/api/incidents/${incidentId1}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "DISMISSED" })
        });
        const res = await UpdateIncident(req, { params: Promise.resolve({ incidentId: incidentId1 }) });
        expect(res.status).toBe(200);

        // Check Risk Score remains 100
        const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
        expect(attempt!.riskScore).toBe(100);
    });

    it("9. Secure Evidence Fetch", async () => {
        setOrgAuth(cookieOrgA);
        
        const evidenceId = (await prisma.evidence.findFirst({ where: { incidentId: incidentId1 } }))!.id;

        const req = new NextRequest(`http://localhost:3000/api/evidence/${evidenceId}`);
        const res = await GetEvidence(req, { params: Promise.resolve({ id: evidenceId }) });
        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toBe("image/webp");

        // Org B rejected
        setOrgAuth(cookieOrgB);
        const req2 = new NextRequest(`http://localhost:3000/api/evidence/${evidenceId}`);
        const res2 = await GetEvidence(req2, { params: Promise.resolve({ id: evidenceId }) });
        expect(res2.status).toBe(403);
    });
});
