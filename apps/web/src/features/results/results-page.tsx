"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, ChevronRight, BookOpen, CheckCircle2, XCircle, ChevronLeft, BarChart3, Users, Clock, AlertTriangle } from "lucide-react";

type AttemptResult = {
    attemptId: string;
    candidate: { id: string; name: string; email: string };
    assessmentId: string;
    assessmentTitle: string;
    status: string;
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    startedAt: string | null;
    submittedAt: string | null;
};

type AssessmentSummary = {
    totalAttempts: number;
    submitted: number;
    expired: number;
    inProgress: number;
    notStarted: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
};

export default function ResultsPage() {
    const [results, setResults] = useState<AttemptResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    
    // Assessment Filter & Summary
    const [assessments, setAssessments] = useState<{id: string; title: string}[]>([]);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
    const [summary, setSummary] = useState<AssessmentSummary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAssessments();
    }, []);

    useEffect(() => {
        fetchResults();
    }, [search, statusFilter, selectedAssessmentId, page]);

    useEffect(() => {
        if (selectedAssessmentId) {
            fetchSummary(selectedAssessmentId);
        } else {
            setSummary(null);
        }
    }, [selectedAssessmentId]);

    const fetchAssessments = async () => {
        try {
            const res = await fetch("/api/assessments");
            const data = await res.json();
            if (data.success) {
                setAssessments(data.assessments);
            }
        } catch (err) {
            console.error("Failed to load assessments", err);
        }
    };

    const fetchSummary = async (id: string) => {
        setLoadingSummary(true);
        try {
            const res = await fetch(`/api/assessments/${id}/summary`);
            const data = await res.json();
            if (data.success) {
                setSummary(data.summary);
            } else {
                setSummary(null);
            }
        } catch (err) {
            console.error("Failed to load summary", err);
            setSummary(null);
        } finally {
            setLoadingSummary(false);
        }
    };

    const fetchResults = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter) params.append("status", statusFilter);
            if (selectedAssessmentId) params.append("assessmentId", selectedAssessmentId);
            params.append("page", page.toString());
            params.append("limit", "50");

            const res = await fetch(`/api/results?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setResults(data.results);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setTotalRecords(data.pagination.totalRecords);
                }
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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    const handleAssessmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAssessmentId(e.target.value);
        setPage(1);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#171a1b] mb-2">Results</h1>
                    <p className="text-[#737777]">View and analyze candidate performance securely.</p>
                </div>
                <div className="bg-[#fbfaf6] border border-[#dedbd2] px-4 py-2 rounded-xl text-[#303433] font-medium shadow-sm">
                    {totalRecords} Total Records
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
                    <XCircle size={18} /> {error}
                </div>
            )}

            {summary && !loadingSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-[#dedbd2] shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-[#737777] font-medium">Total Attempts</div>
                            <div className="text-2xl font-bold text-[#171a1b]">{summary.totalAttempts}</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-[#dedbd2] shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-[#737777] font-medium">Submitted</div>
                            <div className="text-2xl font-bold text-[#171a1b]">{summary.submitted}</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-[#dedbd2] shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <Clock size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-[#737777] font-medium">In Progress</div>
                            <div className="text-2xl font-bold text-[#171a1b]">{summary.inProgress}</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-[#dedbd2] shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-[#737777] font-medium">Avg Score</div>
                            <div className="text-2xl font-bold text-[#171a1b]">{summary.averageScore !== null ? summary.averageScore : "-"}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#dedbd2] bg-[#fbfaf6] flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737777]" size={18} />
                        <input
                            type="text"
                            placeholder="Search by candidate name or email..."
                            value={search}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#303433]/20 focus:border-[#303433] transition-all"
                        />
                    </div>
                    
                    <div className="relative w-full md:w-64">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737777]" size={18} />
                        <select
                            value={selectedAssessmentId}
                            onChange={handleAssessmentChange}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#303433]/20 focus:border-[#303433] transition-all appearance-none"
                        >
                            <option value="">All Assessments</option>
                            {assessments.map(a => (
                                <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative w-full md:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737777]" size={18} />
                        <select
                            value={statusFilter}
                            onChange={handleStatusChange}
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

                <div className="overflow-x-auto min-h-[300px]">
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
                                    <td colSpan={6} className="p-16 text-center text-[#737777]">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-[#303433] border-t-transparent rounded-full animate-spin" />
                                            <span>Loading securely...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : results.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center text-[#737777]">
                                        No results found matching your criteria.
                                    </td>
                                </tr>
                            ) : results.map((result) => (
                                <tr key={result.attemptId} className="hover:bg-[#fbfaf6] transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#171a1b] text-white flex items-center justify-center font-bold text-xs shrink-0">
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
                                            <BookOpen size={16} className="text-[#737777] shrink-0" />
                                            <span className="truncate max-w-[200px]" title={result.assessmentTitle}>{result.assessmentTitle}</span>
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
                
                {/* Pagination */}
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
