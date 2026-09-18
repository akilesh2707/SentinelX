"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    MoreHorizontal,
    Plus,
    Search,
    ShieldCheck,
    Users,
    Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

type Status = "Published" | "Closed" | "Draft";

const filters: Array<"All" | Status> = [
    "All",
    "Published",
    "Closed",
    "Draft",
];

const statusStyles: Record<Status, string> = {
    Published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Closed: "bg-slate-100 text-slate-600 border-slate-200",
    Draft: "bg-[#f1eee7] text-[#777870] border-[#ddd9cf]",
};



function getDisplayStatus(assessment: Assessment): Status {
    switch (assessment.status) {
        case "PUBLISHED":
            return "Published";

        case "CLOSED":
            return "Closed";

        case "DRAFT":
            return "Draft";

        default:
            return "Draft";
    }
}

function getAssessmentType(type: string) {
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

function getSecurityLabel(level: string) {
    switch (level.toLowerCase()) {
        case "strict":
            return "Strict";

        case "high":
            return "High Security";

        case "standard":
            return "Standard";

        default:
            return level;
    }
}

export function AssessmentsPage() {
    const router = useRouter();
    const [filter, setFilter] =
        useState<(typeof filters)[number]>("All");

    const [search, setSearch] = useState("");

    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadAssessments() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch("/api/assessments");

                if (!response.ok) {
                    throw new Error("Failed to load assessments");
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(
                        data.error || "Failed to load assessments"
                    );
                }

                setAssessments(data.assessments);
            } catch (error) {
                console.error("Failed to load assessments:", error);
                setError("Unable to load assessments.");
            } finally {
                setLoading(false);
            }
        }

        loadAssessments();
    }, []);

    const filteredAssessments = useMemo(() => {
        return assessments.filter((assessment) => {
            const matchesFilter =
                filter === "All" ||
                getDisplayStatus(assessment) === filter;

            const searchText = search.toLowerCase();

            const matchesSearch =
                assessment.title.toLowerCase().includes(searchText) ||
                assessment.type.toLowerCase().includes(searchText);

            return matchesFilter && matchesSearch;
        });
    }, [assessments, filter, search]);

    return (
        <main className="min-h-full px-7 py-7 lg:px-9">
            {/* Page heading */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-7"
            >
                <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-orange-600">
                        SENTINELX / ASSESSMENTS
                    </span>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-700">
                        {assessments.length.toString().padStart(2, "0")} TOTAL
                    </span>
                </div>

                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#171a1b]">
                            Assessments
                        </h1>

                        <p className="mt-1 text-sm text-[#737777]">
                            Create, configure, monitor and manage secure assessments.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push("/assessments/new")}
                        className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md"
                    >
                        <Plus size={16} />
                        Create Assessment
                    </button>
                </div>
            </motion.div>

            {/* Overview strip */}
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
            >
                {[
                    ["Total Assessments", String(assessments.length), FileText],
                    [
                        "Published",
                        String(
                            assessments.filter(
                                (assessment) => getDisplayStatus(assessment) === "Published"
                            ).length
                        ),
                        Zap,
                    ],
                    [
                        "Closed",
                        String(
                            assessments.filter(
                                (assessment) => getDisplayStatus(assessment) === "Closed"
                            ).length
                        ),
                        CalendarDays,
                    ],
                    ["Candidates", "—", Users],
                ].map(([label, value, Icon], index) => {
                    const IconComponent = Icon as typeof FileText;

                    return (
                        <motion.div
                            key={label as string}
                            whileHover={{ y: -2 }}
                            className="rounded-xl border border-[#dedbd2] bg-[#fbfaf6] p-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#92938d]">
                                    {label as string}
                                </span>
                                <IconComponent
                                    size={15}
                                    className="text-[#858780]"
                                />
                            </div>

                            <p className="mt-3 text-2xl font-semibold text-[#202424]">
                                {value as string}
                            </p>
                        </motion.div>
                    );
                })}
            </motion.section>

            {/* Controls */}
            <section className="mb-5 flex flex-col gap-3 rounded-xl border border-[#dedbd2] bg-[#fbfaf6] p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-1">
                    {filters.map((item) => (
                        <button
                            key={item}
                            onClick={() => setFilter(item)}
                            className={`relative rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${filter === item
                                ? "text-orange-700"
                                : "text-[#777974] hover:bg-[#f0ede5]"
                                }`}
                        >
                            {filter === item && (
                                <motion.span
                                    layoutId="assessment-filter"
                                    className="absolute inset-0 -z-0 rounded-lg bg-orange-50"
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                    }}
                                />
                            )}

                            <span className="relative z-10">{item}</span>
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92938d]"
                    />

                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search assessments..."
                        className="w-full rounded-lg border border-[#dcd9d1] bg-[#f7f5ef] py-2 pl-9 pr-3 text-xs text-[#303433] outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                </div>
            </section>
            {loading && (
                <div className="mb-5 rounded-xl border border-[#dedbd2] bg-[#fbfaf6] px-5 py-8 text-center">
                    <p className="text-sm font-medium text-[#555955]">
                        Loading assessments...
                    </p>
                </div>
            )}

            {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center">
                    <p className="text-sm font-medium text-red-700">
                        {error}
                    </p>
                </div>
            )}
            {/* Assessment list */}
            <section className="overflow-hidden rounded-xl border border-[#dedbd2] bg-[#fbfaf6]">
                <div className="border-b border-[#e4e1d8] px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-[#171a1b]">
                                Assessment Registry
                            </h2>

                            <p className="mt-0.5 text-[11px] text-[#858680]">
                                {filteredAssessments.length} assessment
                                {filteredAssessments.length !== 1 ? "s" : ""} displayed
                            </p>
                        </div>

                        <button className="hidden items-center gap-1 text-[11px] text-[#666963] transition hover:text-orange-600 sm:flex">
                            Manage policies
                            <ArrowUpRight size={13} />
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-[#e8e5dd]">
                    <AnimatePresence mode="popLayout">
                        {filteredAssessments.map((assessment, index) => {
                            const displayStatus = getDisplayStatus(assessment);

                            const progress = 0;

                            return (
                                <motion.article
                                    layout
                                    key={assessment.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{
                                        delay: index * 0.05,
                                    }}
                                    className="group px-5 py-5 transition-colors hover:bg-[#f6f3ec]"
                                >
                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                                        {/* Main */}
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-[9px] text-[#999a94]">
                                                    {assessment.accessCode}
                                                </span>

                                                <span
                                                    className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold ${statusStyles[displayStatus]}`}
                                                >
                                                    {displayStatus}
                                                </span>
                                            </div>

                                            <h3 className="text-sm font-semibold text-[#252929]">
                                                {assessment.title}
                                            </h3>

                                            <p className="mt-1 text-[11px] text-[#81837d]">
                                                {getAssessmentType(assessment.type)}
                                                <span className="mx-2 text-[#c0beb7]">
                                                    •
                                                </span>
                                                {assessment.duration} min
                                                <span className="mx-2 text-[#c0beb7]">
                                                    •
                                                </span>
                                                {assessment.totalMarks} marks
                                            </p>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10px] sm:grid-cols-4 xl:w-[470px]">
                                            <div>
                                                <p className="mb-1 uppercase tracking-wider text-[#a0a19b]">
                                                    Questions
                                                </p>

                                                <p className="font-mono text-xs font-semibold text-[#393d3c]">
                                                    {assessment.mcqCount + assessment.codingCount}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="mb-1 uppercase tracking-wider text-[#a0a19b]">
                                                    Marks
                                                </p>

                                                <p className="font-mono text-xs font-semibold text-[#393d3c]">
                                                    {assessment.totalMarks}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="mb-1 uppercase tracking-wider text-[#a0a19b]">
                                                    Security
                                                </p>

                                                <p className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                                                    <ShieldCheck size={12} />
                                                    {getSecurityLabel(assessment.securityLevel)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="mb-1 uppercase tracking-wider text-[#a0a19b]">
                                                    Created
                                                </p>

                                                <p className="flex items-center gap-1 text-xs text-[#555955]">
                                                    <Clock3 size={12} />
                                                    {new Date(assessment.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 xl:ml-auto">
                                            <button
                                                onClick={() =>
                                                    router.push(`/assessments/${assessment.id}`)
                                                }
                                                className="flex items-center gap-1.5 rounded-lg border border-[#d8d5cd] px-3 py-2 text-[10px] font-semibold text-[#565a56] transition hover:border-orange-300 hover:text-orange-600"
                                            >
                                                View
                                                <ChevronRight size={13} />
                                            </button>

                                            {displayStatus === "Published" && (
                                                <button 
                                                    onClick={() => router.push(`/proctoring?assessmentId=${assessment.id}`)}
                                                    className="rounded-lg bg-[#202424] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-orange-600"
                                                >
                                                    Monitor
                                                </button>
                                            )}

                                            <button className="rounded-lg p-2 text-[#888a84] transition hover:bg-[#eae7df] hover:text-[#333735]">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress */}

                                </motion.article>
                            );
                        })}
                    </AnimatePresence>

                    {filteredAssessments.length === 0 && (
                        <div className="px-5 py-16 text-center">
                            <CheckCircle2
                                size={24}
                                className="mx-auto mb-3 text-[#aaa]"
                            />

                            <p className="text-sm font-medium text-[#555955]">
                                No assessments found
                            </p>

                            <p className="mt-1 text-xs text-[#92938d]">
                                Try changing the filter or search term.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}