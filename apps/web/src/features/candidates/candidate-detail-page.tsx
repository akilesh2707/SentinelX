"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Calendar, BookOpen, ChevronRight, XCircle, Clock } from "lucide-react";

type AttemptHistory = {
    attemptId: string;
    assessmentTitle: string;
    status: string;
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    startedAt: string | null;
    submittedAt: string | null;
};

type CandidateDetail = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
};

export default function CandidateDetailPage() {
    const params = useParams();
    const candidateId = params.id as string;

    const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
    const [history, setHistory] = useState<AttemptHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDetail();
    }, [candidateId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/candidates/${candidateId}`);
            const data = await res.json();

            if (data.success) {
                setCandidate(data.candidate);
                setHistory(data.history);
            } else {
                setError(data.error || "Failed to load candidate details");
            }
        } catch (err) {
            setError("Network error loading candidate details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-8 h-8 border-2 border-[#303433] border-t-transparent rounded-full animate-spin" />
                <div className="text-[#737777]">Loading secure candidate data...</div>
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <Link href="/candidates" className="inline-flex items-center gap-2 text-sm text-[#737777] hover:text-[#303433] mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Candidates
                </Link>
                <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3 shadow-sm">
                    <XCircle size={24} />
                    <span className="font-medium text-lg">{error || "Candidate not found"}</span>
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
            <Link href="/candidates" className="inline-flex items-center gap-2 text-sm text-[#737777] hover:text-[#303433] transition-colors font-medium">
                <ArrowLeft size={16} /> Back to Candidates
            </Link>

            <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                <div className="bg-[#171a1b] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-white text-[#171a1b] flex items-center justify-center font-black text-4xl shadow-lg">
                            {candidate.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-3">{candidate.name}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-[#a0a19b]">
                                <div className="flex items-center gap-1.5"><Mail size={16} /> {candidate.email}</div>
                                {candidate.phone && (
                                    <div className="flex items-center gap-1.5"><Phone size={16} /> {candidate.phone}</div>
                                )}
                                <div className="flex items-center gap-1.5"><Calendar size={16} /> Joined {new Date(candidate.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-[#171a1b] mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-[#737777]" /> Attempt History
                </h2>

                <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden divide-y divide-[#dedbd2]">
                    {history.length === 0 ? (
                        <div className="p-8 text-center text-[#737777]">
                            This candidate has not participated in any assessments yet.
                        </div>
                    ) : (
                        history.map((attempt) => (
                            <div key={attempt.attemptId} className="p-6 hover:bg-[#fbfaf6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-[#171a1b] text-lg">{attempt.assessmentTitle}</div>
                                    <div className="flex items-center gap-3 text-xs font-medium text-[#737777]">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            Started: {attempt.startedAt ? new Date(attempt.startedAt).toLocaleDateString() : "Never"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:items-end gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(attempt.status)}`}>
                                            {attempt.status.replace("_", " ")}
                                        </span>
                                        {attempt.score !== null && (
                                            <span className="font-black text-[#171a1b]">
                                                {attempt.score} / {attempt.maxScore}
                                                <span className="text-emerald-600 ml-2">({attempt.percentage}%)</span>
                                            </span>
                                        )}
                                    </div>
                                    <Link
                                        href={`/results/${attempt.attemptId}`}
                                        className="inline-flex items-center gap-1 text-sm font-bold text-[#303433] hover:text-emerald-600 transition-colors"
                                    >
                                        View Detail <ChevronRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
