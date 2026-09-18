"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function JoinPage({ initialAccessCode = "" }: { initialAccessCode?: string }) {
    const router = useRouter();

    const [accessCode, setAccessCode] = useState(initialAccessCode);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!accessCode.trim() || !name.trim() || !email.trim()) {
            setError("All fields are required.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/attempts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accessCode: accessCode.trim(),
                    name: name.trim(),
                    email: email.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to join assessment");
            }

            if (data.success && data.attempt?.id) {
                router.push(`/exam/${data.attempt.id}`);
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
            setLoading(false);
        }
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
                        <p className="mt-1 text-sm text-[#737777]">Enter your details and access code to begin.</p>
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
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="name" className="block text-sm font-medium text-[#303433]">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-[#dedbd2] bg-white px-4 py-2.5 text-[#171a1b] placeholder:text-[#a0a19b] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
                                placeholder="Jane Doe"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-[#303433]">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-[#dedbd2] bg-white px-4 py-2.5 text-[#171a1b] placeholder:text-[#a0a19b] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
                                placeholder="jane@example.com"
                                disabled={loading}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#171a1b] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#303433] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <span>Continue to Assessment</span>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
