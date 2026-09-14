"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Activity,
    BookOpen,
    Users,
    Target,
    ChevronRight,
    Plus,
    FolderPlus,
    BarChart3,
    Clock,
    CheckCircle2
} from "lucide-react";

type DashboardMetrics = {
    totalAssessments: number;
    publishedAssessments: number;
    totalCandidates: number;
    totalAttempts: number;
    submittedAttempts: number;
    inProgressAttempts: number;
    averageScorePercentage: number | null;
};

type RecentAssessment = {
    id: string;
    title: string;
    status: string;
    type: string;
    duration: number;
    questionCount: number;
    attemptCount: number;
};

type RecentActivity = {
    id: string;
    status: string;
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    timestamp: string;
    candidateName: string;
    candidateEmail: string;
    assessmentTitle: string;
};

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [recentAssessments, setRecentAssessments] = useState<RecentAssessment[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch("/api/dashboard");
                const data = await res.json();

                if (data.success) {
                    setMetrics(data.metrics);
                    setRecentAssessments(data.recentAssessments);
                    setRecentActivity(data.recentActivity);
                } else {
                    setError(data.error || "Failed to load dashboard data");
                }
            } catch (err) {
                setError("Network error loading dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-8 h-8 border-2 border-[#303433] border-t-transparent rounded-full animate-spin" />
                <div className="text-[#737777] font-medium">Loading command center...</div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 shadow-sm flex items-center gap-3">
                    <Activity size={24} />
                    <span className="font-medium text-lg">{error || "Failed to load dashboard"}</span>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PUBLISHED": return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
            case "DRAFT": return "text-amber-600 bg-amber-500/10 border-amber-500/20";
            case "SUBMITTED": return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
            case "IN_PROGRESS": return "text-amber-600 bg-amber-500/10 border-amber-500/20";
            case "EXPIRED": return "text-red-600 bg-red-500/10 border-red-500/20";
            default: return "text-gray-600 bg-gray-500/10 border-gray-500/20";
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#171a1b] mb-2">Command Center</h1>
                    <p className="text-[#737777]">Overview of SentinelX system activity and performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/assessments/new" className="inline-flex items-center gap-2 bg-[#171a1b] hover:bg-[#303433] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        <Plus size={16} /> New Assessment
                    </Link>
                    <Link href="/questions" className="inline-flex items-center gap-2 bg-white hover:bg-[#fbfaf6] text-[#303433] border border-[#dedbd2] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        <FolderPlus size={16} /> Question Bank
                    </Link>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Assessments */}
                <div className="bg-white p-6 rounded-2xl border border-[#dedbd2] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BookOpen size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-[#737777]">
                        <BookOpen size={20} className="text-[#171a1b]" />
                        <span className="font-semibold text-sm tracking-wider uppercase">Assessments</span>
                    </div>
                    <div className="text-4xl font-black text-[#171a1b] mb-2">{metrics.totalAssessments}</div>
                    <div className="text-sm font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-flex">
                        {metrics.publishedAssessments} Published
                    </div>
                </div>

                {/* Candidates */}
                <div className="bg-white p-6 rounded-2xl border border-[#dedbd2] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-[#737777]">
                        <Users size={20} className="text-[#171a1b]" />
                        <span className="font-semibold text-sm tracking-wider uppercase">Candidates</span>
                    </div>
                    <div className="text-4xl font-black text-[#171a1b] mb-2">{metrics.totalCandidates}</div>
                    <div className="text-sm font-medium text-[#737777]">
                        Registered externally
                    </div>
                </div>

                {/* Attempts */}
                <div className="bg-white p-6 rounded-2xl border border-[#dedbd2] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-[#737777]">
                        <Activity size={20} className="text-[#171a1b]" />
                        <span className="font-semibold text-sm tracking-wider uppercase">Attempts</span>
                    </div>
                    <div className="text-4xl font-black text-[#171a1b] mb-2">{metrics.totalAttempts}</div>
                    <div className="flex gap-2">
                        <span className="text-sm font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {metrics.submittedAttempts} Done
                        </span>
                        <span className="text-sm font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            {metrics.inProgressAttempts} Active
                        </span>
                    </div>
                </div>

                {/* Average Score */}
                <div className="bg-[#171a1b] p-6 rounded-2xl shadow-sm relative overflow-hidden text-white group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-400">
                        <Target size={64} />
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-[#a0a19b]">
                        <Target size={20} className="text-emerald-400" />
                        <span className="font-semibold text-sm tracking-wider uppercase">Avg Score</span>
                    </div>
                    <div className="text-4xl font-black mb-2 text-emerald-400">
                        {metrics.averageScorePercentage !== null ? `${metrics.averageScorePercentage}%` : "—"}
                    </div>
                    <div className="text-sm font-medium text-[#737777]">
                        Evaluated submissions
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Assessments (Occupies 2 columns on large screens) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#171a1b] flex items-center gap-2">
                            <BookOpen size={20} className="text-[#737777]" /> Active Assessments
                        </h2>
                        <Link href="/assessments" className="text-sm font-medium text-[#303433] hover:text-emerald-600 transition-colors flex items-center gap-1">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                        {recentAssessments.length === 0 ? (
                            <div className="p-8 text-center text-[#737777] border-b border-[#dedbd2]">
                                No assessments created yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-[#dedbd2] bg-[#fbfaf6]">
                                            <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Assessment</th>
                                            <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Status</th>
                                            <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Details</th>
                                            <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider text-right">Attempts</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#dedbd2]">
                                        {recentAssessments.map((assessment) => (
                                            <tr key={assessment.id} className="hover:bg-[#fbfaf6] transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-[#171a1b] mb-1">{assessment.title}</div>
                                                    <div className="text-xs font-medium text-[#737777]">{assessment.type}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(assessment.status)}`}>
                                                        {assessment.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1 text-xs text-[#737777]">
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {assessment.duration}m</span>
                                                        <span className="flex items-center gap-1"><BookOpen size={12} /> {assessment.questionCount} Qs</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-bold text-[#171a1b]">{assessment.attemptCount}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#171a1b] flex items-center gap-2">
                            <Activity size={20} className="text-[#737777]" /> Activity Feed
                        </h2>
                        <Link href="/results" className="text-sm font-medium text-[#303433] hover:text-emerald-600 transition-colors flex items-center gap-1">
                            Results <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden divide-y divide-[#dedbd2]">
                        {recentActivity.length === 0 ? (
                            <div className="p-8 text-center text-[#737777]">
                                No candidate activity yet.
                            </div>
                        ) : (
                            recentActivity.map((act) => (
                                <div key={act.id} className="p-4 hover:bg-[#fbfaf6] transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-[#171a1b] truncate pr-4">{act.candidateName}</div>
                                        <div className="text-xs text-[#737777] whitespace-nowrap">
                                            {new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="text-sm text-[#303433] mb-2 truncate">{act.assessmentTitle}</div>
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${getStatusColor(act.status)}`}>
                                            {act.status.replace("_", " ")}
                                        </span>
                                        {act.percentage !== null && (
                                            <span className={`text-xs font-bold ${act.percentage >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {act.percentage}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
