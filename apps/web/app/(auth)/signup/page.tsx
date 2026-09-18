"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, confirmPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Signup failed.");
            } else {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }
        } catch (err) {
            setError("An unexpected network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border-light p-8 text-center space-y-4">
                    <div className="flex justify-center text-emerald-500 mb-2">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-xl font-bold text-carbon">Registration Successful</h2>
                    <p className="text-sm text-carbon/70">Your organizer account has been created. Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border-light p-8">

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal text-carbon mb-4">
                        <ShieldAlert size={24} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-carbon">Create Account</h1>
                    <p className="text-sm text-carbon/70 mt-1">Register for SentinelX Organizer Access</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-start gap-3 text-sm">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-carbon/70 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-carbon focus:outline-none focus:border-carbon transition-colors"
                        />
                    </div>

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
                            minLength={8}
                            autoComplete="new-password"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-carbon focus:outline-none focus:border-carbon transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-carbon/70 uppercase tracking-wider mb-1.5">Confirm Password</label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-carbon focus:outline-none focus:border-carbon transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-carbon hover:bg-carbon/90 text-white font-medium py-2.5 rounded-lg transition-colors mt-2 disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-carbon/70">
                    Already have an account? <Link href="/login" className="text-carbon font-semibold hover:underline">Sign in here</Link>
                </div>
            </div>
        </div>
    );
}
