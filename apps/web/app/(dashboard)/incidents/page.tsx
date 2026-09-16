"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, AppWindow, VideoOff, WifiOff, RefreshCcw, Maximize, AlertCircle, Camera, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Incident = {
    id: string;
    type: string;
    severity: string;
    status: string;
    firstSeen: string;
    lastSeen: string;
    eventCount: number;
    attempt: {
        id: string;
        candidate: { name: string; email: string };
        assessment: { title: string };
    };
};

export default function IncidentsPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
    const [evidenceData, setEvidenceData] = useState<Record<string, any[]>>({});
    const [loadingEvidence, setLoadingEvidence] = useState<Record<string, boolean>>({});

    useEffect(() => {
        async function loadIncidents() {
            try {
                const res = await fetch("/api/incidents");
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
                setIncidents(data.incidents || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadIncidents();
    }, []);

    async function updateStatus(id: string, newStatus: string) {
        try {
            const res = await fetch(`/api/incidents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to update");
            setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function toggleIncident(id: string) {
        if (expandedIncident === id) {
            setExpandedIncident(null);
            return;
        }
        
        setExpandedIncident(id);
        
        if (!evidenceData[id]) {
            setLoadingEvidence(prev => ({ ...prev, [id]: true }));
            try {
                const res = await fetch(`/api/incidents/${id}/evidence`);
                const data = await res.json();
                if (data.success) {
                    setEvidenceData(prev => ({ ...prev, [id]: data.evidence || [] }));
                }
            } catch (err) {
                console.error("Failed to load evidence:", err);
            } finally {
                setLoadingEvidence(prev => ({ ...prev, [id]: false }));
            }
        }
    }

    async function deleteEvidence(incidentId: string, evidenceId: string) {
        if (!confirm("Delete this evidence?")) return;
        try {
            const res = await fetch(`/api/evidence/${evidenceId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setEvidenceData(prev => ({
                    ...prev,
                    [incidentId]: prev[incidentId].filter(e => e.id !== evidenceId)
                }));
            } else {
                alert(data.error || "Failed to delete");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting evidence");
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-[#737777]">Loading incidents...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-[#171a1b]">Security Incidents</h1>
                    <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-widest uppercase">Current</span>
                </div>
                <p className="text-[#737777]">The central organizer workspace for suspicious events detected during assessments.</p>
            </div>

            {incidents.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl border border-[#dedbd2]">
                    <ShieldAlert size={48} className="mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-lg font-bold text-[#171a1b]">No Incidents Detected</h3>
                    <p className="text-[#737777]">All assessments are running securely with no reported issues.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#dedbd2] bg-[#fbfaf6]">
                                    <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider">Candidate & Assessment</th>
                                    <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider">Type</th>
                                    <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider">Severity</th>
                                    <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider">Count / Time</th>
                                    <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-[#737777] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidents.map((incident) => (
                                    <React.Fragment key={incident.id}>
                                        <tr className="border-b border-[#dedbd2] last:border-0 hover:bg-[#fbfaf6]">
                                            <td className="p-4 flex items-center gap-2">
                                                <button onClick={() => toggleIncident(incident.id)} className="p-1 hover:bg-gray-200 rounded">
                                                    {expandedIncident === incident.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                                <div>
                                                    <div className="font-semibold text-[#171a1b]">{incident.attempt.candidate.name}</div>
                                                    <div className="text-xs text-[#737777]">{incident.attempt.assessment.title}</div>
                                                </div>
                                            </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {incident.type === "WINDOW_BLUR" || incident.type === "TAB_SWITCH" ? <AppWindow size={14} className="text-[#737777]" /> :
                                                 incident.type === "CAMERA_UNAVAILABLE" || incident.type === "MICROPHONE_UNAVAILABLE" ? <VideoOff size={14} className="text-[#737777]" /> :
                                                 incident.type === "NETWORK_DISCONNECT" ? <WifiOff size={14} className="text-[#737777]" /> :
                                                 incident.type === "PAGE_RELOAD" ? <RefreshCcw size={14} className="text-[#737777]" /> :
                                                 incident.type === "FULLSCREEN_EXIT" ? <Maximize size={14} className="text-[#737777]" /> :
                                                 <AlertCircle size={14} className="text-[#737777]" />}
                                                <span className="text-sm font-medium">{incident.type.replace(/_/g, " ")}</span>
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
                                            {incident.eventCount}x <br/>
                                            <span className="text-xs">{new Date(incident.lastSeen).toLocaleTimeString()}</span>
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
                                                    <button onClick={() => updateStatus(incident.id, "REVIEWED")} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">Review</button>
                                                    <button onClick={() => updateStatus(incident.id, "DISMISSED")} className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">Dismiss</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => updateStatus(incident.id, "UNRESOLVED")} className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition">Reopen</button>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedIncident === incident.id && (
                                        <tr className="bg-[#f4f4f4] border-b border-[#dedbd2]">
                                            <td colSpan={6} className="p-6">
                                                <h4 className="text-sm font-bold text-[#171a1b] mb-4 flex items-center gap-2">
                                                    <Camera size={16} /> Evidence Captured
                                                </h4>
                                                
                                                {loadingEvidence[incident.id] ? (
                                                    <div className="text-sm text-[#737777]">Loading evidence...</div>
                                                ) : evidenceData[incident.id]?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-4">
                                                        {evidenceData[incident.id].map((ev: any) => (
                                                            <div key={ev.id} className="bg-white p-2 rounded-lg border border-[#dedbd2] shadow-sm flex flex-col gap-2 group relative">
                                                                <div className="w-64 h-48 bg-black rounded overflow-hidden relative">
                                                                    {/* Use standard img tag with auth API route */}
                                                                    <img 
                                                                        src={`/api/evidence/${ev.id}`} 
                                                                        alt="Evidence Snapshot" 
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between items-center px-1">
                                                                    <div className="text-xs text-[#737777] font-mono">
                                                                        {new Date(ev.capturedAt).toLocaleTimeString()}
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => deleteEvidence(incident.id, ev.id)}
                                                                        className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        title="Delete Evidence"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-[#737777] italic">No evidence captured for this incident.</div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
