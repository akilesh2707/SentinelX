"use client";

import {
    ArrowLeft,
    Check,
    Clock3,
    Code2,
    FileText,
    Link2,
    Lock,
    ShieldCheck,
    Users,
    Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Assessment = {
    id: string;
    title: string;
    description: string | null;
    type: string;
    mcqCount: number;
    codingCount: number;
    totalMarks: number;
    passingScore: number;
    difficulty: string;
    duration: number;
    maxAttempts: string;
    lateJoin: boolean;
    autoSubmit: boolean;
    randomizeQuestions: boolean;
    negativeMarking: boolean;
    securityLevel: string;
    identityVerification: boolean;
    primaryCamera: boolean;
    secondaryCamera: boolean;
    browserLock: boolean;
    tabDetection: boolean;
    audioMonitoring: boolean;
    aiProctoring: boolean;
    accessCode: string;
    joinLink: string;
    status: string;
    createdAt: string;
    updatedAt: string;
};

export default function AssessmentDetailsPage() {
    const router = useRouter();
    const params = useParams();

    const id = params.id as string;

    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [incidents, setIncidents] = useState<any[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const [assessmentRes, incidentsRes] = await Promise.all([
                    fetch(`/api/assessments/${id}`),
                    fetch(`/api/assessments/${id}/incidents`)
                ]);

                const assessmentData = await assessmentRes.json();
                if (!assessmentRes.ok || !assessmentData.success) {
                    throw new Error(assessmentData.error || "Failed to load assessment");
                }
                setAssessment(assessmentData.assessment);

                if (incidentsRes.ok) {
                    const incidentsData = await incidentsRes.json();
                    if (incidentsData.success) {
                        setIncidents(incidentsData.incidents || []);
                    }
                }
            } catch (error) {
                console.error("Failed to load data:", error);
                setError("Unable to load assessment data.");
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            loadData();
        }
    }, [id]);

    async function deleteAssessment() {
        try {
            setDeleting(true);
            setError("");

            const response = await fetch(`/api/assessments/${id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || "Failed to delete assessment"
                );
            }

            router.push("/assessments");
        } catch (error) {
            console.error("Failed to delete assessment:", error);
            setError("Unable to delete assessment.");
            setDeleting(false);
            setShowDeleteModal(false);
        }
    }

    async function publishAssessment() {
        try {
            setTransitioning(true);
            const res = await fetch(`/api/assessments/${id}/publish`, { method: "POST" });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to publish");
            setAssessment(data.assessment);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setTransitioning(false);
        }
    }

    async function closeAssessment() {
        if (!confirm("Are you sure you want to close this assessment?")) return;
        try {
            setTransitioning(true);
            const res = await fetch(`/api/assessments/${id}/close`, { method: "POST" });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to close");
            setAssessment(data.assessment);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setTransitioning(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#f5f2eb] px-7 py-10">
                <div className="mx-auto max-w-6xl rounded-xl border border-black/10 bg-[#faf8f3] p-10 text-center">
                    <p className="text-sm font-medium text-black/60">
                        Loading assessment...
                    </p>
                </div>
            </main>
        );
    }

    if (error || !assessment) {
        return (
            <main className="min-h-screen bg-[#f5f2eb] px-7 py-10">
                <div className="mx-auto max-w-6xl rounded-xl border border-red-200 bg-red-50 p-10 text-center">
                    <p className="text-sm font-medium text-red-700">
                        {error || "Assessment not found."}
                    </p>

                    <button
                        onClick={() => router.push("/assessments")}
                        className="mt-5 rounded-lg bg-[#f15b1f] px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Back to Assessments
                    </button>
                </div>
            </main>
        );
    }

    const totalQuestions =
        assessment.mcqCount + assessment.codingCount;

    const securityLabel =
        assessment.securityLevel === "strict"
            ? "Strict"
            : assessment.securityLevel === "high"
                ? "High Security"
                : "Standard";

    return (
        <main className="min-h-screen bg-[#f5f2eb] text-[#171a1a]">
            {/* Header */}
            <div className="border-b border-black/10 bg-[#faf8f3]">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-7 py-5">
                    <button
                        onClick={() => router.push("/assessments")}
                        className="flex items-center gap-2 text-sm text-black/60 transition hover:text-black"
                    >
                        <ArrowLeft size={17} />
                        Back to Assessments
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                            {assessment.status}
                        </span>

                        {assessment.status === "DRAFT" && (
                            <button
                                onClick={publishAssessment}
                                disabled={transitioning}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {transitioning ? "Publishing..." : "Publish"}
                            </button>
                        )}
                        
                        {assessment.status === "PUBLISHED" && (
                            <button
                                onClick={closeAssessment}
                                disabled={transitioning}
                                className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                {transitioning ? "Closing..." : "Close Assessment"}
                            </button>
                        )}

                        {assessment.status !== "CLOSED" && (
                            <button
                                onClick={() => router.push(`/assessments/${assessment.id}/edit`)}
                                className="rounded-lg bg-[#f15b1f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d94f18]"
                            >
                                Edit Assessment
                            </button>
                        )}
                        {assessment.status === "DRAFT" && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-7 py-10">
                {/* Title */}
                <section className="mb-7">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#f15b1f]">
                            SENTINELX / ASSESSMENT
                        </span>

                        <span className="font-mono text-[10px] text-black/35">
                            {assessment.accessCode}
                        </span>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight">
                        {assessment.title}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm text-black/50">
                        {assessment.description ||
                            "No description provided for this assessment."}
                    </p>
                </section>

                {/* Overview */}
                <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<FileText size={17} />}
                        label="Questions"
                        value={String(totalQuestions)}
                    />

                    <StatCard
                        icon={<Code2 size={17} />}
                        label="Assessment Type"
                        value={formatType(assessment.type)}
                    />

                    <StatCard
                        icon={<Clock3 size={17} />}
                        label="Duration"
                        value={`${assessment.duration} min`}
                    />

                    <StatCard
                        icon={<Zap size={17} />}
                        label="Difficulty"
                        value={assessment.difficulty}
                    />
                </section>

                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                    {/* Main */}
                    <div className="space-y-6">
                        {/* Configuration */}
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<FileText size={17} />}
                                title="Assessment Configuration"
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <InfoItem
                                    label="MCQ Questions"
                                    value={String(assessment.mcqCount)}
                                />

                                <InfoItem
                                    label="Coding Problems"
                                    value={String(assessment.codingCount)}
                                />

                                <InfoItem
                                    label="Total Marks"
                                    value={String(assessment.totalMarks)}
                                />

                                <InfoItem
                                    label="Passing Score"
                                    value={String(assessment.passingScore)}
                                />

                                <InfoItem
                                    label="Max Attempts"
                                    value={assessment.maxAttempts}
                                />

                                <InfoItem
                                    label="Duration"
                                    value={`${assessment.duration} Minutes`}
                                />

                                <InfoItem
                                    label="Randomize Questions"
                                    value={
                                        assessment.randomizeQuestions
                                            ? "Enabled"
                                            : "Disabled"
                                    }
                                />

                                <InfoItem
                                    label="Negative Marking"
                                    value={
                                        assessment.negativeMarking
                                            ? "Enabled"
                                            : "Disabled"
                                    }
                                />

                                <InfoItem
                                    label="Auto Submit"
                                    value={
                                        assessment.autoSubmit
                                            ? "Enabled"
                                            : "Disabled"
                                    }
                                />

                                <InfoItem
                                    label="Late Join"
                                    value={
                                        assessment.lateJoin
                                            ? "Allowed"
                                            : "Not Allowed"
                                    }
                                />
                            </div>
                        </section>

                        {/* Security */}
                        <section className="overflow-hidden rounded-xl bg-[#111616] p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                                        Security Configuration
                                    </div>

                                    <h2 className="mt-2 text-xl font-bold">
                                        SentinelX Protection
                                    </h2>
                                </div>

                                <span className="rounded-full bg-[#f15b1f] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                                    {securityLabel}
                                </span>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <SecurityStatus
                                    title="Identity Verification"
                                    enabled={assessment.identityVerification}
                                />

                                <SecurityStatus
                                    title="Primary Camera"
                                    enabled={assessment.primaryCamera}
                                />

                                <SecurityStatus
                                    title="Secondary Camera"
                                    enabled={assessment.secondaryCamera}
                                />

                                <SecurityStatus
                                    title="AI Proctoring"
                                    enabled={assessment.aiProctoring}
                                />

                                <SecurityStatus
                                    title="Browser Lock"
                                    enabled={assessment.browserLock}
                                />

                                <SecurityStatus
                                    title="Tab Detection"
                                    enabled={assessment.tabDetection}
                                />

                                <SecurityStatus
                                    title="Audio Monitoring"
                                    enabled={assessment.audioMonitoring}
                                />
                            </div>
                        </section>

                        {/* Incidents Section */}
                        {incidents.length > 0 && (
                            <section className="rounded-xl border border-red-200 bg-[#fff5f5] p-6">
                                <SectionHeader
                                    icon={<ShieldCheck size={17} />}
                                    title="Active Security Incidents"
                                />
                                <div className="space-y-3">
                                    {incidents.slice(0, 5).map((incident) => (
                                        <div key={incident.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                                            <div>
                                                <div className="font-semibold text-sm">{incident.attempt.candidate.name}</div>
                                                <div className="text-xs text-red-600 font-medium">{incident.type.replace(/_/g, " ")} ({incident.severity})</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">{incident.eventCount} events</div>
                                                <div className="text-[10px] text-gray-400">{new Date(incident.lastSeen).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {incidents.length > 5 && (
                                        <button onClick={() => router.push("/incidents")} className="w-full text-center text-xs text-red-600 font-bold hover:underline">
                                            View all {incidents.length} incidents
                                        </button>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {/* Access */}
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<Link2 size={17} />}
                                title="Assessment Access"
                            />

                            <div className="space-y-4">
                                <InfoItem
                                    label="Access Code"
                                    value={assessment.accessCode}
                                    mono
                                />

                                <InfoItem
                                    label="Join Link"
                                    value={`${window.location.origin}${assessment.joinLink}`}
                                    mono
                                />
                            </div>

                            <button
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        `${window.location.origin}${assessment.joinLink}`
                                    )
                                }
                                className="mt-5 w-full rounded-lg bg-[#f15b1f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d94f18]"
                            >
                                Copy Join Link
                            </button>
                        </section>

                        {/* Security summary */}
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<ShieldCheck size={17} />}
                                title="Security Summary"
                            />

                            <div className="space-y-3">
                                <SummaryRow
                                    icon={<ShieldCheck size={15} />}
                                    label="Security Level"
                                    value={securityLabel}
                                />

                                <SummaryRow
                                    icon={<Users size={15} />}
                                    label="Camera"
                                    value={
                                        assessment.secondaryCamera
                                            ? "Dual Camera"
                                            : assessment.primaryCamera
                                                ? "Primary Camera"
                                                : "Disabled"
                                    }
                                />

                                <SummaryRow
                                    icon={<Lock size={15} />}
                                    label="Browser"
                                    value={
                                        assessment.browserLock
                                            ? "Locked"
                                            : "Unlocked"
                                    }
                                />

                                <SummaryRow
                                    icon={<Zap size={15} />}
                                    label="AI Proctoring"
                                    value={
                                        assessment.aiProctoring
                                            ? "Active"
                                            : "Disabled"
                                    }
                                />
                            </div>
                        </section>

                        {/* Metadata */}
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<Clock3 size={17} />}
                                title="Metadata"
                            />

                            <div className="space-y-4">
                                <InfoItem
                                    label="Created"
                                    value={new Date(
                                        assessment.createdAt
                                    ).toLocaleString()}
                                />

                                <InfoItem
                                    label="Last Updated"
                                    value={new Date(
                                        assessment.updatedAt
                                    ).toLocaleString()}
                                />

                                <InfoItem
                                    label="Assessment ID"
                                    value={assessment.id}
                                    mono
                                />
                            </div>
                        </section>
                    </aside>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
                    <div className="w-full max-w-md rounded-xl border border-black/10 bg-[#faf8f3] p-6 shadow-xl">
                        <div className="text-xs font-semibold uppercase tracking-wider text-red-600">
                            Delete Assessment
                        </div>

                        <h2 className="mt-2 text-xl font-bold">
                            Delete "{assessment.title}"?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-black/50">
                            This action cannot be undone. The assessment and
                            its configuration will be permanently removed.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-medium"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={deleteAssessment}
                                disabled={deleting}
                                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete Assessment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function formatType(type: string) {
    switch (type.toLowerCase()) {
        case "mcq":
            return "MCQ";

        case "coding":
            return "Coding";

        case "mixed":
            return "Mixed";

        default:
            return type;
    }
}

function SectionHeader({
    icon,
    title,
}: {
    icon: React.ReactNode;
    title: string;
}) {
    return (
        <div className="mb-5 flex items-center gap-2 border-b border-black/10 pb-4">
            <span className="text-[#f15b1f]">{icon}</span>

            <h2 className="text-sm font-bold uppercase tracking-wider">
                {title}
            </h2>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-[#dedbd2] bg-[#fbfaf6] p-4">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#92938d]">
                    {label}
                </span>

                <span className="text-[#858780]">{icon}</span>
            </div>

            <p className="mt-3 text-xl font-semibold text-[#202424]">
                {value}
            </p>
        </div>
    );
}

function InfoItem({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="rounded-lg border border-black/10 bg-white p-4">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-black/40">
                {label}
            </div>

            <div
                className={`mt-2 break-all text-sm font-semibold ${mono ? "font-mono" : ""
                    }`}
            >
                {value}
            </div>
        </div>
    );
}

function SecurityStatus({
    title,
    enabled,
}: {
    title: string;
    enabled: boolean;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <div
                className={[
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    enabled
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-white/10 text-white/30",
                ].join(" ")}
            >
                {enabled ? <Check size={14} /> : "—"}
            </div>

            <span className="text-sm text-white/80">{title}</span>

            <span className="ml-auto text-xs text-white/40">
                {enabled ? "Enabled" : "Disabled"}
            </span>
        </div>
    );
}

function SummaryRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-3">
            <span className="text-[#f15b1f]">{icon}</span>

            <span className="text-xs text-black/50">{label}</span>

            <span className="ml-auto text-xs font-semibold text-black/75">
                {value}
            </span>
        </div>
    );
}