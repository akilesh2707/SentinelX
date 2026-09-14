"use client";

import { Settings, Shield, Building2, Sliders, Lock, Bell, AlertCircle } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-[#171a1b] flex items-center gap-3">
                        <Settings className="text-[#303433]" /> Platform Settings
                    </h1>
                </div>
                <p className="text-[#737777]">Configure your organizer workspace and assessment defaults.</p>
            </div>

            <div className="bg-signal/10 text-signal p-4 rounded-xl border border-signal/20 text-sm flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div>
                    <strong>Configuration Upcoming:</strong> Settings persistence is currently disabled.
                    These options act as a structural UI shell and will be activated in a future update.
                </div>
            </div>

            <div className="space-y-6">
                {/* Organization */}
                <section className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden opacity-75">
                    <div className="p-5 border-b border-[#dedbd2] bg-[#fbfaf6] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="text-[#303433]" size={18} />
                            <h2 className="text-lg font-bold text-[#171a1b]">Organization</h2>
                        </div>
                        <span className="bg-[#dedbd2]/50 text-[#737777] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Coming Soon</span>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-[#737777] uppercase tracking-wider mb-1.5">Institution Name</label>
                                <input type="text" defaultValue="SentinelX Global" disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#737777] uppercase tracking-wider mb-1.5">Contact Email</label>
                                <input type="email" defaultValue="admin@sentinelx.dev" disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#737777] uppercase tracking-wider mb-1.5">Timezone</label>
                                <select defaultValue="UTC" disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed">
                                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                                    <option value="EST">EST (Eastern Standard Time)</option>
                                    <option value="PST">PST (Pacific Standard Time)</option>
                                    <option value="IST">IST (Indian Standard Time)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Assessment Defaults */}
                <section className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden opacity-75">
                    <div className="p-5 border-b border-[#dedbd2] bg-[#fbfaf6] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sliders className="text-[#303433]" size={18} />
                            <h2 className="text-lg font-bold text-[#171a1b]">Assessment Defaults</h2>
                        </div>
                        <span className="bg-[#dedbd2]/50 text-[#737777] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Coming Soon</span>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-[#737777] uppercase tracking-wider mb-1.5">Default Duration</label>
                                <div className="relative">
                                    <input type="number" defaultValue={60} disabled className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#737777]">min</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#737777] uppercase tracking-wider mb-1.5">Default Difficulty</label>
                                <select defaultValue="MEDIUM" disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed">
                                    <option value="EASY">EASY</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="HARD">HARD</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#737777] uppercase tracking-wider mb-1.5">Default Security</label>
                                <select defaultValue="HIGH" disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed">
                                    <option value="LOW">LOW</option>
                                    <option value="MODERATE">MODERATE</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="STRICT">STRICT</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security Preferences */}
                <section className="bg-[#171a1b] rounded-2xl border border-[#303433] shadow-sm overflow-hidden text-white opacity-90">
                    <div className="p-5 border-b border-[#303433] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock className="text-[#a0a19b]" size={18} />
                            <h2 className="text-lg font-bold">Security Preferences</h2>
                        </div>
                        <span className="bg-[#303433] text-[#a0a19b] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Coming Soon</span>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                            <Toggle label="Identity Verification" description="Require face scan before exam entry" defaultChecked={true} disabled />
                            <Toggle label="Browser Lock" description="Prevent exiting fullscreen mode" defaultChecked={true} disabled />
                            <Toggle label="Tab Detection" description="Track when candidates switch browser tabs" defaultChecked={true} disabled />
                            <Toggle label="Audio Monitoring" description="Record background noise during assessment" defaultChecked={false} disabled />
                            <Toggle label="AI Proctoring" description="Enable automated gaze and anomaly detection" defaultChecked={true} disabled />
                        </div>
                    </div>
                </section>

                {/* System Preferences */}
                <section className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm overflow-hidden opacity-75">
                    <div className="p-5 border-b border-[#dedbd2] bg-[#fbfaf6] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="text-[#303433]" size={18} />
                            <h2 className="text-lg font-bold text-[#171a1b]">System Preferences</h2>
                        </div>
                        <span className="bg-[#dedbd2]/50 text-[#737777] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Coming Soon</span>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <Toggle light label="Email Notifications" description="Receive daily platform summaries" defaultChecked={true} disabled />
                            <Toggle light label="Compact Interface" description="Reduce padding across table layouts" defaultChecked={false} disabled />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button disabled className="bg-[#171a1b] text-white px-6 py-2.5 rounded-xl font-medium shadow-sm opacity-50 cursor-not-allowed">
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
}

function Toggle({ label, description, defaultChecked, light = false, disabled = false }: { label: string, description: string, defaultChecked: boolean, light?: boolean, disabled?: boolean }) {
    return (
        <div className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-70' : ''}`}>
            <div>
                <div className={`font-semibold text-sm ${light ? 'text-[#171a1b]' : 'text-white'}`}>{label}</div>
                <div className={`text-xs mt-1 ${light ? 'text-[#737777]' : 'text-[#a0a19b]'}`}>{description}</div>
            </div>
            <label className={`relative inline-flex items-center shrink-0 mt-1 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="checkbox" defaultChecked={defaultChecked} disabled={disabled} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
        </div>
    );
}
