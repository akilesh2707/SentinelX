"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function JoinAccessCodePage() {
    const router = useRouter();

    const [accessCode, setAccessCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedCode = accessCode.trim();

        if (!trimmedCode) {
            setError("Please enter an access code.");
            return;
        }

        router.push(`/join/${encodeURIComponent(trimmedCode)}`);
    };

    return (
        <div className="min-h-screen bg-[#171a1b] flex flex-col items-center justify-center p-5 text-[#fbfaf6]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 flex items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-[#171a1b]">
                        <ShieldCheck size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">SentinelX</h1>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a0a19b]">Secure Assessment</p>
                    </div>
                </div>

                <div className="bg-[#fbfaf6] rounded-2xl p-8 shadow-xl text-[#171a1b]">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold tracking-tight text-[#171a1b]">Join Assessment</h2>
                        <p className="mt-1 text-sm text-[#737777]">Enter your assessment access code to begin.</p>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-800 border border-red-100">
                            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="accessCode" className="block text-sm font-medium text-[#303433]">
                                Access Code
                            </label>
                            <input
                                id="accessCode"
                                type="text"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                className="w-full rounded-lg border border-[#dedbd2] bg-white px-4 py-2.5 text-[#171a1b] placeholder:text-[#a0a19b] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors uppercase font-mono"
                                placeholder="e.g. ABC123"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#171a1b] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#303433]"
                        >
                            <span>Continue</span>
                            <ArrowRight size={18} />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
