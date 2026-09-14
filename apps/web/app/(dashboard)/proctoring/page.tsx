import { ShieldCheck, MonitorPlay, Eye, AppWindow, Video, Mic, FileWarning } from "lucide-react";

export default function ProctoringPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-[#171a1b]">Live Proctoring</h1>
                    <span className="bg-signal/10 text-signal border border-signal/20 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-widest uppercase">Coming Soon</span>
                </div>
                <p className="text-[#737777]">SentinelX Proctoring is the upcoming active monitoring subsystem.</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm p-8 md:p-12 text-center max-w-4xl mx-auto mt-12">
                <div className="mx-auto w-16 h-16 bg-[#fbfaf6] border-2 border-dashed border-[#dedbd2] rounded-xl flex items-center justify-center text-[#737777] mb-6">
                    <MonitorPlay size={32} />
                </div>
                <h2 className="text-2xl font-bold text-[#171a1b] mb-4">Intelligent Proctoring Engine</h2>
                <p className="text-[#555955] max-w-2xl mx-auto mb-10 leading-relaxed">
                    The proctoring subsystem will provide zero-trust monitoring during candidate attempts.
                    It is currently under active development. Below is a preview of the planned capabilities.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                    {[
                        { title: "Camera Monitoring", icon: Video, desc: "Continuous visual tracking of candidate presence." },
                        { title: "Audio Monitoring", icon: Mic, desc: "Ambient noise and speech detection." },
                        { title: "Tab/Window Detection", icon: AppWindow, desc: "Tracking focus and unauthorized window changes." },
                        { title: "Identity Verification", icon: ShieldCheck, desc: "Face matching and identity assurance." },
                        { title: "AI Event Detection", icon: Eye, desc: "Automated flagging of suspicious behaviors." },
                        { title: "Real-time Incidents", icon: FileWarning, desc: "Live incident stream for organizers." }
                    ].map((feature, i) => (
                        <div key={i} className="p-5 rounded-xl border border-[#dedbd2] bg-[#fbfaf6] hover:bg-white transition-colors">
                            <feature.icon size={20} className="text-[#737777] mb-3" />
                            <h3 className="font-semibold text-[#171a1b] text-sm mb-1">{feature.title}</h3>
                            <p className="text-xs text-[#737777]">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
