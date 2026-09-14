"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    ShieldCheck, Code2, Database, Lock, Clock, Settings, UserCheck,
    FileText, Calendar, Box, Terminal, Server, Key, Users, CheckCircle2,
    ChevronRight
} from "lucide-react";

export default function LandingPage({ isOrganizer }: { isOrganizer: boolean }) {
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <div className="min-h-screen bg-carbon text-text-primary selection:bg-signal selection:text-white overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-carbon/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 text-signal font-bold text-xl tracking-tight">
                            <ShieldCheck size={24} />
                            SentinelX
                        </div>
                        <div className="hidden md:flex gap-6 text-sm text-text-secondary font-medium">
                            <a href="#platform" className="hover:text-text-primary transition-colors">Platform</a>
                            <a href="#workflow" className="hover:text-text-primary transition-colors">How it works</a>
                            <a href="#security" className="hover:text-text-primary transition-colors">Security</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                        {isOrganizer ? (
                            <Link href="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
                                Open Dashboard
                            </Link>
                        ) : (
                            <Link href="/login" className="text-text-secondary hover:text-text-primary transition-colors">
                                Sign In
                            </Link>
                        )}
                        <Link href="/join" className="bg-signal hover:bg-signal-dark text-white px-4 py-2 rounded-lg transition-colors hidden sm:block">
                            Join Assessment
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center mt-12 md:mt-24">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl space-y-8">
                    <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-mono text-text-secondary mb-4">
                        <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
                        Platform v0.1.0 Active
                    </motion.div>

                    <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                        Secure assessments. <br/>
                        <span className="text-text-secondary">Intelligent evaluation.</span>
                    </motion.h1>

                    <motion.p variants={fadeIn} className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                        SentinelX is a secure assessment and examination platform for institutions. Built for rigorous evaluations, coding tests, and structured attempt management.
                    </motion.p>

                    <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link href={isOrganizer ? "/dashboard" : "/login"} className="w-full sm:w-auto bg-white text-carbon hover:bg-paper-soft font-semibold px-8 py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                            Create Assessment
                            <ChevronRight size={18} />
                        </Link>
                        <Link href="/join" className="w-full sm:w-auto bg-surface border border-border hover:bg-border/50 text-text-primary font-medium px-8 py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                            Join Assessment
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* Product Capabilities */}
            <section id="platform" className="py-24 px-6 bg-graphite border-y border-border">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Platform Capabilities</h2>
                        <p className="text-text-secondary max-w-2xl">A comprehensive suite of tools for running secure technical evaluations at scale.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: "Assessment Management", icon: Settings },
                            { title: "Question Bank", icon: Database },
                            { title: "MCQ Evaluation", icon: CheckCircle2 },
                            { title: "Coding Evaluation", icon: Terminal },
                            { title: "Sandboxed Code Execution", icon: Box },
                            { title: "Candidate Management", icon: Users },
                            { title: "Results & Reports", icon: FileText },
                            { title: "Event Management", icon: Calendar },
                        ].map((feature, i) => (
                            <div key={i} className="p-6 rounded-xl bg-surface border border-border hover:border-border-light transition-colors">
                                <feature.icon size={24} className="text-signal mb-4" />
                                <h3 className="font-semibold text-text-primary">{feature.title}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Coming Soon */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-xl bg-surface/50 border border-border border-dashed flex items-center gap-4 opacity-70">
                            <UserCheck size={24} className="text-text-secondary" />
                            <div>
                                <h3 className="font-semibold text-text-secondary flex items-center gap-2">
                                    AI Proctoring
                                    <span className="text-[10px] uppercase tracking-wider font-mono bg-border px-2 py-0.5 rounded">Roadmap</span>
                                </h3>
                                <p className="text-sm text-text-secondary mt-1">Intelligent monitoring during exams</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-xl bg-surface/50 border border-border border-dashed flex items-center gap-4 opacity-70">
                            <ShieldCheck size={24} className="text-text-secondary" />
                            <div>
                                <h3 className="font-semibold text-text-secondary flex items-center gap-2">
                                    Real-time Incident Detection
                                    <span className="text-[10px] uppercase tracking-wider font-mono bg-border px-2 py-0.5 rounded">Roadmap</span>
                                </h3>
                                <p className="text-sm text-text-secondary mt-1">Automated flagging of suspicious behavior</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="workflow" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Assessment Workflow</h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">From creation to final analysis in a seamless, secure pipeline.</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch justify-between relative max-w-4xl mx-auto">
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2 z-0" />

                    {[
                        { step: "CREATE", desc: "Configure assessment" },
                        { step: "INVITE", desc: "Share access code" },
                        { step: "ASSESS", desc: "Secure attempt session" },
                        { step: "EVALUATE", desc: "MCQ & sandboxed coding" },
                        { step: "ANALYZE", desc: "Results & reports" }
                    ].map((item, i) => (
                        <div key={i} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 py-4 md:py-0 w-full md:w-auto">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface border-2 border-border flex items-center justify-center font-mono text-sm font-bold text-signal">
                                0{i + 1}
                            </div>
                            <div className="text-left md:text-center w-full">
                                <h4 className="font-bold text-sm tracking-widest text-text-primary mb-1">{item.step}</h4>
                                <p className="text-xs text-text-secondary font-medium">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Security Architecture */}
            <section id="security" className="py-24 px-6 bg-graphite border-t border-border">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16 md:w-1/2">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Security Architecture</h2>
                        <p className="text-text-secondary">Designed with zero-trust principles. SentinelX enforces strict boundaries between organizers, candidates, and execution environments.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
                        {[
                            { title: "Organizer Authentication", desc: "Stateful session management with encrypted credentials." },
                            { title: "Attempt-Bound Sessions", desc: "Candidate access is strictly tied to explicit, verified assessment attempts." },
                            { title: "HttpOnly Candidate Sessions", desc: "Stateless JWT tokens secured against client-side access." },
                            { title: "Server-Side Authorization", desc: "Every action is evaluated against the source of truth, not client state." },
                            { title: "Sandboxed Execution", desc: "Candidate code runs in isolated, restricted containers with zero network access." },
                            { title: "Hidden Test Cases", desc: "Evaluation data never touches the candidate's device." },
                            { title: "Server-Authoritative Timers", desc: "Expiration constraints are enforced immutably on the server." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <Lock size={20} className="text-signal shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-semibold text-text-primary mb-2 font-mono text-sm">{item.title}</h4>
                                    <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Technical Stack */}
            <section className="py-12 border-t border-border">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-xs font-mono text-text-secondary uppercase tracking-widest mb-6">Powered By</p>
                    <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-text-secondary">
                        <span className="px-4 py-2 rounded bg-surface border border-border">Next.js</span>
                        <span className="px-4 py-2 rounded bg-surface border border-border">PostgreSQL</span>
                        <span className="px-4 py-2 rounded bg-surface border border-border">Prisma</span>
                        <span className="px-4 py-2 rounded bg-surface border border-border">Auth.js & JWT</span>
                        <span className="px-4 py-2 rounded bg-surface border border-border">Docker Sandbox</span>
                        <span className="px-4 py-2 rounded bg-surface border border-border">Python Execution</span>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold tracking-tight mb-8">Ready to run a secure assessment?</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href={isOrganizer ? "/dashboard" : "/login"} className="w-full sm:w-auto bg-signal hover:bg-signal-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors">
                            Create Assessment
                        </Link>
                        <Link href="/join" className="w-full sm:w-auto bg-surface border border-border hover:bg-border/50 text-text-primary font-medium px-8 py-3 rounded-lg transition-colors">
                            Join Assessment
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-border text-center text-sm text-text-secondary">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 font-bold text-text-primary">
                        <ShieldCheck size={18} className="text-signal" />
                        SentinelX
                    </div>
                    <div>&copy; {new Date().getFullYear()} SentinelX. All rights reserved.</div>
                </div>
            </footer>
        </div>
    );
}
