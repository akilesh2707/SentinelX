"use client";

import {
    Bell,
    ChevronDown,
    Menu,
    Search,
    LogOut,
} from "lucide-react";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

type TopbarProps = {
    collapsed: boolean;
    onToggleSidebar: () => void;
    onOpenMobile: () => void;
};

export function Topbar({
    collapsed,
    onToggleSidebar,
    onOpenMobile,
}: TopbarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const getPageTitle = (path: string) => {
        if (path === "/") return "Overview";
        if (path.startsWith("/assessments")) return "Assessments";
        if (path.startsWith("/questions")) return "Question Bank";
        if (path.startsWith("/events")) return "Events";
        if (path.startsWith("/proctoring")) return "Live Proctoring";
        if (path.startsWith("/incidents")) return "Incidents";
        if (path.startsWith("/candidates")) return "Candidates";
        if (path.startsWith("/results")) return "Results";
        if (path.startsWith("/reports")) return "Reports";
        if (path.startsWith("/settings")) return "Settings";
        if (path.startsWith("/system-health")) return "System Health";
        if (path.startsWith("/profile")) return "Profile";
        return "Overview";
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-light bg-paper/95 px-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
                {/* Desktop sidebar toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="hidden rounded-md p-2 text-text-dark/60 transition hover:bg-paper-soft hover:text-text-dark lg:block"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={19} />
                </button>

                {/* Mobile menu */}
                <button
                    onClick={onOpenMobile}
                    className="rounded-md p-2 text-text-dark/60 transition hover:bg-paper-soft lg:hidden"
                    aria-label="Open navigation"
                >
                    <Menu size={20} />
                </button>

                <div className="hidden h-5 w-px bg-border-light sm:block" />

                <div>
                    <p className="text-xs font-medium text-text-dark/50">
                        Organizer Workspace
                    </p>
                    <p className="text-sm font-semibold text-text-dark">
                        {getPageTitle(pathname)}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Search */}
                <button
                    className="hidden items-center gap-2 rounded-md border border-border-light bg-paper px-3 py-2 text-text-dark/50 transition hover:border-text-dark/20 hover:text-text-dark sm:flex"
                >
                    <Search size={16} />
                    <span className="text-xs">Search</span>
                    <kbd className="ml-3 rounded border border-border-light px-1.5 py-0.5 font-mono text-[9px]">
                        ⌘ K
                    </kbd>
                </button>

                {/* Notifications */}
                <button
                    className="relative rounded-md p-2 text-text-dark/60 transition hover:bg-paper-soft hover:text-text-dark"
                    aria-label="Notifications"
                >
                    <Bell size={18} />

                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-signal" />
                </button>

                <div className="ml-1 h-7 w-px bg-border-light" />

                {/* User */}
                <Link href="/profile" className="flex items-center gap-2 rounded-md p-1.5 transition hover:bg-paper-soft">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-graphite text-xs font-semibold text-paper">
                        {session?.user?.name?.charAt(0).toUpperCase() || "O"}
                    </div>

                    <div className="hidden text-left md:block">
                        <p className="text-xs font-semibold text-text-dark">
                            {session?.user?.name || "Organizer"}
                        </p>
                        <p className="text-[10px] text-text-dark/50">
                            Organizer
                        </p>
                    </div>

                    <ChevronDown
                        size={14}
                        className="hidden text-text-dark/50 md:block"
                    />
                </Link>

                {/* Logout */}
                <button
                    onClick={() => signOut()}
                    className="ml-2 rounded-md p-2 text-text-dark/60 transition hover:bg-red-50 hover:text-red-500"
                    title="Sign Out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}