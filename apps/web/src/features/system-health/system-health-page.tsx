"use client";

import { useState, useEffect } from "react";
import { Activity, Server, Database, Code, Box, Terminal, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

type ServiceStatus = {
    status: string;
    message: string;
    latencyMs?: number;
    details?: any;
};

type SystemHealthData = {
    overallStatus: string;
    checkedAt: string;
    services: {
        application: ServiceStatus;
        database: ServiceStatus;
        prisma: ServiceStatus;
        docker: ServiceStatus;
        runtime: ServiceStatus;
    };
};

export default function SystemHealthPage() {
    const [health, setHealth] = useState<SystemHealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    useEffect(() => {
        fetchHealth();
    }, []);

    const fetchHealth = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/system-health");
            const data = await res.json();

            if (data.overallStatus) {
                setHealth(data);
                setLastRefresh(new Date());
            } else {
                setError("Invalid payload received from health check");
            }
        } catch (err) {
            setError("Network error fetching system health");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "HEALTHY": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            case "DEGRADED": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            case "ERROR": return "text-red-500 bg-red-500/10 border-red-500/20";
            case "OFFLINE": return "text-gray-500 bg-gray-500/10 border-gray-500/20";
            default: return "text-gray-500 bg-gray-100 border-gray-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "HEALTHY": return <CheckCircle2 size={16} className="text-emerald-500" />;
            case "DEGRADED": return <AlertCircle size={16} className="text-amber-500" />;
            case "ERROR": return <AlertCircle size={16} className="text-red-500" />;
            case "OFFLINE": return <AlertCircle size={16} className="text-gray-500" />;
            default: return <Activity size={16} className="text-gray-500" />;
        }
    };

    if (error) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={24} />
                        <span className="font-medium text-lg">{error}</span>
                    </div>
                    <button
                        onClick={fetchHealth}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-sm font-medium text-[#171a1b] hover:bg-gray-50 border border-red-200 transition-colors"
                    >
                        <RefreshCw size={16} /> Retry Check
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#171a1b] mb-2 flex items-center gap-3">
                        <Activity className="text-[#303433]" /> System Health
                    </h1>
                    <p className="text-[#737777]">Live diagnostic console for SentinelX core dependencies.</p>
                </div>

                <button
                    onClick={fetchHealth}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-[#171a1b] hover:bg-[#303433] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    {loading ? "Checking..." : "Check Again"}
                </button>
            </div>

            {loading && !health ? (
                <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
                    <div className="w-8 h-8 border-2 border-[#303433] border-t-transparent rounded-full animate-spin" />
                    <div className="text-[#737777]">Running diagnostic checks...</div>
                </div>
            ) : health ? (
                <div className="space-y-6">
                    {/* Overall Status Banner */}
                    <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                        <div className="bg-[#171a1b] p-8 text-white relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">

                            {/* Decorative background glow based on status */}
                            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${
                                health.overallStatus === "HEALTHY" ? "bg-emerald-500/20" :
                                health.overallStatus === "DEGRADED" ? "bg-amber-500/20" :
                                "bg-red-500/20"
                            }`} />

                            <div className="relative z-10">
                                <div className="text-[#a0a19b] font-semibold text-sm mb-2 uppercase tracking-wider">Overall System Status</div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border ${getStatusColor(health.overallStatus).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                        {getStatusIcon(health.overallStatus)} {health.overallStatus}
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-10 text-right">
                                <div className="text-[#a0a19b] font-semibold text-sm mb-1">Last Checked At</div>
                                <div className="text-white font-mono text-lg">{lastRefresh?.toLocaleTimeString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Services Matrix */}
                    <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-[#dedbd2] bg-[#fbfaf6]">
                            <h2 className="text-lg font-bold text-[#171a1b]">Core Dependencies</h2>
                        </div>
                        <div className="divide-y divide-[#dedbd2]">
                            {/* App */}
                            <ServiceRow
                                icon={<Server size={20} className="text-[#303433]" />}
                                name="Application API"
                                service={health.services.application}
                            />
                            {/* DB */}
                            <ServiceRow
                                icon={<Database size={20} className="text-[#303433]" />}
                                name="PostgreSQL Database"
                                service={health.services.database}
                            />
                            {/* Prisma */}
                            <ServiceRow
                                icon={<Code size={20} className="text-[#303433]" />}
                                name="Prisma ORM Client"
                                service={health.services.prisma}
                            />
                            {/* Docker */}
                            <ServiceRow
                                icon={<Box size={20} className="text-[#303433]" />}
                                name="Docker Execution Engine"
                                service={health.services.docker}
                            />
                        </div>
                    </div>

                    {/* Runtime Environment Info */}
                    <div className="bg-[#171a1b] rounded-2xl border border-[#303433] shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-[#303433] flex items-center gap-2">
                            <Terminal size={18} className="text-[#737777]" />
                            <h2 className="text-sm font-bold text-white">Runtime Environment</h2>
                        </div>
                        <div className="p-6 font-mono text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#a0a19b]">
                                <div><span className="text-[#737777]">OS Platform:</span> {health.services.runtime.details?.platform}</div>
                                <div><span className="text-[#737777]">Architecture:</span> {health.services.runtime.details?.architecture}</div>
                                <div><span className="text-[#737777]">Node Version:</span> {health.services.runtime.details?.nodeVersion}</div>
                                <div><span className="text-[#737777]">CPU Cores:</span> {health.services.runtime.details?.cpuCount}</div>
                                <div><span className="text-[#737777]">Memory Heap:</span> {health.services.runtime.details?.memoryUsageMB} MB</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );

    function ServiceRow({ icon, name, service }: { icon: React.ReactNode, name: string, service: ServiceStatus }) {
        return (
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fbfaf6] transition-colors">
                <div className="flex items-start sm:items-center gap-4">
                    <div className="p-3 bg-[#fbfaf6] border border-[#dedbd2] rounded-xl">
                        {icon}
                    </div>
                    <div>
                        <div className="font-bold text-[#171a1b]">{name}</div>
                        <div className="text-sm text-[#737777] mt-1">{service.message}</div>
                    </div>
                </div>
                <div className="flex items-center gap-6 sm:justify-end">
                    {service.latencyMs !== undefined && (
                        <div className="text-sm font-mono text-[#737777]">
                            {service.latencyMs}ms
                        </div>
                    )}
                    <div className={`w-28 text-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${getStatusColor(service.status)}`}>
                        {service.status}
                    </div>
                </div>
            </div>
        );
    }
}
