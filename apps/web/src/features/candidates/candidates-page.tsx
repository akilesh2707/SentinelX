"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, ChevronRight, ChevronLeft, User, BookOpen, Clock, Users, XCircle } from "lucide-react";

type CandidateSummary = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
    totalAttempts: number;
    submittedAttempts: number;
    latestAttemptAt: string | null;
    latestAssessment: string | null;
    latestScore: number | null;
    latestMaxScore: number | null;
    latestStatus: string | null;
};

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter]);

    useEffect(() => {
        fetchCandidates();
    }, [search, statusFilter, page]);

    const fetchCandidates = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter) params.append("status", statusFilter);
            params.append("page", page.toString());
            params.append("pageSize", "50");

            const res = await fetch(`/api/candidates?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setCandidates(data.candidates);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotalRecords(data.pagination?.totalRecords || 0);
            } else {
                setError(data.error || "Failed to load candidates");
            }
        } catch (err) {
            setError("Network error loading candidates");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string | null) => {
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
                    <h1 className="text-3xl font-bold text-[#171a1b] mb-2 flex items-center gap-3">
                        <Users className="text-[#303433]" /> Candidates
                    </h1>
                    <p className="text-[#737777]">Manage candidates and assessment participation.</p>
                </div>
                <div className="bg-[#fbfaf6] border border-[#dedbd2] px-4 py-2 rounded-xl text-[#303433] font-medium shadow-sm flex items-center gap-2">
                    <User size={18} className="text-[#737777]" />
                    {totalRecords} Total Candidates
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
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Attempts</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Latest Assessment</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Latest Score</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Last Activity</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dedbd2]">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-[#737777]">
                                        <div className="animate-pulse flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#303433] border-t-transparent rounded-full animate-spin" />
                                            Loading securely...
                                        </div>
                                    </td>
                                </tr>
                            ) : candidates.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-[#737777]">
                                        No candidates found matching your criteria.
                                    </td>
                                </tr>
                            ) : candidates.map((candidate) => (
                                <tr key={candidate.id} className="hover:bg-[#fbfaf6] transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#171a1b] text-white flex items-center justify-center font-bold text-xs">
                                                {candidate.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-[#171a1b]">{candidate.name}</div>
                                                <div className="text-xs text-[#737777]">{candidate.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col text-sm">
                                            <span className="font-bold text-[#171a1b]">{candidate.totalAttempts}</span>
                                            <span className="text-xs text-emerald-600 font-medium">{candidate.submittedAttempts} Submitted</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {candidate.latestAssessment ? (
                                            <div className="flex items-center gap-2 text-sm text-[#303433] font-medium">
                                                <BookOpen size={16} className="text-[#737777]" />
                                                {candidate.latestAssessment}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-[#a0a19b] italic">None</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {candidate.latestScore !== null ? (
                                            <div className="flex items-center gap-1 font-bold text-[#171a1b]">
                                                {candidate.latestScore} / {candidate.latestMaxScore}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-[#a0a19b] italic">Pending</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {candidate.latestStatus ? (
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.latestStatus)}`}>
                                                {candidate.latestStatus.replace("_", " ")}
                                            </span>
                                        ) : (
                                            <span className="text-[#a0a19b]">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-[#737777]">
                                        {candidate.latestAttemptAt ? new Date(candidate.latestAttemptAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/candidates/${candidate.id}`}
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

                {totalPages > 1 && (
                    <div className="p-4 border-t border-[#dedbd2] bg-[#fbfaf6] flex items-center justify-between">
                        <div className="text-sm text-[#737777]">
                            Showing page {page} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded bg-white border border-[#dedbd2] text-[#303433] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded bg-white border border-[#dedbd2] text-[#303433] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
