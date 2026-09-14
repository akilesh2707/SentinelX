"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, ChevronRight, User, BookOpen, Clock, CheckCircle2, XCircle } from "lucide-react";

type AttemptResult = {
    attemptId: string;
    candidate: { id: string; name: string; email: string };
    assessment: { id: string; title: string };
    status: string;
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    startedAt: string | null;
    submittedAt: string | null;
};

export default function ResultsPage() {
    const [results, setResults] = useState<AttemptResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchResults();
    }, [search, statusFilter]);

    const fetchResults = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter) params.append("status", statusFilter);

            const res = await fetch(`/api/results?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setResults(data.results);
            } else {
                setError(data.error || "Failed to load results");
            }
        } catch (err) {
            setError("Network error loading results");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SUBMITTED": return "text-emerald-500 bg-emerald-500/10";
            case "IN_PROGRESS": return "text-amber-500 bg-amber-500/10";
            case "NOT_STARTED": return "text-gray-500 bg-gray-500/10";
            case "EXPIRED": return "text-red-500 bg-red-500/10";
            default: return "text-gray-500 bg-gray-500/10";
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#171a1b] mb-2">Results</h1>
                    <p className="text-[#737777]">View and analyze candidate performance securely.</p>
                </div>
                <div className="bg-[#fbfaf6] border border-[#dedbd2] px-4 py-2 rounded-xl text-[#303433] font-medium shadow-sm">
                    {results.length} Total Records
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
                    <XCircle size={18} /> {error}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#dedbd2] bg-[#fbfaf6] flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737777]" size={18} />
                        <input
                            type="text"
                            placeholder="Search by candidate name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#303433]/20 focus:border-[#303433] transition-all"
                        />
                    </div>
                    <div className="relative w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737777]" size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#303433]/20 focus:border-[#303433] transition-all appearance-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="NOT_STARTED">Not Started</option>
                            <option value="EXPIRED">Expired</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#dedbd2] bg-[#fbfaf6]/50">
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Candidate</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Assessment</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Score</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Submitted</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dedbd2]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-[#737777]">
                                        <div className="animate-pulse flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#303433] border-t-transparent rounded-full animate-spin" />
                                            Loading securely...
                                        </div>
                                    </td>
                                </tr>
                            ) : results.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-[#737777]">
                                        No results found matching your criteria.
                                    </td>
                                </tr>
                            ) : results.map((result) => (
                                <tr key={result.attemptId} className="hover:bg-[#fbfaf6] transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#171a1b] text-white flex items-center justify-center font-bold text-xs">
                                                {result.candidate.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-[#171a1b]">{result.candidate.name}</div>
                                                <div className="text-xs text-[#737777]">{result.candidate.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-[#303433]">
                                            <BookOpen size={16} className="text-[#737777]" />
                                            {result.assessment.title}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                                            {result.status.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {result.score !== null ? (
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#171a1b]">{result.score} / {result.maxScore}</span>
                                                <span className="text-xs text-[#737777]">{result.percentage}%</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-[#a0a19b] italic">Pending</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-[#737777]">
                                        {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/results/${result.attemptId}`}
                                            className="inline-flex items-center gap-1 text-sm font-medium text-[#303433] hover:text-emerald-600 transition-colors"
                                        >
                                            View <ChevronRight size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
