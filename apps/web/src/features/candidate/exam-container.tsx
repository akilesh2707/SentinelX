"use client";

import { useState } from "react";
import { ShieldCheck, Clock, FileText, Loader2, AlertCircle } from "lucide-react";
import { ExamInterface } from "./exam-interface";
import { useRouter } from "next/navigation";

type ExamContainerProps = {
    initialAttempt: {
        id: string;
        status: string;
        startedAt: Date | null;
        expiresAt: Date | null;
        candidate: { name: string; email: string };
        assessment: { title: string; duration: number; totalMarks: number };
        _count: { questions: number };
    };
};

export function ExamContainer({ initialAttempt }: ExamContainerProps) {
    const router = useRouter();
    const [attempt, setAttempt] = useState(initialAttempt);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/attempts/${attempt.id}/start`, {
                method: "POST"
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to start assessment");
            }

            if (data.success && data.attempt) {
                // Update local state with the new IN_PROGRESS attempt
                setAttempt({
                    ...attempt,
                    status: data.attempt.status,
                    startedAt: new Date(data.attempt.startedAt),
                    expiresAt: new Date(data.attempt.expiresAt),
                });

                // Refresh the server route to ensure server state is sync'd
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (attempt.status === "IN_PROGRESS") {
        return <ExamInterface attempt={{
            id: attempt.id,
            status: attempt.status,
            startedAt: attempt.startedAt ? attempt.startedAt.toISOString() : null,
            expiresAt: attempt.expiresAt ? attempt.expiresAt.toISOString() : null,
        }} />;
    }

    if (attempt.status !== "NOT_STARTED") {
        // Locked / Completed states (SUBMITTED, EXPIRED, ABANDONED)
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-[#171a1b]">
                <div className="w-full max-w-lg bg-[#fbfaf6] rounded-2xl p-8 shadow-xl text-center border border-[#dedbd2]">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                        <ShieldCheck size={32} className="text-[#555955]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#171a1b] mb-2">Assessment Locked</h1>
                    <p className="text-[#737777] mb-6">
                        This attempt cannot be started because it is currently in <strong className="text-orange-600">{attempt.status.replace("_", " ")}</strong> state.
                    </p>
                </div>
            </div>
        );
    }

    // NOT_STARTED state (Ready to begin)
    return (
        <div className="flex-1 flex items-center justify-center p-6 bg-[#171a1b]">
            <div className="w-full max-w-2xl bg-[#fbfaf6] rounded-2xl p-8 shadow-xl text-[#171a1b]">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight mb-2">Ready to Begin</h1>
                    <p className="text-[#737777]">Your identity and assessment context have been verified.</p>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-800 border border-red-100">
                        <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="rounded-xl border border-[#dedbd2] p-4 bg-white text-center">
                        <Clock size={20} className="mx-auto mb-2 text-[#555955]" />
                        <div className="text-sm text-[#737777]">Duration</div>
                        <div className="font-semibold text-lg">{attempt.assessment.duration} min</div>
                    </div>
                    <div className="rounded-xl border border-[#dedbd2] p-4 bg-white text-center">
                        <FileText size={20} className="mx-auto mb-2 text-[#555955]" />
                        <div className="text-sm text-[#737777]">Questions</div>
                        <div className="font-semibold text-lg">{attempt._count.questions}</div>
                    </div>
                    <div className="rounded-xl border border-[#dedbd2] p-4 bg-white text-center">
                        <ShieldCheck size={20} className="mx-auto mb-2 text-[#555955]" />
                        <div className="text-sm text-[#737777]">Status</div>
                        <div className="font-semibold text-lg capitalize">{attempt.status.replace("_", " ").toLowerCase()}</div>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="bg-orange-500 text-[#171a1b] font-semibold px-8 py-3 rounded-lg hover:bg-orange-400 transition-colors inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <><Loader2 size={18} className="animate-spin" /> Starting...</> : "Start Assessment"}
                    </button>
                    <p className="mt-3 text-xs text-[#a0a19b]">The timer will begin immediately when you click start.</p>
                </div>
            </div>
        </div>
    );
}
