"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false
            });

            if (res?.error) {
                setError("Invalid email or password.");
            } else if (res?.ok) {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border-light p-8">

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal text-carbon mb-4">
                        <ShieldAlert size={24} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-carbon">Organizer Login</h1>
                    <p className="text-sm text-carbon/70 mt-1">Sign in to SentinelX Vigilance System</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-start gap-3 text-sm">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-carbon/70 uppercase tracking-wider mb-1.5">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-carbon focus:outline-none focus:border-carbon transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-carbon/70 uppercase tracking-wider mb-1.5">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-carbon focus:outline-none focus:border-carbon transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-carbon hover:bg-carbon/90 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-carbon/70">
                    Don't have an account? <Link href="/signup" className="text-carbon font-semibold hover:underline">Register here</Link>
                </div>
            </div>
        </div>
    );
}
