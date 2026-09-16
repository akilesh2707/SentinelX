"use client";

import {
    ArrowLeft,
    Check,
    Clock3,
    FileText,
    ShieldCheck,
    Users,
    Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuestionsManager } from "./components/questions-manager";

type Assessment = {
    id: string;
    title: string;
    description: string | null;
    type: string;
    mcqCount: number;
    codingCount: number;
    totalMarks: number;
    passingScore: number;
    difficulty: string;
    duration: number;
    maxAttempts: string;
    lateJoin: boolean;
    autoSubmit: boolean;
    randomizeQuestions: boolean;
    negativeMarking: boolean;
    securityLevel: string;
    identityVerification: boolean;
    primaryCamera: boolean;
    secondaryCamera: boolean;
    browserLock: boolean;
    tabDetection: boolean;
    audioMonitoring: boolean;
    aiProctoring: boolean;
    status: string;
};

export default function EditAssessmentPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("DRAFT");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("coding");
    const [mcqCount, setMcqCount] = useState(0);
    const [codingCount, setCodingCount] = useState(0);
    const [totalMarks, setTotalMarks] = useState(0);
    const [passingScore, setPassingScore] = useState(0);
    const [difficulty, setDifficulty] = useState("Medium");
    const [duration, setDuration] = useState(60);
    const [maxAttempts, setMaxAttempts] = useState("1");

    const [lateJoin, setLateJoin] = useState(true);
    const [autoSubmit, setAutoSubmit] = useState(true);
    const [randomizeQuestions, setRandomizeQuestions] = useState(true);
    const [negativeMarking, setNegativeMarking] = useState(false);

    const [securityLevel, setSecurityLevel] = useState("high");
    const [identityVerification, setIdentityVerification] = useState(true);
    const [primaryCamera, setPrimaryCamera] = useState(true);
    const [secondaryCamera, setSecondaryCamera] = useState(true);
    const [browserLock, setBrowserLock] = useState(true);
    const [tabDetection, setTabDetection] = useState(true);
    const [audioMonitoring, setAudioMonitoring] = useState(true);
    const [aiProctoring, setAiProctoring] = useState(true);

    useEffect(() => {
        async function loadAssessment() {
            try {
                const response = await fetch(`/api/assessments/${id}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.error || "Failed to load assessment"
                    );
                }

                const assessment: Assessment = data.assessment;
                
                setStatus(assessment.status);
                setTitle(assessment.title);
                setDescription(assessment.description || "");
                setType(assessment.type);
                setMcqCount(assessment.mcqCount);
                setCodingCount(assessment.codingCount);
                setTotalMarks(assessment.totalMarks);
                setPassingScore(assessment.passingScore);
                setDifficulty(assessment.difficulty);
                setDuration(assessment.duration);
                setMaxAttempts(assessment.maxAttempts);

                setLateJoin(assessment.lateJoin);
                setAutoSubmit(assessment.autoSubmit);
                setRandomizeQuestions(assessment.randomizeQuestions);
                setNegativeMarking(assessment.negativeMarking);

                setSecurityLevel(assessment.securityLevel);
                setIdentityVerification(assessment.identityVerification);
                setPrimaryCamera(assessment.primaryCamera);
                setSecondaryCamera(assessment.secondaryCamera);
                setBrowserLock(assessment.browserLock);
                setTabDetection(assessment.tabDetection);
                setAudioMonitoring(assessment.audioMonitoring);
                setAiProctoring(assessment.aiProctoring);
            } catch (error) {
                console.error(error);
                setError("Unable to load assessment.");
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            loadAssessment();
        }
    }, [id]);

    async function saveChanges() {
        try {
            setSaving(true);
            setError("");

            const response = await fetch(`/api/assessments/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    description,
                    type,
                    mcqCount,
                    codingCount,
                    totalMarks,
                    passingScore,
                    difficulty,
                    duration,
                    maxAttempts,
                    lateJoin,
                    autoSubmit,
                    randomizeQuestions,
                    negativeMarking,
                    securityLevel,
                    identityVerification,
                    primaryCamera,
                    secondaryCamera,
                    browserLock,
                    tabDetection,
                    audioMonitoring,
                    aiProctoring,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || "Failed to update assessment"
                );
            }

            router.push(`/assessments/${id}`);
        } catch (error) {
            console.error(error);
            setError("Unable to save changes.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#f5f2eb] px-7 py-10">
                <div className="mx-auto max-w-6xl rounded-xl border border-black/10 bg-[#faf8f3] p-10 text-center">
                    <p className="text-sm text-black/60">
                        Loading assessment...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f5f2eb] text-[#171a1a]">
            <header className="border-b border-black/10 bg-[#faf8f3]">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-7 py-5">
                    <button
                        onClick={() => router.push(`/assessments/${id}`)}
                        className="flex items-center gap-2 text-sm text-black/60 hover:text-black"
                    >
                        <ArrowLeft size={17} />
                        Back to Assessment
                    </button>

                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#f15b1f]">
                        EDIT ASSESSMENT
                    </span>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-7 py-10">
                <div className="mb-8">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f15b1f]">
                        SentinelX
                    </div>

                    <h1 className="mt-2 text-4xl font-bold">
                        Edit Assessment
                    </h1>

                    <p className="mt-2 text-sm text-black/50">
                        Update assessment configuration and security policies.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                    <div className="space-y-6">
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<FileText size={17} />}
                                title="Assessment Details"
                            />

                            <div className="space-y-5">
                                <Field label="Title">
                                    <input
                                        disabled={status === "PUBLISHED"}
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                        className="input disabled:opacity-50"
                                    />
                                </Field>

                                <Field label="Description">
                                    <textarea
                                        rows={5}
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        className="input resize-none"
                                    />
                                </Field>

                                <Field label="Assessment Type">
                                    <select
                                        disabled={status === "PUBLISHED"}
                                        value={type}
                                        onChange={(e) =>
                                            setType(e.target.value)
                                        }
                                        className="input disabled:opacity-50"
                                    >
                                        <option value="mcq">MCQ</option>
                                        <option value="coding">
                                            Coding
                                        </option>
                                        <option value="mixed">Mixed</option>
                                    </select>
                                </Field>
                            </div>
                        </section>
                        
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <QuestionsManager
                                assessmentId={id}
                                status={status}
                                assessmentType={type}
                                onUpdateTotals={(newMcqCount, newCodingCount, newTotalMarks) => {
                                    // In a real app we'd fetch or update optimistically.
                                    // For now, we will just reload the page or let the user see the updated fields if we hook it up.
                                    setMcqCount(newMcqCount);
                                    setCodingCount(newCodingCount);
                                    setTotalMarks(newTotalMarks);
                                }}
                            />
                        </section>

                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<Clock3 size={17} />}
                                title="Assessment Configuration"
                            />

                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="MCQ Questions">
                                    <input
                                        disabled={status === "PUBLISHED"}
                                        type="number"
                                        min="0"
                                        value={mcqCount}
                                        onChange={(e) =>
                                            setMcqCount(Number(e.target.value))
                                        }
                                        className="input disabled:opacity-50"
                                    />
                                </Field>

                                <Field label="Coding Problems">
                                    <input
                                        disabled={status === "PUBLISHED"}
                                        type="number"
                                        min="0"
                                        value={codingCount}
                                        onChange={(e) =>
                                            setCodingCount(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="input disabled:opacity-50"
                                    />
                                </Field>

                                <Field label="Total Marks">
                                    <input
                                        disabled={status === "PUBLISHED"}
                                        type="number"
                                        min="1"
                                        value={totalMarks}
                                        onChange={(e) =>
                                            setTotalMarks(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="input disabled:opacity-50"
                                    />
                                </Field>

                                <Field label="Passing Score">
                                    <input
                                        disabled={status === "PUBLISHED"}
                                        type="number"
                                        min="0"
                                        value={passingScore}
                                        onChange={(e) =>
                                            setPassingScore(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="input disabled:opacity-50"
                                    />
                                </Field>

                                <Field label="Difficulty">
                                    <select
                                        disabled={status === "PUBLISHED"}
                                        value={difficulty}
                                        onChange={(e) =>
                                            setDifficulty(e.target.value)
                                        }
                                        className="input disabled:opacity-50"
                                    >
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                        <option>Mixed</option>
                                    </select>
                                </Field>

                                <Field label="Duration">
                                    <input
                                        disabled={status === "PUBLISHED"}
                                        type="number"
                                        min="1"
                                        value={duration}
                                        onChange={(e) =>
                                            setDuration(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="input disabled:opacity-50"
                                    />
                                </Field>

                                <Field label="Max Attempts">
                                    <select
                                        disabled={status === "PUBLISHED"}
                                        value={maxAttempts}
                                        onChange={(e) =>
                                            setMaxAttempts(e.target.value)
                                        }
                                        className="input disabled:opacity-50"
                                    >
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>Unlimited</option>
                                    </select>
                                </Field>
                            </div>
                        </section>

                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<Zap size={17} />}
                                title="Assessment Behaviour"
                            />

                            <div className="grid gap-3 md:grid-cols-2">
                                <Toggle
                                    title="Allow Late Join"
                                    enabled={lateJoin}
                                    onClick={() => setLateJoin(!lateJoin)}
                                />

                                <Toggle
                                    title="Auto Submit"
                                    enabled={autoSubmit}
                                    disabled={status === "PUBLISHED"}
                                    onClick={() =>
                                        setAutoSubmit(!autoSubmit)
                                    }
                                />

                                <Toggle
                                    title="Randomize Questions"
                                    enabled={randomizeQuestions}
                                    disabled={status === "PUBLISHED"}
                                    onClick={() =>
                                        setRandomizeQuestions(
                                            !randomizeQuestions
                                        )
                                    }
                                />

                                <Toggle
                                    title="Negative Marking"
                                    enabled={negativeMarking}
                                    disabled={status === "PUBLISHED"}
                                    onClick={() =>
                                        setNegativeMarking(
                                            !negativeMarking
                                        )
                                    }
                                />
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-6">
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<ShieldCheck size={17} />}
                                title="Security"
                            />

                            <Field label="Security Level">
                                <select
                                    disabled={status === "PUBLISHED"}
                                    value={securityLevel}
                                    onChange={(e) =>
                                        setSecurityLevel(e.target.value)
                                    }
                                    className="input disabled:opacity-50"
                                >
                                    <option value="standard">
                                        Standard
                                    </option>
                                    <option value="high">
                                        High Security
                                    </option>
                                    <option value="strict">
                                        Strict
                                    </option>
                                </select>
                            </Field>

                            <div className="mt-5 space-y-3">
                                <Toggle
                                    title="Identity Verification"
                                    enabled={identityVerification}
                                    disabled={status === "PUBLISHED"}
                                    onClick={() =>
                                        setIdentityVerification(
                                            !identityVerification
                                        )
                                    }
                                />

                                <Toggle
                                    title="Primary Camera"
                                    enabled={primaryCamera}
                                    disabled={status === "PUBLISHED"}
                                    onClick={() =>
                                        setPrimaryCamera(!primaryCamera)
                                    }
                                />

                                <Toggle
                                    title="Secondary Camera"
                                    enabled={secondaryCamera}
                                    disabled={status === "PUBLISHED"}
                                    onClick={() =>
                                        setSecondaryCamera(
                                            !secondaryCamera
                                        )
                                    }
                                />

                                <Toggle
                                    title="Browser Lock"
                                    enabled={browserLock}
                                    disabled={status === "PUBLISHED"}
                                    onClick={() =>
                                        setBrowserLock(!browserLock)
                                    }
                                />

                                <Toggle
                                    title="Tab Detection"
                                    enabled={tabDetection}
                                    disabled={status === "PUBLISHED"}
                                    onClick={() =>
                                        setTabDetection(!tabDetection)
                                    }
                                />

                                <Toggle
                                    title="Audio Monitoring"
                                    enabled={audioMonitoring}
                                    disabled={status === "PUBLISHED"}
                                    onClick={() =>
                                        setAudioMonitoring(
                                            !audioMonitoring
                                        )
                                    }
                                />

                                <Toggle
                                    title="AI Proctoring"
                                    enabled={aiProctoring}
                                    disabled={status === "PUBLISHED"}
                                    onClick={() =>
                                        setAiProctoring(!aiProctoring)
                                    }
                                />
                            </div>
                        </section>

                        <section className="rounded-xl bg-[#111616] p-6 text-white">
                            <div className="text-xs uppercase tracking-widest text-white/40">
                                Assessment
                            </div>

                            <h2 className="mt-2 text-lg font-semibold">
                                {title || "Untitled Assessment"}
                            </h2>

                            <div className="mt-5 space-y-3 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-white/40">
                                        Questions
                                    </span>
                                    <span>
                                        {mcqCount + codingCount}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-white/40">
                                        Marks
                                    </span>
                                    <span>{totalMarks}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-white/40">
                                        Duration
                                    </span>
                                    <span>{duration} min</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-white/40">
                                        Security
                                    </span>
                                    <span>{securityLevel}</span>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>

                <div className="mt-8 flex justify-between">
                    <button
                        onClick={() => router.push(`/assessments/${id}`)}
                        className="rounded-lg border border-black/15 bg-white px-5 py-2.5 text-sm font-medium"
                    >
                        <ArrowLeft className="mr-2 inline" size={15} />
                        Cancel
                    </button>

                    <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="rounded-lg bg-[#f15b1f] px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? (
                            "Saving..."
                        ) : (
                            <>
                                <Check
                                    className="mr-2 inline"
                                    size={15}
                                />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </main>
    );
}

function SectionHeader({
    icon,
    title,
}: {
    icon: React.ReactNode;
    title: string;
}) {
    return (
        <div className="mb-5 flex items-center gap-2 border-b border-black/10 pb-4">
            <span className="text-[#f15b1f]">{icon}</span>
            <h2 className="text-sm font-bold uppercase tracking-wider">
                {title}
            </h2>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-black/45">
                {label}
            </label>
            {children}
        </div>
    );
}

function Toggle({
    title,
    enabled,
    disabled,
    onClick,
}: {
    title: string;
    enabled: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex w-full items-center justify-between rounded-lg border border-black/10 bg-white p-4 text-left ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <span className="text-sm font-medium">{title}</span>

            <span
                className={[
                    "relative h-5 w-9 rounded-full",
                    enabled ? "bg-[#f15b1f]" : "bg-black/15",
                ].join(" ")}
            >
                <span
                    className={[
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white",
                        enabled ? "left-[18px]" : "left-0.5",
                    ].join(" ")}
                />
            </span>
        </button>
    );
}