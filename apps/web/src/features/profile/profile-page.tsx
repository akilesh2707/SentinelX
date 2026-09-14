"use client";

import { User, Mail, Shield, ShieldCheck, Clock, Activity, Calendar, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function ProfilePage() {
    const { data: session } = useSession();

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#171a1b] mb-2 flex items-center gap-3">
                        <User className="text-[#303433]" /> Organizer Profile
                    </h1>
                    <p className="text-[#737777]">Manage your personal account and organizer identity.</p>
                </div>
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 bg-white border border-[#dedbd2] px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden">
                <div className="bg-[#171a1b] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#737777]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-graphite border-4 border-[#303433] flex items-center justify-center text-3xl font-bold">
                            {session?.user?.name?.charAt(0).toUpperCase() || "O"}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-1">{session?.user?.name || "Organizer"}</h2>
                            <div className="flex items-center gap-4 text-sm text-[#a0a19b]">
                                <span className="flex items-center gap-1.5"><Mail size={14} /> {session?.user?.email || "No email"}</span>
                                <span className="flex items-center gap-1.5 bg-[#303433] px-2.5 py-0.5 rounded-full text-white text-xs font-semibold tracking-wide uppercase"><ShieldCheck size={12} /> Organizer</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <section>
                        <h3 className="text-lg font-bold text-[#171a1b] mb-4 border-b border-[#dedbd2] pb-2">Personal Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-[#737777] uppercase tracking-wider mb-1.5">Full Name</label>
                                <input type="text" defaultValue={session?.user?.name || ""} disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#737777] uppercase tracking-wider mb-1.5">Email Address</label>
                                <input type="email" defaultValue={session?.user?.email || ""} disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-[#171a1b] mb-4 border-b border-[#dedbd2] pb-2">Account Activity</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-[#fbfaf6] border border-[#dedbd2] rounded-xl flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-[#dedbd2]"><Clock className="text-[#303433]" size={18} /></div>
                                <div>
                                    <div className="text-xs text-[#737777] font-semibold uppercase tracking-wider">Member Since</div>
                                    <div className="font-bold text-[#171a1b] text-sm mt-0.5">Authenticated</div>
                                </div>
                            </div>
                            <div className="p-4 bg-[#fbfaf6] border border-[#dedbd2] rounded-xl flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-[#dedbd2]"><Activity className="text-emerald-600" size={18} /></div>
                                <div>
                                    <div className="text-xs text-[#737777] font-semibold uppercase tracking-wider">Status</div>
                                    <div className="font-bold text-[#171a1b] text-sm mt-0.5">Active Session</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
