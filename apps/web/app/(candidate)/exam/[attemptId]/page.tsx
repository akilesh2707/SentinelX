import { notFound } from "next/navigation";
import { prisma } from "../../../../src/lib/prisma";
import { ShieldCheck } from "lucide-react";
import { ExamContainer } from "../../../../src/features/candidate/exam-container";

type ExamPageProps = {
    params: Promise<{
        attemptId: string;
    }>;
};

export default async function ExamPage(props: ExamPageProps) {
    const params = await props.params;
    const attemptId = params.attemptId;

    // 1. Secure Fetch: Only pull the data explicitly needed for the candidate.
    // Do NOT include the full Question payloads with correct answers.
    const attempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attemptId },
        select: {
            id: true,
            status: true,
            startedAt: true,
            expiresAt: true,
            candidate: {
                select: {
                    name: true,
                    email: true,
                },
            },
            assessment: {
                select: {
                    title: true,
                    duration: true,
                    totalMarks: true,
                    primaryCamera: true,
                    audioMonitoring: true,
                },
            },
            // Just counting the questions for UI context, not returning the actual content
            _count: {
                select: {
                    questions: true,
                },
            },
        },
    });

    if (!attempt) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-[#171a1b] text-[#fbfaf6] flex flex-col">
            <header className="h-16 border-b border-[#303433] bg-[#171a1b]/95 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-500 text-[#171a1b]">
                        <ShieldCheck size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold tracking-tight">{attempt.assessment.title}</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-[#a0a19b]">
                    <span>{attempt.candidate.name}</span>
                    <div className="h-4 w-px bg-[#303433]" />
                    <span>{attempt.candidate.email}</span>
                </div>
            </header>

            <ExamContainer initialAttempt={attempt} />
        </div>
    );
}
