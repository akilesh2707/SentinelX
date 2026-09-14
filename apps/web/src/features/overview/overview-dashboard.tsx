"use client";

import { motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    Bell,
    Camera,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Eye,
    ShieldCheck,
    Users,
} from "lucide-react";

const metrics = [
    {
        label: "Active Assessments",
        value: "08",
        change: "+2 this week",
        icon: Activity,
    },
    {
        label: "Candidates Today",
        value: "560",
        change: "+14.8%",
        icon: Users,
    },
    {
        label: "Live Sessions",
        value: "03",
        change: "All monitored",
        icon: Eye,
    },
    {
        label: "Security Alerts",
        value: "07",
        change: "3 require review",
        icon: AlertTriangle,
        critical: true,
    },
];

const assessments = [
    {
        name: "Data Structures — Mid Semester",
        type: "MCQ + Numerical",
        participants: "60",
        status: "Live",
        security: "Secure",
        date: "Today",
    },
    {
        name: "Python Coding Challenge",
        type: "Coding",
        participants: "42",
        status: "Scheduled",
        security: "Secure",
        date: "Tomorrow",
    },
    {
        name: "Placement Aptitude Round",
        type: "MCQ",
        participants: "180",
        status: "Completed",
        security: "Verified",
        date: "Yesterday",
    },
];

const insights = [
    {
        icon: AlertTriangle,
        title: "3 candidates require review",
        description: "High-risk flags detected in ongoing sessions.",
        type: "warning",
    },
    {
        icon: Activity,
        title: "Tab switching increased",
        description: "Activity increased during Round 2.",
        type: "warning",
    },
    {
        icon: Camera,
        title: "All secondary cameras connected",
        description: "No camera connectivity issues detected.",
        type: "safe",
    },
    {
        icon: ShieldCheck,
        title: "98.4% identity verification",
        description: "Verification system operating normally.",
        type: "safe",
    },
];

const activity = [
    { label: "Monitored", value: 248 },
    { label: "Low Risk", value: 218 },
    { label: "Needs Attention", value: 24 },
    { label: "High Risk", value: 6 },
];

