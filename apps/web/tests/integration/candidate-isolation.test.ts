import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { createOrganizer, createCandidate, createAssessment, createAttempt } from "../factories/entities";
import { createOrganizerSession } from "../helpers/auth";
import { NextRequest } from "next/server";
import { setMockCookie, clearMockCookies } from "../setup";
import { POST as JoinAttempt } from "../../app/api/attempts/route";
import { GET as GetCandidates } from "../../app/api/candidates/route";
import { GET as GetCandidateDetail } from "../../app/api/candidates/[id]/route";

describe("Candidate Isolation V1", () => {
    let orgA: any, orgB: any;
    let assessmentA: any, assessmentB: any;

    beforeAll(async () => {
        const testDbUrl = process.env.DATABASE_URL;
        if (!testDbUrl || !testDbUrl.includes("_test")) {
            throw new Error("DANGER: Not using the test database. Aborting.");
        }

        // Clean slate
        await prisma.candidate.deleteMany();
        await prisma.organizer.deleteMany();

        // Setup Organizers and Assessments
        orgA = await createOrganizer({ name: "Org A" });
        orgB = await createOrganizer({ name: "Org B" });

        assessmentA = await createAssessment(orgA.id, { title: "Exam A", status: "PUBLISHED" });
        assessmentB = await createAssessment(orgB.id, { title: "Exam B", status: "PUBLISHED" });

        const q1 = await prisma.question.create({
            data: { organizerId: orgA.id, title: "Q1", type: "MCQ", difficulty: "Easy", defaultMarks: 10 }
        });
        await prisma.assessmentQuestion.create({
            data: { assessmentId: assessmentA.id, questionId: q1.id, marks: 10, order: 0 }
        });

        const q2 = await prisma.question.create({
            data: { organizerId: orgB.id, title: "Q2", type: "MCQ", difficulty: "Easy", defaultMarks: 10 }
        });
        await prisma.assessmentQuestion.create({
            data: { assessmentId: assessmentB.id, questionId: q2.id, marks: 10, order: 0 }
        });
    });

    afterAll(async () => {
        await prisma.candidate.deleteMany();
        await prisma.question.deleteMany();
        await prisma.organizer.deleteMany();
    });

    it("creates independent candidates for the same email across organizers", async () => {
        const email = "shared@test.com";

        const reqA = new NextRequest("http://localhost:3000/api/attempts", {
            method: "POST",
            body: JSON.stringify({ accessCode: assessmentA.accessCode, name: "Alice A", email })
        });
        const resA = await JoinAttempt(reqA);
        expect(resA.status).toBe(200);

        const reqB = new NextRequest("http://localhost:3000/api/attempts", {
            method: "POST",
            body: JSON.stringify({ accessCode: assessmentB.accessCode, name: "Alice B", email })
        });
        const resB = await JoinAttempt(reqB);
        expect(resB.status).toBe(200);

        const candidates = await prisma.candidate.findMany({ where: { email } });
        expect(candidates).toHaveLength(2);

        const candA = candidates.find(c => c.organizerId === orgA.id);
        const candB = candidates.find(c => c.organizerId === orgB.id);

        expect(candA).toBeDefined();
        expect(candB).toBeDefined();
        expect(candA!.id).not.toBe(candB!.id);
        expect(candA!.name).toBe("Alice A");
        expect(candB!.name).toBe("Alice B");
    });

    const setAuthCookie = (cookie: string) => {
        setMockCookie('authjs.session-token', cookie);
    };

    it("isolates candidate listing by organizer", async () => {
        const cookie = await createOrganizerSession(orgA.id, orgA.email);
        setAuthCookie(cookie);
        const reqList = new NextRequest("http://localhost:3000/api/candidates");
        const resList = await GetCandidates(reqList);
        const dataList = await resList.json();
        
        expect(dataList.candidates).toHaveLength(1);
        expect(dataList.candidates[0].name).toBe("Alice A");
        clearMockCookies();
    });

    it("prevents cross-organizer candidate retrieval", async () => {
        const candB = await prisma.candidate.findFirst({ where: { organizerId: orgB.id } });
        
        const cookie = await createOrganizerSession(orgA.id, orgA.email);
        setAuthCookie(cookie);
        const reqDetail = new NextRequest(`http://localhost:3000/api/candidates/${candB!.id}`);
        const resDetail = await GetCandidateDetail(reqDetail, { params: Promise.resolve({ id: candB!.id }) });
        
        expect(resDetail.status).toBe(404);
        clearMockCookies();
    });
});
