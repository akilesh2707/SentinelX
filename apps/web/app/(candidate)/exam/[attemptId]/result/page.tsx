import { notFound, redirect } from "next/navigation";
import { prisma } from "../../../../../src/lib/prisma";
import { requireCandidateAttempt } from "../../../../../src/lib/auth/candidate-session";
import { ShieldCheck, CheckCircle2, Clock } from "lucide-react";

type ResultPageProps = {
    params: Promise<{
        attemptId: string;
    }>;
};

export default async function ResultPage(props: ResultPageProps) {
    const params = await props.params;
    const attemptId = params.attemptId;

    const authAttempt = await requireCandidateAttempt(attemptId);
    if (!authAttempt) {
        // IDOR prevention: Candidate must be authorized for this specific attempt
        redirect("/login");
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attemptId },
        include: {
            assessment: {
                select: { title: true }
            }
        }
    });

    if (!attempt) {
        return notFound();
    }

    if (attempt.status !== "SUBMITTED" && attempt.status !== "EXPIRED") {
        // Should not view results if still in progress
        redirect(`/exam/${attempt.id}`);
    }

    const score = attempt.score ?? 0;
    const maxScore = attempt.maxScore ?? 0;

    const percentage = maxScore > 0 
        ? Math.round((score / maxScore) * 100) 
        : 0;

    return (
        <div className="min-h-screen bg-[#171a1b] text-[#fbfaf6] flex flex-col">
            <header className="h-16 border-b border-[#303433] bg-[#171a1b]/95 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-500 text-[#171a1b]">
                        <ShieldCheck size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold tracking-tight">{attempt.assessment.title}</span>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl bg-[#fbfaf6] rounded-2xl p-8 shadow-xl text-[#171a1b]">
                    <div className="text-center mb-8">
                        {attempt.status === "EXPIRED" ? (
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                <Clock size={32} className="text-red-600" />
                            </div>
                        ) : (
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle2 size={32} className="text-emerald-600" />
                            </div>
                        )}
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            {attempt.status === "EXPIRED" ? "Time Expired" : "Assessment Submitted"}
                        </h1>
                        <p className="text-[#737777]">
                            {attempt.status === "EXPIRED" 
                                ? "The allocated time for this assessment ran out. Your answers up to that point have been securely recorded." 
                                : "Your answers have been securely recorded. You may now close this window."}
                        </p>
                    </div>

                    <div className="bg-[#171a1b] rounded-xl p-6 w-full text-left space-y-6">
                        <div className="flex justify-between items-center border-b border-[#303433] pb-4">
                            <span className="text-[#a0a19b]">Submission Status</span>
                            <span className="font-semibold text-[#fbfaf6] capitalize">{attempt.status.toLowerCase()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#303433] pb-4">
                            <span className="text-[#a0a19b]">Calculated Score</span>
                            <span className="font-semibold text-emerald-400 text-lg">
                                {score} / {maxScore}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#303433] pb-4">
                            <span className="text-[#a0a19b]">Percentage</span>
                            <span className="font-semibold text-orange-400">
                                {percentage}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#a0a19b]">Submitted On</span>
                            <span className="text-[#fbfaf6]">
                                {attempt.submittedAt 
                                    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(attempt.submittedAt)
                                    : "N/A"
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
