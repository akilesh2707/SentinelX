"use client";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    CalendarDays,
    MonitorCheck,
    ShieldAlert,
    Users,
    BarChart3,
    Activity,
    Settings
} from "lucide-react";

const iconMap = {
    dashboard: LayoutDashboard,
    calendar: CalendarDays,
    monitor: MonitorCheck,
    shield: ShieldAlert,
    users: Users,
    chart: BarChart3,
    activity: Activity,
    settings: Settings,
};

type IconName = keyof typeof iconMap;

type ModuleShellProps = {
    title: string;
    description: string;
    icon: IconName;
    emptyStateText: string;
    emptyStateSubtext?: string;
};

export function ModuleShell({
    title,
    description,
    icon,
    emptyStateText,
    emptyStateSubtext = "Check back later when functionality is implemented.",
}: ModuleShellProps) {
    const Icon = iconMap[icon];
    return (
        <main className="min-h-full bg-[#fbfaf6] px-7 py-7 lg:px-9">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-7"
            >
                <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-orange-600 uppercase">
                        SENTINELX / {title}
                    </span>
                </div>

                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#171a1b]">
                            {title}
                        </h1>

                        <p className="mt-1 text-sm text-[#737777]">
                            {description}
                        </p>
                    </div>
                </div>
            </motion.div>

            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="overflow-hidden rounded-xl border border-[#dedbd2] bg-[#fbfaf6]"
            >
                <div className="border-b border-[#e4e1d8] px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-[#171a1b]">
                                Directory
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-24 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0ede5] text-[#888a84]">
                        <Icon size={24} />
                    </div>

                    <p className="text-sm font-medium text-[#555955]">
                        {emptyStateText}
                    </p>

                    <p className="mt-1 text-xs text-[#92938d]">
                        {emptyStateSubtext}
                    </p>
                </div>
            </motion.section>
        </main>
    );
}
