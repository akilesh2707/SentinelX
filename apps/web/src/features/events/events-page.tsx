"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Calendar, Users, BookOpen, ChevronRight, XCircle, Plus, CalendarDays } from "lucide-react";

type EventSummary = {
    id: string;
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
    createdAt: string;
    assessmentCount: number;
    totalAttempts: number;
};

export default function EventsPage() {
    const [events, setEvents] = useState<EventSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Modal state for creating event
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [search, statusFilter]);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter) params.append("status", statusFilter);

            const res = await fetch(`/api/events?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setEvents(data.events);
            } else {
                setError(data.error || "Failed to load events");
            }
        } catch (err) {
            setError("Network error loading events");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle })
            });
            const data = await res.json();
            if (data.success) {
                setIsCreateOpen(false);
                setNewTitle("");
                fetchEvents();
            } else {
                alert(data.error || "Failed to create event");
            }
        } catch (err) {
            alert("Network error");
        } finally {
            setCreating(false);
        }
    };

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
        const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        if (start && end) {
            return `${new Date(start).toLocaleDateString(undefined, formatOptions)} - ${new Date(end).toLocaleDateString(undefined, formatOptions)}`;
        }
        if (start) return `Starts: ${new Date(start).toLocaleDateString(undefined, formatOptions)}`;
        return `Ends: ${new Date(end!).toLocaleDateString(undefined, formatOptions)}`;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#171a1b] mb-2 flex items-center gap-3">
                        <CalendarDays className="text-[#303433]" /> Events
                    </h1>
                    <p className="text-[#737777]">Manage scheduled hiring drives and examinations.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#171a1b] hover:bg-[#303433] text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus size={18} /> Create Event
                </button>
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
                            placeholder="Search events by title..."
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
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="ACTIVE">Active</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#dedbd2] bg-[#fbfaf6]/50">
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Event Details</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Schedule</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider text-center">Assessments</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider text-center">Participation</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-[#737777] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dedbd2]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-[#737777]">
                                        <div className="animate-pulse flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#303433] border-t-transparent rounded-full animate-spin" />
                                            Loading events...
                                        </div>
                                    </td>
                                </tr>
                            ) : events.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-[#737777]">
                                        No events found matching your criteria.
                                    </td>
                                </tr>
                            ) : events.map((event) => (
                                <tr key={event.id} className="hover:bg-[#fbfaf6] transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-[#171a1b] text-base">{event.title}</div>
                                        {event.description && (
                                            <div className="text-xs text-[#737777] mt-1 line-clamp-1 max-w-xs">{event.description}</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-[#303433]">
                                            <Calendar size={14} className="text-[#737777]" />
                                            {formatDateRange(event.startDate, event.endDate)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 bg-[#fbfaf6] border border-[#dedbd2] px-3 py-1 rounded-full text-sm font-bold text-[#171a1b]">
                                            <BookOpen size={14} className="text-[#737777]" /> {event.assessmentCount}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 bg-[#fbfaf6] border border-[#dedbd2] px-3 py-1 rounded-full text-sm font-bold text-[#171a1b]">
                                            <Users size={14} className="text-[#737777]" /> {event.totalAttempts}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(event.status)}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/events/${event.id}`}
                                            className="inline-flex items-center gap-1 text-sm font-medium text-[#303433] hover:text-emerald-600 transition-colors"
                                        >
                                            Manage <ChevronRight size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Event Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-[#dedbd2]">
                            <h3 className="text-lg font-bold text-[#171a1b]">Create New Event</h3>
                            <p className="text-sm text-[#737777]">Initialize a new hiring drive or exam session.</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#171a1b] mb-1.5">Event Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="e.g. Fall 2026 Campus Drive"
                                        className="w-full px-4 py-2.5 bg-[#fbfaf6] border border-[#dedbd2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[#171a1b]"
                                        disabled={creating}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-[#737777] hover:text-[#171a1b] transition-colors"
                                        disabled={creating}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !newTitle.trim()}
                                        className="bg-[#171a1b] hover:bg-[#303433] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {creating ? "Creating..." : "Create Event"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
