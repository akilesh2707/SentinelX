"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type AppShellProps = {
    children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-paper text-text-dark">
            <Sidebar
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div
                className={`
          min-h-screen transition-[padding] duration-300
          ${collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]"}
        `}
            >
                <Topbar
                    collapsed={collapsed}
                    onToggleSidebar={() => setCollapsed((value) => !value)}
                    onOpenMobile={() => setMobileOpen(true)}
                />

                <main className="min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </div>
        </div>
    );
}