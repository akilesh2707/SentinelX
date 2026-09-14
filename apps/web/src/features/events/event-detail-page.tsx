"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Users, BookOpen, Clock, Trash2, Edit, Plus, XCircle, Trash } from "lucide-react";

type AttachedAssessment = {
    id: string;
    title: string;
    type: string;
    duration: number;
    status: string;
    questionCount: number;
    attemptCount: number;
};

type EventDetail = {
    id: string;
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
    createdAt: string;
};

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [assessments, setAssessments] = useState<AttachedAssessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit Modal state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ title: "", description: "", startDate: "", endDate: "", status: "" });
    const [saving, setSaving] = useState(false);

    // Attach Assessment Modal state
    const [isAttachOpen, setIsAttachOpen] = useState(false);
    const [attachId, setAttachId] = useState("");
    const [attaching, setAttaching] = useState(false);

    useEffect(() => {
        fetchDetail();
    }, [eventId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/events/${eventId}`);
            const data = await res.json();

            if (data.success) {
                setEvent(data.event);
                setAssessments(data.assessments);
                setEditForm({
                    title: data.event.title,
                    description: data.event.description || "",
                    startDate: data.event.startDate ? new Date(data.event.startDate).toISOString().slice(0, 16) : "",
                    endDate: data.event.endDate ? new Date(data.event.endDate).toISOString().slice(0, 16) : "",
                    status: data.event.status
                });
            } else {
                setError(data.error || "Failed to load event details");
            }
        } catch (err) {
            setError("Network error loading event details");
        } finally {
            setLoading(false);
        }
    };

    const handleEditEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/events/${eventId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editForm.title,
                    description: editForm.description || null,
                    startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : null,
                    endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : null,
                    status: editForm.status
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsEditOpen(false);
                fetchDetail();
            } else {
                alert(data.error || "Failed to update event");
            }
        } catch (err) {
            alert("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!confirm("Are you sure you want to delete this event? This will not delete the assessments.")) return;
        try {
            const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                router.push("/events");
            } else {
                alert(data.error || "Failed to delete event");
            }
        } catch (err) {
            alert("Network error");
        }
    };

    const handleAttachAssessment = async (e: React.FormEvent) => {
        e.preventDefault();
        setAttaching(true);
        try {
            const res = await fetch(`/api/events/${eventId}/assessments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assessmentId: attachId.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setIsAttachOpen(false);
                setAttachId("");
                fetchDetail();
            } else {
                alert(data.error || "Failed to attach assessment");
            }
        } catch (err) {
            alert("Network error");
        } finally {
            setAttaching(false);
        }
    };

    const handleRemoveAssessment = async (assessmentId: string) => {
        if (!confirm("Remove this assessment from the event? (The assessment itself will not be deleted)")) return;
        try {
            const res = await fetch(`/api/events/${eventId}/assessments/${assessmentId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                fetchDetail();
            } else {
                alert(data.error || "Failed to remove assessment");
            }
        } catch (err) {
            alert("Network error");
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-8 h-8 border-2 border-[#303433] border-t-transparent rounded-full animate-spin" />
                <div className="text-[#737777]">Loading event data...</div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <Link href="/events" className="inline-flex items-center gap-2 text-sm text-[#737777] hover:text-[#303433] mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Events
                </Link>
                <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3 shadow-sm">
                    <XCircle size={24} />
                    <span className="font-medium text-lg">{error || "Event not found"}</span>
                </div>
            </div>
        );
    }

    const totalAttempts = assessments.reduce((sum, a) => sum + a.attemptCount, 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE": return "text-emerald-500 bg-emerald-500/10";
            case "PUBLISHED": return "text-amber-500 bg-amber-500/10";
            case "DRAFT": return "text-gray-500 bg-gray-500/10";
            case "CLOSED": return "text-red-500 bg-red-500/10";
            default: return "text-gray-500 bg-gray-500/10";
        }
    };

    const formatDateRange = (start: string | null, end: string | null) => {
        if (!start && !end) return "Unscheduled";
        const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
        if (start && end) {
            return `${new Date(start).toLocaleString(undefined, formatOptions)} - ${new Date(end).toLocaleString(undefined, formatOptions)}`;
        }
        if (start) return `Starts: ${new Date(start).toLocaleString(undefined, formatOptions)}`;
        return `Ends: ${new Date(end!).toLocaleString(undefined, formatOptions)}`;
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <Link href="/events" className="inline-flex items-center gap-2 text-sm text-[#737777] hover:text-[#303433] transition-colors font-medium">
                    <ArrowLeft size={16} /> Back to Events
                </Link>
                <div className="flex gap-3">
                    <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2 text-sm font-medium text-[#303433] bg-white border border-[#dedbd2] px-4 py-2 rounded-lg shadow-sm hover:bg-[#fbfaf6]">
                        <Edit size={16} /> Edit Event
                    </button>
                    <button onClick={handleDeleteEvent} className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-lg shadow-sm hover:bg-red-100">
                        <Trash2 size={16} /> Delete Event
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                <div className="bg-[#171a1b] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(event.status).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                                {event.status}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
                        {event.description && <p className="text-[#a0a19b] max-w-2xl mb-6">{event.description}</p>}

                        <div className="flex flex-wrap gap-6 text-sm text-[#a0a19b] bg-[#303433]/50 p-4 rounded-xl border border-[#737777]/30 inline-flex">
                            <div className="flex items-center gap-2"><CalendarDays size={18} className="text-white" /> {formatDateRange(event.startDate, event.endDate)}</div>
                            <div className="flex items-center gap-2"><BookOpen size={18} className="text-white" /> {assessments.length} Assessments</div>
                            <div className="flex items-center gap-2"><Users size={18} className="text-white" /> {totalAttempts} Total Attempts</div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#171a1b] flex items-center gap-2">
                        <BookOpen size={20} className="text-[#737777]" /> Attached Assessments
                    </h2>
                    <button onClick={() => setIsAttachOpen(true)} className="flex items-center gap-2 text-sm font-medium text-white bg-[#171a1b] px-4 py-2 rounded-lg shadow-sm hover:bg-[#303433]">
                        <Plus size={16} /> Add Assessment
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden divide-y divide-[#dedbd2]">
                    {assessments.length === 0 ? (
                        <div className="p-8 text-center text-[#737777]">
                            No assessments are attached to this event yet.
                        </div>
                    ) : (
                        assessments.map((a) => (
                            <div key={a.id} className="p-6 hover:bg-[#fbfaf6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-[#171a1b] text-lg flex items-center gap-2">
                                        {a.title}
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${a.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                            {a.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium text-[#737777]">
                                        <span className="flex items-center gap-1"><BookOpen size={14} /> {a.type}</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> {a.duration} mins</span>
                                        <span className="flex items-center gap-1 text-[#171a1b] font-bold px-2 py-0.5 bg-gray-100 rounded">{a.questionCount} Questions</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:items-end gap-3">
                                    <div className="text-sm font-bold text-[#171a1b]">
                                        {a.attemptCount} <span className="text-[#737777] font-medium">Attempts</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/assessments/${a.id}`} className="text-xs font-medium text-[#303433] bg-white border border-[#dedbd2] px-3 py-1.5 rounded hover:bg-[#fbfaf6]">
                                            View
                                        </Link>
                                        <button onClick={() => handleRemoveAssessment(a.id)} className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded hover:bg-red-100 flex items-center gap-1">
                                            <Trash size={12} /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-[#dedbd2]">
                            <h3 className="text-lg font-bold text-[#171a1b]">Edit Event Details</h3>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <form id="edit-form" onSubmit={handleEditEvent} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#171a1b] mb-1.5">Event Title *</label>
                                    <input type="text" required value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full px-4 py-2 bg-[#fbfaf6] border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:border-emerald-500" disabled={saving} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#171a1b] mb-1.5">Description</label>
                                    <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full px-4 py-2 bg-[#fbfaf6] border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:border-emerald-500" disabled={saving} rows={3} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-[#171a1b] mb-1.5">Start Date</label>
                                        <input type="datetime-local" value={editForm.startDate} onChange={(e) => setEditForm({...editForm, startDate: e.target.value})} className="w-full px-4 py-2 bg-[#fbfaf6] border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:border-emerald-500" disabled={saving} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#171a1b] mb-1.5">End Date</label>
                                        <input type="datetime-local" value={editForm.endDate} onChange={(e) => setEditForm({...editForm, endDate: e.target.value})} className="w-full px-4 py-2 bg-[#fbfaf6] border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:border-emerald-500" disabled={saving} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#171a1b] mb-1.5">Status</label>
                                    <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full px-4 py-2 bg-[#fbfaf6] border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:border-emerald-500" disabled={saving}>
                                        <option value="DRAFT">Draft</option>
                                        <option value="PUBLISHED">Published</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-[#dedbd2] bg-[#fbfaf6] flex justify-end gap-3">
                            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm font-medium text-[#737777] hover:text-[#171a1b]" disabled={saving}>Cancel</button>
                            <button form="edit-form" type="submit" disabled={saving || !editForm.title.trim()} className="bg-[#171a1b] hover:bg-[#303433] text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attach Modal */}
            {isAttachOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-[#dedbd2]">
                            <h3 className="text-lg font-bold text-[#171a1b]">Attach Assessment</h3>
                        </div>
                        <div className="p-6">
                            <form id="attach-form" onSubmit={handleAttachAssessment} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#171a1b] mb-1.5">Assessment ID *</label>
                                    <input type="text" required value={attachId} onChange={(e) => setAttachId(e.target.value)} placeholder="Enter Assessment ID" className="w-full px-4 py-2 bg-[#fbfaf6] border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:border-emerald-500" disabled={attaching} />
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-[#dedbd2] bg-[#fbfaf6] flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAttachOpen(false)} className="px-4 py-2 text-sm font-medium text-[#737777] hover:text-[#171a1b]" disabled={attaching}>Cancel</button>
                            <button form="attach-form" type="submit" disabled={attaching || !attachId.trim()} className="bg-[#171a1b] hover:bg-[#303433] text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                {attaching ? "Attaching..." : "Attach"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
