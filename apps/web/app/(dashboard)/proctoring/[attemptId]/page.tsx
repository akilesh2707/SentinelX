"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, AppWindow, VideoOff, WifiOff, RefreshCcw, Maximize, AlertCircle, Camera, ChevronDown, ChevronUp, Trash2, ScanFace, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type ProctoringDetail = {
    attempt: {
        id: string;
        status: string;
        riskScore: number;
        startedAt: string | null;
        expiresAt: string | null;
        submittedAt: string | null;
        candidate: { name: string; email: string };
        assessment: { id: string; title: string };
    };
    incidents: {
        id: string;
        type: string;
        severity: string;
        status: string;
        firstSeen: string;
        lastSeen: string;
        eventCount: number;
        evidence: { id: string; type: string }[];
    }[];
};

export default function ProctoringDetailPage() {
    const params = useParams();
    const attemptId = params.attemptId as string;

    const [data, setData] = useState<ProctoringDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const [expandedIncident, setExpandedIncident] = useState<string | null>(null);

    useEffect(() => {
        async function loadDetail() {
            try {
                const res = await fetch(`/api/proctoring/${attemptId}`);
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.error || "Failed to load attempt details");
                setData({ attempt: json.attempt, incidents: json.incidents });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadDetail();
    }, [attemptId]);

    async function updateStatus(id: string, newStatus: string) {
        try {
            const res = await fetch(`/api/incidents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || "Failed to update");
            
            if (data) {
                setData({
                    ...data,
                    incidents: data.incidents.map(i => i.id === id ? { ...i, status: newStatus } : i)
                });
            }
        } catch (err: any) {
            alert(err.message);
        }
    }

    function toggleIncident(id: string) {
        setExpandedIncident(expandedIncident === id ? null : id);
    }

    if (loading) {
        return <div className="p-8 text-center text-[#737777]">Loading secure profile...</div>;
    }

    if (error || !data) {
        return <div className="p-8 text-center text-red-500">{error || "Attempt not found"}</div>;
    }

    const { attempt, incidents } = data;
    
    const unresolvedCount = incidents.filter(i => i.status === "UNRESOLVED").length;

    const getRiskColor = (score: number) => {
        if (score >= 80) return "text-red-600 bg-red-50 border-red-200";
        if (score >= 40) return "text-amber-600 bg-amber-50 border-amber-200";
        if (score > 0) return "text-blue-600 bg-blue-50 border-blue-200";
        return "text-gray-600 bg-gray-50 border-gray-200";
    };

    return (
        <div className="p-8 max-w-7xl mx-auto pb-20 space-y-8">
            <Link href="/proctoring" className="inline-flex items-center gap-2 text-sm text-[#737777] hover:text-[#171a1b] transition-colors">
                <ChevronLeft size={16} /> Back to Monitored Attempts
            </Link>

            {/* Header & Risk Summary */}
            <div className="bg-white p-6 rounded-2xl border border-[#dedbd2] shadow-sm flex flex-col md:flex-row justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#171a1b] mb-1">{attempt.candidate.name}</h1>
                    <div className="text-sm text-[#737777] mb-4">{attempt.candidate.email}</div>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="bg-[#fbfaf6] px-3 py-1.5 rounded-lg border border-[#dedbd2]">
                            <span className="text-[#737777] mr-2">Assessment:</span>
                            <span className="font-semibold text-[#171a1b]">{attempt.assessment.title}</span>
                        </div>
                        <div className="bg-[#fbfaf6] px-3 py-1.5 rounded-lg border border-[#dedbd2]">
                            <span className="text-[#737777] mr-2">Status:</span>
                            <span className="font-semibold text-[#171a1b]">{attempt.status.replace("_", " ")}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center bg-[#fbfaf6] p-4 rounded-xl border border-[#dedbd2] min-w-[120px]">
                        <div className="text-sm text-[#737777] mb-1 text-center">Unresolved<br/>Incidents</div>
                        <div className="text-2xl font-bold text-[#171a1b]">{unresolvedCount}</div>
                    </div>

                    <div className={`flex flex-col items-center justify-center p-4 rounded-xl border min-w-[120px] ${getRiskColor(attempt.riskScore)}`}>
                        <div className="text-sm font-medium mb-1 text-center opacity-80">Aggregated<br/>Security Signal Score</div>
                        <div className="text-3xl font-black">{attempt.riskScore} <span className="text-sm font-normal opacity-70">/ 100</span></div>
                    </div>
                </div>
            </div>

            {/* Incident Timeline */}
            <div>
                <h2 className="text-xl font-bold text-[#171a1b] mb-4">Incident Timeline</h2>
                
                {incidents.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-2xl border border-[#dedbd2]">
                        <ShieldAlert size={48} className="mx-auto text-emerald-500 mb-4" />
                        <h3 className="text-lg font-bold text-[#171a1b]">Clean Record</h3>
                        <p className="text-[#737777]">No security incidents have been recorded for this attempt.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#dedbd2] bg-[#fbfaf6]">
                                        <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider w-8"></th>
                                        <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider">Time</th>
                                        <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider">Signal Type</th>
                                        <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider">Severity</th>
                                        <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider">Count</th>
                                        <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incidents.map((incident) => {
                                        const isAi = incident.type.startsWith("AI_");
                                        const signalTypeStr = isAi 
                                            ? "AI / CV — " + incident.type.replace("AI_", "").replace(/_/g, " ")
                                            : incident.type.replace(/_/g, " ");

                                        return (
                                            <React.Fragment key={incident.id}>
                                                <tr className="border-b border-[#dedbd2] last:border-0 hover:bg-[#fbfaf6]">
                                                    <td className="p-4">
                                                        {incident.evidence.length > 0 && (
                                                            <button onClick={() => toggleIncident(incident.id)} className="p-1 hover:bg-gray-200 rounded">
                                                                {expandedIncident === incident.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-sm text-[#303433]">
                                                        {new Date(incident.firstSeen).toLocaleTimeString()}
                                                        {incident.firstSeen !== incident.lastSeen && (
                                                            <span className="text-xs text-[#737777] block">→ {new Date(incident.lastSeen).toLocaleTimeString()}</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            {incident.type === "WINDOW_BLUR" || incident.type === "TAB_SWITCH" ? <AppWindow size={14} className="text-[#737777]" /> :
                                                             incident.type === "CAMERA_UNAVAILABLE" || incident.type === "MICROPHONE_UNAVAILABLE" ? <VideoOff size={14} className="text-[#737777]" /> :
                                                             incident.type === "NETWORK_DISCONNECT" ? <WifiOff size={14} className="text-[#737777]" /> :
                                                             incident.type === "PAGE_RELOAD" ? <RefreshCcw size={14} className="text-[#737777]" /> :
                                                             incident.type === "FULLSCREEN_EXIT" ? <Maximize size={14} className="text-[#737777]" /> :
                                                             isAi ? <ScanFace size={14} className="text-purple-600" /> :
                                                             <AlertCircle size={14} className="text-[#737777]" />}
                                                            <span className="text-sm font-medium">{signalTypeStr}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                            incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                            incident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {incident.severity}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-[#737777]">
                                                        Detected {incident.eventCount} time{incident.eventCount !== 1 ? 's' : ''}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                                            incident.status === 'UNRESOLVED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            incident.status === 'REVIEWED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-gray-50 text-gray-500 border-gray-200'
                                                        }`}>
                                                            {incident.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {incident.status === "UNRESOLVED" ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => updateStatus(incident.id, "REVIEWED")} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">Mark Reviewed</button>
                                                                <button onClick={() => updateStatus(incident.id, "DISMISSED")} className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">Dismiss</button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-[#737777] italic px-2">Completed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                
                                                {/* Evidence Dropdown */}
                                                {expandedIncident === incident.id && incident.evidence.length > 0 && (
                                                    <tr className="bg-[#fbfaf6] border-b border-[#dedbd2]">
                                                        <td colSpan={7} className="p-6">
                                                            <h4 className="text-sm font-bold text-[#171a1b] mb-4 flex items-center gap-2">
                                                                <Camera size={16} /> Evidence Snapshots
                                                            </h4>
                                                            <div className="flex flex-wrap gap-4">
                                                                {incident.evidence.map((ev) => (
                                                                    <div key={ev.id} className="bg-white p-2 rounded-lg border border-[#dedbd2] shadow-sm flex flex-col gap-2">
                                                                        <div className="w-64 h-48 bg-black rounded overflow-hidden relative">
                                                                            <img 
                                                                                src={`/api/evidence/${ev.id}`} 
                                                                                alt="Evidence Snapshot" 
                                                                                className="w-full h-full object-contain"
                                                                            />
                                                                        </div>
                                                                        <div className="text-xs text-[#737777] font-mono px-1">
                                                                            {ev.type.replace(/_/g, " ")}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
