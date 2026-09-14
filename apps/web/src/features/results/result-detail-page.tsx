"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User, BookOpen, Clock, Calendar, CheckCircle, XCircle, Code, ListTodo, ChevronRight } from "lucide-react";

type AttemptDetail = {
    attemptId: string;
    candidate: { id: string; name: string; email: string };
    assessment: { id: string; title: string };
    status: string;
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    startedAt: string | null;
    submittedAt: string | null;
    questions: {
        id: string;
        order: number;
        marks: number;
        title: string;
        type: string;
        answerStatus: string;
        answerScore: number | null;
        answeredAt: string | null;
    }[];
};

export default function ResultDetailPage() {
    const params = useParams();
    const attemptId = params.attemptId as string;

    const [detail, setDetail] = useState<AttemptDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDetail();
    }, [attemptId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/results/${attemptId}`);
            const data = await res.json();

            if (data.success) {
                setDetail(data.detail);
            } else {
                setError(data.error || "Failed to load attempt details");
            }
        } catch (err) {
            setError("Network error loading attempt details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-8 h-8 border-2 border-[#303433] border-t-transparent rounded-full animate-spin" />
                <div className="text-[#737777]">Loading secure attempt data...</div>
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <Link href="/results" className="inline-flex items-center gap-2 text-sm text-[#737777] hover:text-[#303433] mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Results
                </Link>
                <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3 shadow-sm">
                    <XCircle size={24} />
                    <span className="font-medium text-lg">{error || "Detail not found"}</span>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SUBMITTED": return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
            case "IN_PROGRESS": return "text-amber-600 bg-amber-500/10 border-amber-500/20";
            case "NOT_STARTED": return "text-gray-600 bg-gray-500/10 border-gray-500/20";
            case "EXPIRED": return "text-red-600 bg-red-500/10 border-red-500/20";
            default: return "text-gray-600 bg-gray-500/10 border-gray-500/20";
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
            <Link href="/results" className="inline-flex items-center gap-2 text-sm text-[#737777] hover:text-[#303433] transition-colors font-medium">
                <ArrowLeft size={16} /> Back to Results
            </Link>

            <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                <div className="bg-[#171a1b] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-emerald-400 mb-2 font-mono text-sm">
                                <BookOpen size={16} /> {detail.assessment.title}
                            </div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                {detail.candidate.name}
                            </h1>
                            <div className="text-[#a0a19b] flex items-center gap-2">
                                <User size={16} /> {detail.candidate.email}
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <div className={`px-4 py-1.5 rounded-full text-sm font-bold border mb-4 ${getStatusColor(detail.status)}`}>
                                {detail.status.replace("_", " ")}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tight">
                                    {detail.score !== null ? detail.score : "-"}
                                </span>
                                <span className="text-[#a0a19b] font-medium">/ {detail.maxScore || "-"} Marks</span>
                            </div>
                            {detail.percentage !== null && (
                                <div className="text-emerald-400 font-bold mt-1">
                                    {detail.percentage}%
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 p-6 gap-6 bg-[#fbfaf6] border-b border-[#dedbd2]">
                    <div className="flex items-center gap-3 text-[#303433]">
                        <div className="w-10 h-10 rounded-full bg-white border border-[#dedbd2] flex items-center justify-center shadow-sm">
                            <Clock size={18} className="text-[#737777]" />
                        </div>
                        <div>
                            <div className="text-xs text-[#737777] font-semibold uppercase tracking-wider mb-0.5">Started At</div>
                            <div className="font-medium text-sm">
                                {detail.startedAt ? new Date(detail.startedAt).toLocaleString() : "Not started"}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[#303433]">
                        <div className="w-10 h-10 rounded-full bg-white border border-[#dedbd2] flex items-center justify-center shadow-sm">
                            <Calendar size={18} className="text-[#737777]" />
                        </div>
                        <div>
                            <div className="text-xs text-[#737777] font-semibold uppercase tracking-wider mb-0.5">Submitted At</div>
                            <div className="font-medium text-sm">
                                {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : "Not submitted"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-[#171a1b] mb-4 flex items-center gap-2">
                    <ListTodo size={20} className="text-[#737777]" /> Question Performance
                </h2>

                <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden divide-y divide-[#dedbd2]">
                    {detail.questions.map((q, index) => (
                        <div key={q.id} className="p-6 hover:bg-[#fbfaf6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#171a1b] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-1">
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="font-bold text-[#171a1b] text-lg mb-1">{q.title}</div>
                                    <div className="flex items-center gap-3 text-xs font-medium text-[#737777]">
                                        <span className="flex items-center gap-1 bg-white border border-[#dedbd2] px-2 py-0.5 rounded shadow-sm">
                                            {q.type === "CODING" ? <Code size={12} /> : <ListTodo size={12} />}
                                            {q.type}
                                        </span>
                                        <span>•</span>
                                        <span>{q.marks} Marks Possible</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-2">
                                {q.answerScore === null ? (
                                    <div className="px-3 py-1 rounded bg-gray-100 text-gray-600 text-sm font-semibold border border-gray-200 flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {q.answerStatus === "UNANSWERED" ? "Unanswered" : "Pending Evaluation"}
                                    </div>
                                ) : (
                                    <div className={`px-4 py-2 rounded-lg border text-sm font-bold flex items-center gap-2 shadow-sm ${
                                        q.answerScore === q.marks
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : q.answerScore > 0
                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : "bg-red-50 text-red-700 border-red-200"
                                    }`}>
                                        {q.answerScore === q.marks ? <CheckCircle size={16} /> : q.answerScore > 0 ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                        Score: {q.answerScore} / {q.marks}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {detail.questions.length === 0 && (
                        <div className="p-8 text-center text-[#737777]">
                            No questions found for this assessment.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
