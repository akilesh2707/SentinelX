"use client";

import { useState, useEffect } from "react";
import { BarChart3, Activity, PieChart, Users, CheckCircle, Percent, AlertCircle } from "lucide-react";

type OverallMetrics = {
    totalAttempts: number;
    submittedAttempts: number;
    inProgressAttempts: number;
    expiredAttempts: number;
    abandonedAttempts: number;
    completionRate: number;
    averageScorePercentage: number;
};

type AssessmentBreakdown = {
    assessmentId: string;
    title: string;
    totalAttempts: number;
    submittedAttempts: number;
    completionRate: number;
    averageScorePercentage: number;
};

type ScoreDistribution = {
    "0-20": number;
    "21-40": number;
    "41-60": number;
    "61-80": number;
    "81-100": number;
};

type ReportsData = {
    success: boolean;
    overall: OverallMetrics;
    scoreDistribution: ScoreDistribution;
    assessmentBreakdown: AssessmentBreakdown[];
    error?: string;
};

export default function ReportsPage() {
    const [data, setData] = useState<ReportsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // For the filter dropdown, we'll extract available assessments from the breakdown
    // If the user selects one, we refetch data scoped to that assessment
    const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
    const [availableAssessments, setAvailableAssessments] = useState<{id: string, title: string}[]>([]);

    useEffect(() => {
        fetchReports(selectedAssessmentId);
    }, [selectedAssessmentId]);

    const fetchReports = async (assessmentId: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = assessmentId ? `/api/reports?assessmentId=${assessmentId}` : "/api/reports";
            const res = await fetch(url);
            const json = await res.json();

            if (json.success) {
                setData(json);
                // Populate dropdown only on initial load (when seeing all assessments)
                if (!assessmentId && json.assessmentBreakdown) {
                    setAvailableAssessments(json.assessmentBreakdown.map((b: any) => ({ id: b.assessmentId, title: b.title })));
                }
            } else {
                setError(json.error || "Failed to load reports");
            }
        } catch (err) {
            setError("Network error fetching reports");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-8 h-8 border-2 border-[#303433] border-t-transparent rounded-full animate-spin" />
                <div className="text-[#737777]">Loading analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3">
                    <AlertCircle size={24} />
                    <span className="font-medium text-lg">{error}</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { overall, scoreDistribution, assessmentBreakdown } = data;

    // Chart logic
    const maxDistribution = Math.max(...Object.values(scoreDistribution), 1); // Avoid div by 0 for height scaling
    const distributionKeys = ["0-20", "21-40", "41-60", "61-80", "81-100"] as const;

    const totalStatusCount = overall.totalAttempts || 1;
    const getStatusWidth = (count: number) => `${(count / totalStatusCount) * 100}%`;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#171a1b] mb-2 flex items-center gap-3">
                        <BarChart3 className="text-[#303433]" /> Reports
                    </h1>
                    <p className="text-[#737777]">Assessment performance and platform analytics.</p>
                </div>

                <div className="w-full sm:w-64">
                    <select
                        value={selectedAssessmentId}
                        onChange={(e) => setSelectedAssessmentId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-[#dedbd2] rounded-xl text-sm font-medium text-[#171a1b] focus:outline-none focus:ring-2 focus:ring-[#303433]/20 focus:border-[#303433] transition-all"
                    >
                        <option value="">All Assessments</option>
                        {availableAssessments.map(a => (
                            <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* TOP METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#dedbd2] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-[#dedbd2] group-hover:text-[#303433]/10 transition-colors">
                        <Users size={100} />
                    </div>
                    <div className="relative z-10 text-[#737777] font-semibold text-sm mb-4 uppercase tracking-wider">Total Attempts</div>
                    <div className="relative z-10 text-4xl font-bold text-[#171a1b]">{overall.totalAttempts}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#dedbd2] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-[#dedbd2] group-hover:text-[#303433]/10 transition-colors">
                        <CheckCircle size={100} />
                    </div>
                    <div className="relative z-10 text-[#737777] font-semibold text-sm mb-4 uppercase tracking-wider">Submitted</div>
                    <div className="relative z-10 text-4xl font-bold text-[#171a1b]">{overall.submittedAttempts}</div>
                </div>

                <div className="bg-[#171a1b] p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 text-[#a0a19b] font-semibold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={16} /> Completion Rate
                    </div>
                    <div className="relative z-10 text-4xl font-bold text-white flex items-baseline gap-1">
                        {overall.completionRate} <span className="text-xl text-[#737777]">%</span>
                    </div>
                </div>

                <div className="bg-[#fbfaf6] p-6 rounded-2xl border border-[#dedbd2] shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10 text-[#737777] font-semibold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Percent size={16} /> Average Score
                    </div>
                    <div className="relative z-10 text-4xl font-bold text-[#171a1b] flex items-baseline gap-1">
                        {overall.averageScorePercentage} <span className="text-xl text-[#737777]">%</span>
                    </div>
                </div>
            </div>

            {/* CHARTS / VISUALIZATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Score Distribution */}
                <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <BarChart3 className="text-[#303433]" size={20} />
                        <h2 className="text-lg font-bold text-[#171a1b]">Score Distribution</h2>
                    </div>

                    {overall.totalAttempts === 0 ? (
                        <div className="h-48 flex items-center justify-center text-[#737777] text-sm">No data available</div>
                    ) : (
                        <div className="h-48 flex items-end justify-between gap-2 px-2 mt-auto">
                            {distributionKeys.map((key) => {
                                const count = scoreDistribution[key];
                                const height = count === 0 ? "5%" : `${(count / maxDistribution) * 100}%`;

                                return (
                                    <div key={key} className="flex flex-col items-center flex-1 gap-2 group">
                                        <div className="w-full relative h-full flex items-end justify-center">
                                            <div
                                                style={{ height }}
                                                className="w-full max-w-[40px] bg-[#303433] rounded-t-sm group-hover:bg-emerald-600 transition-all relative flex flex-col justify-start items-center"
                                            >
                                                {count > 0 && (
                                                    <span className="text-[10px] font-bold text-white mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-[10px] sm:text-xs font-semibold text-[#737777] truncate w-full text-center">{key}%</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Status Breakdown */}
                <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-8">
                        <PieChart className="text-[#303433]" size={20} />
                        <h2 className="text-lg font-bold text-[#171a1b]">Attempt Status Breakdown</h2>
                    </div>

                    {overall.totalAttempts === 0 ? (
                        <div className="h-48 flex items-center justify-center text-[#737777] text-sm mt-auto">No data available</div>
                    ) : (
                        <div className="flex flex-col gap-6 justify-center flex-1">
                            {/* Stacked Bar */}
                            <div className="w-full h-8 flex rounded-lg overflow-hidden shadow-sm">
                                {overall.submittedAttempts > 0 && <div style={{ width: getStatusWidth(overall.submittedAttempts) }} className="bg-emerald-500 h-full border-r border-white/20" title="Submitted" />}
                                {overall.inProgressAttempts > 0 && <div style={{ width: getStatusWidth(overall.inProgressAttempts) }} className="bg-amber-400 h-full border-r border-white/20" title="In Progress" />}
                                {overall.abandonedAttempts > 0 && <div style={{ width: getStatusWidth(overall.abandonedAttempts) }} className="bg-[#737777] h-full border-r border-white/20" title="Abandoned" />}
                                {overall.expiredAttempts > 0 && <div style={{ width: getStatusWidth(overall.expiredAttempts) }} className="bg-red-500 h-full" title="Expired" />}
                            </div>

                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-2 rounded bg-[#fbfaf6]">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> <span className="text-sm font-medium text-[#171a1b]">Submitted</span></div>
                                    <span className="text-sm font-bold text-[#303433]">{overall.submittedAttempts}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded bg-[#fbfaf6]">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400" /> <span className="text-sm font-medium text-[#171a1b]">In Progress</span></div>
                                    <span className="text-sm font-bold text-[#303433]">{overall.inProgressAttempts}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded bg-[#fbfaf6]">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#737777]" /> <span className="text-sm font-medium text-[#171a1b]">Abandoned</span></div>
                                    <span className="text-sm font-bold text-[#303433]">{overall.abandonedAttempts}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded bg-[#fbfaf6]">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> <span className="text-sm font-medium text-[#171a1b]">Expired</span></div>
                                    <span className="text-sm font-bold text-[#303433]">{overall.expiredAttempts}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Assessment Performance Table */}
            <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#dedbd2] bg-[#fbfaf6]">
                    <h2 className="text-lg font-bold text-[#171a1b]">Assessment Performance</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#dedbd2] bg-[#fbfaf6]/50">
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Assessment</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider text-right">Attempts</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider text-right">Completed</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider text-right">Completion</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider text-right">Average Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dedbd2]">
                            {assessmentBreakdown.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-[#737777]">
                                        No assessments found.
                                    </td>
                                </tr>
                            ) : (
                                assessmentBreakdown.map((row) => (
                                    <tr key={row.assessmentId} className="hover:bg-[#fbfaf6] transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-[#171a1b] text-base">{row.title}</div>
                                            <div className="text-xs text-[#737777] font-mono mt-0.5">{row.assessmentId}</div>
                                        </td>
                                        <td className="p-4 text-right font-medium text-[#303433]">{row.totalAttempts}</td>
                                        <td className="p-4 text-right font-medium text-[#303433]">{row.submittedAttempts}</td>
                                        <td className="p-4 text-right">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-[#171a1b] text-white">
                                                {row.completionRate.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="inline-flex px-2.5 py-1 rounded text-xs font-bold bg-[#fbfaf6] border border-[#dedbd2] text-[#303433]">
                                                {row.averageScorePercentage.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