export function OverviewDashboard() {
    return (
        <main className="min-h-full px-7 py-7 lg:px-9">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mb-7"
            >
                <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold tracking-[0.28em] text-orange-600">
                        SENTINELX
                    </span>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                        System Secure
                    </span>
                </div>

                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#171a1b]">
                            Overview
                        </h1>

                        <p className="mt-1 text-sm text-[#737777]">
                            Monitor assessments, candidates, events, and security activity.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#737777]">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        Live system
                        <span className="text-[#b0b0aa]">•</span>
                        Updated just now
                    </div>
                </div>
            </motion.div>

            {/* Metrics */}
            <section className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric, index) => {
                    const Icon = metric.icon;

                    return (
                        <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.4,
                                delay: index * 0.08,
                            }}
                            whileHover={{ y: -3 }}
                            className={`group rounded-xl border bg-[#fbfaf6] p-5 transition-shadow duration-300 hover:shadow-lg ${metric.critical
                                    ? "border-red-200"
                                    : "border-[#dedbd2]"
                                }`}
                        >
                            <div className="mb-5 flex items-start justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a8b86]">
                                    {metric.label}
                                </span>

                                <Icon
                                    size={17}
                                    strokeWidth={1.7}
                                    className={
                                        metric.critical
                                            ? "text-red-600"
                                            : "text-[#6f7470]"
                                    }
                                />
                            </div>

                            <div className="flex items-end justify-between">
                                <span
                                    className={`text-3xl font-semibold tracking-tight ${metric.critical ? "text-red-600" : "text-[#171a1b]"
                                        }`}
                                >
                                    {metric.value}
                                </span>

                                <span
                                    className={`text-[10px] ${metric.critical
                                            ? "text-red-600"
                                            : "text-emerald-700"
                                        }`}
                                >
                                    {metric.change}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </section>

            {/* Main content */}
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
                {/* Recent assessments */}
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="overflow-hidden rounded-xl border border-[#dedbd2] bg-[#fbfaf6]"
                >
                    <div className="flex items-center justify-between border-b border-[#e4e1d8] px-5 py-4">
                        <div>
                            <h2 className="text-sm font-semibold text-[#171a1b]">
                                Recent Assessments
                            </h2>

                            <p className="mt-0.5 text-[11px] text-[#858680]">
                                Latest assessment activity
                            </p>
                        </div>

                        <button className="flex items-center gap-1 text-[11px] font-medium text-[#555955] transition-colors hover:text-orange-600">
                            View all
                            <ChevronRight size={13} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left">
                            <thead>
                                <tr className="border-b border-[#e4e1d8] text-[9px] uppercase tracking-[0.14em] text-[#969791]">
                                    <th className="px-5 py-3 font-semibold">Assessment</th>
                                    <th className="px-3 py-3 font-semibold">Type</th>
                                    <th className="px-3 py-3 font-semibold">Participants</th>
                                    <th className="px-3 py-3 font-semibold">Status</th>
                                    <th className="px-3 py-3 font-semibold">Security</th>
                                    <th className="px-5 py-3 text-right font-semibold">Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {assessments.map((assessment, index) => (
                                    <motion.tr
                                        key={assessment.name}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.35 + index * 0.08 }}
                                        className="group border-b border-[#ece9e1] last:border-0 hover:bg-[#f3f0e8]"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />

                                                <div>
                                                    <p className="text-xs font-semibold text-[#292d2d]">
                                                        {assessment.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-4 text-[11px] text-[#777974]">
                                            {assessment.type}
                                        </td>

                                        <td className="px-3 py-4 font-mono text-[11px] text-[#555955]">
                                            {assessment.participants}
                                        </td>

                                        <td className="px-3 py-4">
                                            <span className="rounded-md bg-[#e7f5ef] px-2 py-1 text-[9px] font-semibold text-emerald-700">
                                                {assessment.status}
                                            </span>
                                        </td>

                                        <td className="px-3 py-4">
                                            <span className="flex items-center gap-1.5 text-[10px] text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                {assessment.security}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-right text-[11px] text-[#777974]">
                                            {assessment.date}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* Security insights */}
                <motion.section
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-[#dedbd2] bg-[#fbfaf6]"
                >
                    <div className="border-b border-[#e4e1d8] px-5 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-[#171a1b]">
                                    Security Insights
                                </h2>

                                <p className="mt-0.5 text-[11px] text-[#858680]">
                                    Live security signals
                                </p>
                            </div>

                            <Bell size={16} className="text-[#777974]" />
                        </div>
                    </div>

                    <div className="divide-y divide-[#e7e4dc]">
                        {insights.map((item, index) => {
                            const Icon = item.icon;
                            const warning = item.type === "warning";

                            return (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + index * 0.08 }}
                                    className="flex gap-3 px-5 py-4 transition-colors hover:bg-[#f3f0e8]"
                                >
                                    <div
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${warning
                                                ? "bg-orange-50 text-orange-600"
                                                : "bg-emerald-50 text-emerald-700"
                                            }`}
                                    >
                                        <Icon size={14} />
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-semibold text-[#343837]">
                                            {item.title}
                                        </p>

                                        <p className="mt-1 text-[10px] leading-relaxed text-[#858680]">
                                            {item.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.section>
            </div>

            {/* Proctoring Activity */}
            <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-6 rounded-xl border border-[#dedbd2] bg-[#fbfaf6] p-5"
            >
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-[#171a1b]">
                            Proctoring Activity
                        </h2>

                        <p className="mt-0.5 text-[11px] text-[#858680]">
                            Current candidate monitoring status
                        </p>
                    </div>

                    <button className="flex items-center gap-1 rounded-lg border border-[#d8d5cc] px-3 py-2 text-[10px] font-medium text-[#555955] transition hover:border-orange-300 hover:text-orange-600">
                        Open live monitoring
                        <ArrowUpRight size={13} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {activity.map((item, index) => (
                        <motion.div
                            key={item.label}
                            whileHover={{ scale: 1.015 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="rounded-lg border border-[#e1ded6] bg-[#f7f5ef] p-4"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#898a84]">
                                    {item.label}
                                </span>

                                {index === 3 ? (
                                    <AlertTriangle size={13} className="text-red-600" />
                                ) : index === 2 ? (
                                    <Clock3 size={13} className="text-orange-500" />
                                ) : (
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                )}
                            </div>

                            <div className="text-2xl font-semibold text-[#202424]">
                                {item.value}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>
        </main>
    );
}