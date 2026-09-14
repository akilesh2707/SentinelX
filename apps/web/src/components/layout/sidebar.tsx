"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,
    BarChart3,
    CalendarDays,
    FileText,
    LayoutDashboard,
    MonitorCheck,
    Settings,
    ShieldAlert,
    Users,
    X,
} from "lucide-react";

type SidebarProps = {
    collapsed: boolean;
    mobileOpen: boolean;
    onCloseMobile: () => void;
};

const navigation = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Assessments", icon: FileText, href: "/assessments" },
    { label: "Question Bank", icon: FileText, href: "/questions" },
    { label: "Events", icon: CalendarDays, href: "/events" },
    { label: "Proctoring", icon: MonitorCheck, href: "/proctoring" },
    { label: "Incidents", icon: ShieldAlert, href: "/incidents" },
    { label: "Candidates", icon: Users, href: "/candidates" },
    { label: "Results", icon: BarChart3, href: "/results" },
    { label: "Reports", icon: Activity, href: "/reports" },
];

export function Sidebar({
    collapsed,
    mobileOpen,
    onCloseMobile,
}: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {mobileOpen && (
                <button
                    aria-label="Close navigation"
                    onClick={onCloseMobile}
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                />
            )}

            <motion.aside
                initial={false}
                animate={{
                    width: collapsed ? 76 : 248,
                }}
                transition={{
                    duration: 0.25,
                    ease: "easeInOut",
                }}
                className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          border-r border-border bg-graphite
          max-lg:w-[248px]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          transition-transform duration-200 lg:transition-none
        `}
            >
                {/* Brand */}
                <div className="flex h-20 items-center border-b border-border px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal text-carbon">
                            <ShieldAlert size={19} strokeWidth={2.5} />
                        </div>

                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="min-w-0"
                            >
                                <div className="font-semibold tracking-tight text-text-primary">
                                    SentinelX
                                </div>
                                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-secondary">
                                    Vigilance System
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <button
                        onClick={onCloseMobile}
                        className="ml-auto rounded-md p-2 text-text-secondary hover:bg-surface hover:text-text-primary lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Primary navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-5">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            // Check if pathname matches href exactly, or if href is not "/" and pathname starts with href
                            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                            return (
                                <Link
                                    href={item.href}
                                    key={item.label}
                                    className={`
                    group relative flex w-full items-center gap-3
                    rounded-md px-3 py-2.5 text-left text-sm
                    transition-all duration-200
                    ${active
                                            ? "bg-surface text-text-primary"
                                            : "text-text-secondary hover:bg-surface/70 hover:text-text-primary"
                                        }
                  `}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="active-nav"
                                            className="absolute left-0 h-6 w-[2px] rounded-full bg-signal"
                                        />
                                    )}

                                    <Icon
                                        size={17}
                                        strokeWidth={active ? 2.2 : 1.8}
                                        className={
                                            active
                                                ? "text-signal"
                                                : "text-text-secondary group-hover:text-text-primary"
                                        }
                                    />

                                    {!collapsed && (
                                        <span className="truncate">{item.label}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Bottom navigation */}
                <div className="border-t border-border p-3">
                    <Link
                        href="/settings"
                        className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200 ${
                            pathname.startsWith("/settings") ? "bg-surface text-text-primary" : "text-text-secondary hover:bg-surface hover:text-text-primary"
                        }`}
                    >
                        <Settings size={17} className={pathname.startsWith("/settings") ? "text-signal" : "text-text-secondary group-hover:text-text-primary"} />
                        {!collapsed && <span>Settings</span>}
                    </Link>

                    <Link
                        href="/system-health"
                        className={`mt-1 group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200 ${
                            pathname.startsWith("/system-health") ? "bg-surface text-text-primary" : "text-text-secondary hover:bg-surface hover:text-text-primary"
                        }`}
                    >
                        <Activity size={17} className={pathname.startsWith("/system-health") ? "text-signal" : "text-text-secondary group-hover:text-text-primary"} />
                        {!collapsed && <span>System Health</span>}
                    </Link>
                </div>

                {/* Status */}
                {!collapsed && (
                    <div className="border-t border-border px-5 py-3">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-safe" />
                            <span className="font-mono text-[9px] uppercase tracking-wider text-text-secondary">
                                System Operational
                            </span>
                        </div>
                    </div>
                )}
            </motion.aside>
        </>
    );
}