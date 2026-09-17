import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { createOrganizer } from "../factories/entities";
import { createOrganizerSession, createCandidateSession } from "../helpers/auth";
import { setMockCookie, clearMockCookies } from "../setup";
import { NextRequest } from "next/server";

import { POST as CreateAssessment } from "../../app/api/assessments/route";
import { POST as CreateQuestion } from "../../app/api/questions/route";
import { POST as AttachQuestions } from "../../app/api/assessments/[id]/questions/route";
import { POST as PublishAssessment } from "../../app/api/assessments/[id]/publish/route";
import { POST as CandidateJoin } from "../../app/api/attempts/route";
import { POST as StartAttempt } from "../../app/api/attempts/[id]/start/route";
import { GET as GetQuestions } from "../../app/api/attempts/[id]/questions/route";
import { POST as SaveAnswer, GET as GetAnswers } from "../../app/api/attempts/[id]/answers/route";
import { POST as SubmitAttempt } from "../../app/api/attempts/[id]/submit/route";
import { GET as CandidateResult } from "../../app/api/attempts/[id]/result/route";
import { GET as OrganizerResult } from "../../app/api/results/[attemptId]/route";

describe("Assessment -> Candidate E2E Completion", () => {
    let orgA: any;
    let orgB: any;
    let cookieA: string;
    let cookieB: string;

    let assessmentId: string;
    let mcqId: string;
    let codingId: string;
    let attemptId: string;
    let candidateId: string;
    let accessCode: string;

    const setAuthCookie = (cookie: string) => {
        clearMockCookies();
        setMockCookie("authjs.session-token", cookie);
    };

    beforeAll(async () => {
        orgA = await createOrganizer();
        orgB = await createOrganizer();
        cookieA = await createOrganizerSession(orgA.id, orgA.email);
        cookieB = await createOrganizerSession(orgB.id, orgB.email);
    });

    afterAll(async () => {
        await prisma.answer.deleteMany();
        await prisma.attemptQuestion.deleteMany();
        await prisma.assessmentAttempt.deleteMany();
        await prisma.candidate.deleteMany();
        await prisma.assessmentQuestion.deleteMany();
        await prisma.codingTestCase.deleteMany();
        await prisma.questionOption.deleteMany();
        await prisma.question.deleteMany();
        await prisma.assessment.deleteMany();
        await prisma.organizer.deleteMany();
    });

    it("A & B. Organizer creates assessment and adds questions", async () => {
        // Use factories to create deterministic DB state
        
        // 1. Create Assessment (DRAFT)
        const assessment = await prisma.assessment.create({
            data: {
                title: "E2E Test Assessment",
                type: "EXAM",
                duration: 60,
                difficulty: "Medium",
                lateJoin: true,
                totalMarks: 25,
                passingScore: 10,
                status: "DRAFT",
                organizerId: orgA.id,
                accessCode: "E2E123",
                joinLink: "http://test/E2E123"
            }
        });
        assessmentId = assessment.id;
        accessCode = assessment.accessCode;

        // 2. Create MCQ Question
        const mcq = await prisma.question.create({
            data: {
                organizerId: orgA.id,
                type: "MCQ",
                title: "E2E MCQ",
                difficulty: "Easy",
                defaultMarks: 5,
                options: {
                    create: [
                        { optionKey: "A", text: "Wrong", order: 1, isCorrect: false },
                        { optionKey: "B", text: "Right", order: 2, isCorrect: true }
                    ]
                }
            }
        });
        mcqId = mcq.id;

        // 3. Create Coding Question
        const coding = await prisma.question.create({
            data: {
                organizerId: orgA.id,
                type: "CODING",
                title: "E2E CODING",
                difficulty: "Medium",
                defaultMarks: 20,
                starterCode: "def solve():\n    pass",
                testCases: {
                    create: [
                        { input: "1", expectedOutput: "1", marks: 10, order: 1, isHidden: false },
                        { input: "2", expectedOutput: "2", marks: 10, order: 2, isHidden: true }
                    ]
                }
            }
        });
        codingId = coding.id;

        // 4. Attach to Assessment via API to verify the API works for attachments
        setAuthCookie(cookieA);
        const reqAttach = new NextRequest(`http://localhost:3000/api/assessments/${assessmentId}/questions`, {
            method: "POST",
            body: JSON.stringify({ questionIds: [mcqId, codingId] })
        });
        const resAttach = await AttachQuestions(reqAttach, { params: Promise.resolve({ id: assessmentId }) });
        expect(resAttach.status).toBe(200);
    });

    it("C. Valid assessment can be published", async () => {
        setAuthCookie(cookieA);
        const reqPub = new NextRequest(`http://localhost:3000/api/assessments/${assessmentId}/publish`, {
            method: "POST"
        });
        const resPub = await PublishAssessment(reqPub, { params: Promise.resolve({ id: assessmentId }) });
        expect(resPub.status).toBe(200);

        const check = await prisma.assessment.findUnique({ where: { id: assessmentId } });
        expect(check!.status).toBe("PUBLISHED");
    });

    it("D. Candidate can join published assessment", async () => {
        clearMockCookies(); // Candidate is unauthenticated initially
        const req = new NextRequest("http://localhost:3000/api/attempts", {
            method: "POST",
            body: JSON.stringify({
                accessCode,
                name: "E2E Candidate",
                email: "e2e@test.com"
            })
        });
        const res = await CandidateJoin(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        attemptId = data.attempt.id;

        const attemptCheck = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId }});
        expect(attemptCheck).toBeDefined();
        candidateId = attemptCheck!.candidateId;
    });

    it("E. Candidate is isolated to the correct organizer", async () => {
        const cand = await prisma.candidate.findUnique({ where: { id: candidateId } });
        expect(cand!.organizerId).toBe(orgA.id);
    });

    it("L. Server-side expiry is enforced deterministically via timer bounds (Timer Bug Fix Check)", async () => {
        // We will modify the assessment temporarily to test the bounds.
        const now = new Date();
        const endDate = new Date(now.getTime() + 10 * 60000); // Ends in 10 minutes
        
        await prisma.assessment.update({
            where: { id: assessmentId },
            data: { 
                duration: 60, // 60 minutes
                lateJoin: true,
                endDate 
            }
        });

        const candSession = await createCandidateSession(candidateId, attemptId);
        clearMockCookies();
        setMockCookie("candidate_session", candSession); // Use correct candidate cookie

        const req = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/start`, { method: "POST" });
        const res = await StartAttempt(req, { params: Promise.resolve({ id: attemptId }) });
        
        if (res.status !== 200) {
            console.error("StartAttempt Failed:", res.status, await res.text());
        }
        expect(res.status).toBe(200);

        const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
        expect(attempt!.status).toBe("IN_PROGRESS");
        expect(attempt!.startedAt).toBeDefined();
        expect(attempt!.expiresAt).toBeDefined();
        
        // Assert expiresAt is bounded by endDate
        expect(attempt!.expiresAt!.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    it("G. Answers persist", async () => {
        // Fetch questions first
        const reqQ = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/questions`);
        const resQ = await GetQuestions(reqQ, { params: Promise.resolve({ id: attemptId }) });
        const dataQ = await resQ.json();
        
        const mcqAq = dataQ.questions.find((q: any) => q.question.type === "MCQ");
        const codingAq = dataQ.questions.find((q: any) => q.question.type === "CODING");

        // Answer MCQ
        const correctOpt = mcqAq.question.options.find((o: any) => o.text === "Right").id;
        const reqA1 = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/answers`, {
            method: "POST",
            body: JSON.stringify({
                attemptQuestionId: mcqAq.id,
                selectedOptionId: correctOpt
            })
        });
        const resA1 = await SaveAnswer(reqA1, { params: Promise.resolve({ id: attemptId }) });
        expect(resA1.status).toBe(200);

        // Answer Coding (Correct code in python)
        const code = "print(input())";
        const reqA2 = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/answers`, {
            method: "POST",
            body: JSON.stringify({
                attemptQuestionId: codingAq.id,
                submittedCode: code,
                language: "python"
            })
        });
        const resA2 = await SaveAnswer(reqA2, { params: Promise.resolve({ id: attemptId }) });
        expect(resA2.status).toBe(200);
    });

    it("H. Answers survive refresh/re-fetch", async () => {
        const req = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/answers`);
        const res = await GetAnswers(req, { params: Promise.resolve({ id: attemptId }) });
        expect(res.status).toBe(200);
        
        const data = await res.json();
        expect(data.answers.length).toBe(2);
        
        const codingAnswer = data.answers.find((a: any) => a.submittedCode !== null);
        expect(codingAnswer!.submittedCode).toBe("print(input())");
    });

    it("K. Submission is idempotent", async () => {
        const req = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/submit`, { method: "POST" });
        const res = await SubmitAttempt(req, { params: Promise.resolve({ id: attemptId }) });
        expect(res.status).toBe(200);

        const req2 = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/submit`, { method: "POST" });
        const res2 = await SubmitAttempt(req2, { params: Promise.resolve({ id: attemptId }) });
        expect(res2.status).toBe(200); // Idempotent

        const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId }});
        expect(attempt!.status).toBe("SUBMITTED");
    });

    it("I & J. MCQ and Coding scoring works correctly", async () => {
        const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId }});
        // MCQ = 5 marks, Coding = 20 marks. Total = 25.
        // We answered both correctly.
        expect(attempt!.score).toBe(25);
        expect(attempt!.maxScore).toBe(25);
    });

    it("M. Candidate result uses a safe DTO (Hidden outputs protected)", async () => {
        const req = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/result`);
        const res = await CandidateResult(req, { params: Promise.resolve({ id: attemptId }) });
        expect(res.status).toBe(200);
        
        const data = await res.json();
        // Ensure no hidden tests or code leaked
        expect(data.result.score).toBe(25);
        expect(data.result.percentage).toBe(100);
        expect(data.result.testCases).toBeUndefined(); // Safe DTO
    });

    it("N. Organizer result uses a safe DTO", async () => {
        setAuthCookie(cookieA);
        const req = new NextRequest(`http://localhost:3000/api/results/${attemptId}`);
        const res = await OrganizerResult(req, { params: Promise.resolve({ attemptId }) });
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.detail.score).toBe(25);
        expect(data.detail.candidate.name).toBe("E2E Candidate");
        // Ensure no raw submittedCode or isCorrect booleans leaked in the generic result fetch (these are in detailed evaluation views usually)
        expect(data.detail.questions[0].answerScore).toBeDefined();
        expect((data.detail.questions[0] as any).isCorrect).toBeUndefined();
    });

    it("O. Cross-organizer access is rejected", async () => {
        setAuthCookie(cookieB);
        const req = new NextRequest(`http://localhost:3000/api/results/${attemptId}`);
        const res = await OrganizerResult(req, { params: Promise.resolve({ attemptId }) });
        expect(res.status).toBe(404); // Organizer B cannot see Organizer A's attempt
    });

    it("P. CLOSED assessment cannot be edited", async () => {
        await prisma.assessment.update({ where: { id: assessmentId }, data: { status: "CLOSED" } });

        setAuthCookie(cookieA);
        const reqAttach = new NextRequest(`http://localhost:3000/api/assessments/${assessmentId}/questions`, {
            method: "POST",
            body: JSON.stringify({ questionIds: [mcqId] })
        });
        const resAttach = await AttachQuestions(reqAttach, { params: Promise.resolve({ id: assessmentId }) });
        expect(resAttach.status).toBe(409); // Conflict, cannot edit closed
    });

    it("R. Runtime settings are actually enforced", async () => {
        // Attempt is submitted. Try to save answer again.
        const candSession = await createCandidateSession(candidateId, attemptId);
        clearMockCookies();
        setMockCookie("candidate_session", candSession);

        const reqA = new NextRequest(`http://localhost:3000/api/attempts/${attemptId}/answers`, {
            method: "POST",
            body: JSON.stringify({ attemptQuestionId: "any", selectedOptionId: "any" })
        });
        const resA = await SaveAnswer(reqA, { params: Promise.resolve({ id: attemptId }) });
        expect(resA.status).toBe(403); // Not in progress
    });
});
