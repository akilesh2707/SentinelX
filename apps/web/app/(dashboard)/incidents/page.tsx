import { ShieldAlert, AppWindow, VideoOff, Users, Mic, UserX, Activity } from "lucide-react";

export default function IncidentsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-[#171a1b]">Security Incidents</h1>
                    <span className="bg-signal/10 text-signal border border-signal/20 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-widest uppercase">Coming Soon</span>
                </div>
                <p className="text-[#737777]">The central organizer workspace for suspicious events detected during assessments.</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#dedbd2] shadow-sm p-8 md:p-12 max-w-4xl mx-auto mt-12">
                <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 bg-[#fbfaf6] border-2 border-dashed border-[#dedbd2] rounded-xl flex items-center justify-center text-[#737777] mb-6">
                        <ShieldAlert size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#171a1b] mb-4">Unified Incident Triage</h2>
                    <p className="text-[#555955] max-w-2xl mx-auto leading-relaxed">
                        When the proctoring subsystem detects potentially unauthorized activity, it will generate actionable incident records here for your review. Below are examples of the events we plan to detect.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    {[
                        { title: "Tab or Window Switch", icon: AppWindow, desc: "Candidate moved focus away from the assessment." },
                        { title: "Camera Interruption", icon: VideoOff, desc: "Webcam feed was disconnected, covered, or lost." },
                        { title: "Multiple People Detected", icon: Users, desc: "More than one face detected in the camera frame." },
                        { title: "Suspicious Audio Event", icon: Mic, desc: "Voices or unexpected sounds detected." },
                        { title: "Identity Mismatch", icon: UserX, desc: "Face does not match the registered candidate." },
                        { title: "Abnormal Activity", icon: Activity, desc: "Anomalous keyboard/mouse usage patterns." }
                    ].map((incident, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-[#dedbd2] bg-[#fbfaf6]">
                            <div className="p-2 rounded-lg bg-white border border-[#dedbd2] shrink-0 text-[#737777]">
                                <incident.icon size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#171a1b] text-sm mb-1">{incident.title}</h3>
                                <p className="text-xs text-[#737777]">{incident.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
