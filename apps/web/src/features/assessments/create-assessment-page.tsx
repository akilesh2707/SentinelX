"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Clock3,
    Code2,
    FileText,
    Grid2X2,
    Link2,
    Lock,
    ShieldCheck,
    Users,
    Zap,
} from "lucide-react";

const steps = [
    "Details",
    "Assessment",
    "Security",
    "Preview",
    "Publish",
];

const assessmentTypes = [
    {
        id: "mcq",
        title: "MCQ",
        description: "Multiple-choice format",
        icon: FileText,
    },
    {
        id: "coding",
        title: "Coding",
        description: "Programming environment",
        icon: Code2,
    },
    {
        id: "mixed",
        title: "Mixed",
        description: "MCQ + Coding tasks",
        icon: Grid2X2,
    },
];

export default function CreateAssessmentPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [assessmentType, setAssessmentType] = useState("coding");
    const [lateJoin, setLateJoin] = useState(true);
    const [autoSubmit, setAutoSubmit] = useState(true);

    const [title, setTitle] = useState("Data Structures — Mid Semester");
    const [description, setDescription] = useState("");
    const [duration, setDuration] = useState(60);
    const [maxAttempts, setMaxAttempts] = useState("1");
    const [accessCode, setAccessCode] = useState("");
    const [joinLink, setJoinLink] = useState("");

    const [securityLevel, setSecurityLevel] = useState("high");
    const [identityVerification, setIdentityVerification] = useState(true);
    const [primaryCamera, setPrimaryCamera] = useState(true);
    const [secondaryCamera, setSecondaryCamera] = useState(true);
    const [browserLock, setBrowserLock] = useState(true);
    const [tabDetection, setTabDetection] = useState(true);
    const [audioMonitoring, setAudioMonitoring] = useState(true);
    const [aiProctoring, setAiProctoring] = useState(true);

    const [mcqCount, setMcqCount] = useState(20);
    const [codingCount, setCodingCount] = useState(2);
    const [totalMarks, setTotalMarks] = useState(100);
    const [passingScore, setPassingScore] = useState(40);
    const [difficulty, setDifficulty] = useState("Medium");
    const [randomizeQuestions, setRandomizeQuestions] = useState(true);
    const [negativeMarking, setNegativeMarking] = useState(false);

    const handlePublish = async () => {
        try {
            const response = await fetch("/api/assessments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    description,
                    type: assessmentType,

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

            if (!response.ok) {
                throw new Error(data.error || "Failed to publish assessment");
            }

            alert(
                `Assessment published successfully!\n\nAccess Code: ${data.assessment.accessCode}`
            );
            setAccessCode(data.assessment.accessCode);
            setJoinLink(data.assessment.joinLink);
            router.push("/assessments");
            console.log("Published assessment:", data.assessment);
        } catch (error) {
            console.error("Publish error:", error);
            alert("Failed to publish assessment.");
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f2eb] text-[#171a1a]">
            {/* Top workflow bar */}
            <div className="border-b border-black/10 bg-[#faf8f3]">
                <div className="flex h-20 items-center justify-between px-8">
                    <div className="flex items-center gap-8">
                        <button className="flex items-center gap-2 text-sm text-black/60 transition hover:text-black">
                            <ArrowLeft size={17} />
                            Back
                        </button>

                        <div className="h-7 w-px bg-black/10" />

                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f15b1f]">
                                SentinelX
                            </div>
                            <div className="text-sm font-semibold">
                                Assessment Creation
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-black/45">Draft Status</span>

                        <span className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium">
                            Unsaved changes
                        </span>

                        <button className="rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-medium transition hover:bg-black/[0.03]">
                            Save Draft
                        </button>

                        <button
                            onClick={() =>
                                setCurrentStep(Math.min(currentStep + 1, steps.length - 1))
                            }
                            className="rounded-lg bg-[#f15b1f] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#d94f18]"
                        >
                            Next Step
                        </button>
                    </div>
                </div>

                {/* Steps */}
                <div className="mx-auto flex max-w-5xl items-center justify-center px-8 pb-5">
                    {steps.map((step, index) => {
                        const active = index === currentStep;
                        const completed = index < currentStep;

                        return (
                            <div key={step} className="flex items-center">
                                <button
                                    onClick={() => setCurrentStep(index)}
                                    className="flex items-center gap-2"
                                >
                                    <span
                                        className={[
                                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                                            completed
                                                ? "bg-[#f15b1f] text-white"
                                                : active
                                                    ? "border-2 border-[#f15b1f] text-[#f15b1f]"
                                                    : "border border-black/15 text-black/40",
                                        ].join(" ")}
                                    >
                                        {completed ? <Check size={14} /> : index + 1}
                                    </span>

                                    <span
                                        className={[
                                            "text-xs font-semibold uppercase tracking-wider",
                                            active || completed
                                                ? "text-[#171a1a]"
                                                : "text-black/35",
                                        ].join(" ")}
                                    >
                                        {step}
                                    </span>
                                </button>

                                {index !== steps.length - 1 && (
                                    <div
                                        className={[
                                            "mx-5 h-px w-16",
                                            index < currentStep
                                                ? "bg-[#f15b1f]"
                                                : "bg-black/10",
                                        ].join(" ")}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main */}
            <main className="mx-auto max-w-6xl px-8 py-10">
                <div className="mb-8">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f15b1f]">
                        Step {String(currentStep + 1).padStart(2, "0")}
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight">
                        {steps[currentStep] === "Details"
                            ? "Create Assessment"
                            : steps[currentStep]}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm text-black/55">
                        Configure your assessment, security policy, and participant
                        experience.
                    </p>
                </div>

                {currentStep === 0 && (
                    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                        {/* Left */}
                        <div className="space-y-6">
                            <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                                <SectionHeader
                                    icon={<FileText size={17} />}
                                    title="Assessment Details"
                                />

                                <div className="space-y-5">
                                    <Field label="Title">
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="input"
                                            placeholder="Enter assessment title"
                                        />
                                    </Field>

                                    <Field label="Description">
                                        <textarea
                                            rows={5}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="input resize-none"
                                            placeholder="Enter detailed instructions for participants..."
                                        />
                                    </Field>
                                </div>
                            </section>

                            <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                                <SectionHeader
                                    icon={<Grid2X2 size={17} />}
                                    title="Assessment Type"
                                />

                                <div className="grid gap-4 md:grid-cols-3">
                                    {assessmentTypes.map((type) => {
                                        const Icon = type.icon;
                                        const selected = assessmentType === type.id;

                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => setAssessmentType(type.id)}
                                                className={[
                                                    "rounded-xl border p-5 text-left transition",
                                                    selected
                                                        ? "border-[#f15b1f] bg-[#fff7f1] shadow-sm"
                                                        : "border-black/10 bg-white hover:border-black/20",
                                                ].join(" ")}
                                            >
                                                <div
                                                    className={[
                                                        "mb-5 flex h-9 w-9 items-center justify-center rounded-lg",
                                                        selected
                                                            ? "bg-[#f15b1f] text-white"
                                                            : "bg-black/[0.04] text-black/60",
                                                    ].join(" ")}
                                                >
                                                    <Icon size={18} />
                                                </div>

                                                <div className="font-semibold">{type.title}</div>

                                                <div className="mt-1 text-xs text-black/45">
                                                    {type.description}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                                <SectionHeader
                                    icon={<Clock3 size={17} />}
                                    title="Assessment Configuration"
                                />

                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="Duration (Minutes)">
                                        <input
                                            type="number"
                                            min="1"
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                            className="input"
                                        />
                                    </Field>

                                    <Field label="Max Attempts">
                                        <select
                                            value={maxAttempts}
                                            onChange={(e) => setMaxAttempts(e.target.value)}
                                            className="input"
                                        >
                                            <option>1</option>
                                            <option>2</option>
                                            <option>3</option>
                                            <option>Unlimited</option>
                                        </select>
                                    </Field>

                                    <Field label="Start Window">
                                        <input
                                            type="datetime-local"
                                            className="input"
                                        />
                                    </Field>

                                    <Field label="End Window">
                                        <input
                                            type="datetime-local"
                                            className="input"
                                        />
                                    </Field>
                                </div>

                                <div className="mt-6 grid gap-3 md:grid-cols-2">
                                    <ToggleRow
                                        title="Allow Late Join"
                                        description="Participants can join after start time"
                                        enabled={lateJoin}
                                        onClick={() => setLateJoin(!lateJoin)}
                                    />

                                    <ToggleRow
                                        title="Auto Submit"
                                        description="Submit automatically when time ends"
                                        enabled={autoSubmit}
                                        onClick={() => setAutoSubmit(!autoSubmit)}
                                    />
                                </div>
                            </section>
                        </div>

                        {/* Right */}
                        <aside className="space-y-6">
                            <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                                <SectionHeader
                                    icon={<Link2 size={17} />}
                                    title="Assessment Access"
                                />

                                <div className="space-y-5">
                                    <Field label="Access Code">
                                        <div className="flex">
                                            <input
                                                value={accessCode || "Generated on publish"}
                                                readOnly
                                                className="input rounded-r-none font-mono font-bold tracking-widest"
                                            />
                                            <button className="border border-l-0 border-black/10 bg-white px-3">
                                                <Link2 size={16} />
                                            </button>
                                        </div>
                                    </Field>

                                    <Field label="Join Link">
                                        <div className="flex">
                                            <input
                                                value={
                                                    joinLink
                                                        ? `${window.location.origin}${joinLink}`
                                                        : "Generated on publish"
                                                }
                                                readOnly
                                                className="input rounded-r-none text-xs"
                                            />
                                            <button className="border border-l-0 border-black/10 bg-white px-3">
                                                <Link2 size={16} />
                                            </button>
                                        </div>
                                    </Field>

                                    <Field label="Access Mode">
                                        <label className="flex cursor-pointer gap-3 rounded-lg border border-[#f15b1f] bg-[#fff7f1] p-4">
                                            <input
                                                type="radio"
                                                defaultChecked
                                                name="access"
                                                className="accent-[#f15b1f]"
                                            />
                                            <div>
                                                <div className="text-sm font-semibold">
                                                    Open Access
                                                </div>
                                                <div className="mt-1 text-xs text-black/45">
                                                    Anyone with the link/code can join
                                                </div>
                                            </div>
                                        </label>

                                        <label className="mt-3 flex cursor-pointer gap-3 rounded-lg border border-black/10 bg-white p-4">
                                            <input
                                                type="radio"
                                                name="access"
                                                className="accent-[#f15b1f]"
                                            />
                                            <div>
                                                <div className="text-sm font-semibold">
                                                    Restricted Domain
                                                </div>
                                                <div className="mt-1 text-xs text-black/45">
                                                    Only specified email domains allowed
                                                </div>
                                            </div>
                                        </label>
                                    </Field>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-xl bg-[#111616] text-white">
                                <div className="border-b border-white/10 p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold">
                                            Security Policy
                                        </div>

                                        <span className="rounded bg-[#f15b1f] px-2 py-1 text-[9px] font-bold uppercase tracking-wider">
                                            High Security
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 p-5">
                                    <SecurityItem
                                        icon={<ShieldCheck size={15} />}
                                        title="Identity Verification"
                                    />
                                    <SecurityItem
                                        icon={<Users size={15} />}
                                        title="Dual Camera AI Proctoring"
                                    />
                                    <SecurityItem
                                        icon={<Lock size={15} />}
                                        title="Strict Browser Lock"
                                    />
                                    <SecurityItem
                                        icon={<Zap size={15} />}
                                        title="Audio Analysis"
                                    />
                                </div>

                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="m-5 mt-1 w-[calc(100%-40px)] rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
                                >
                                    Configure Security
                                    <ArrowRight className="ml-2 inline" size={15} />
                                </button>
                            </section>
                        </aside>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="space-y-6">
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<FileText size={17} />}
                                title="Question Configuration"
                            />

                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="MCQ Questions">
                                    <input
                                        type="number"
                                        min="0"
                                        value={mcqCount}
                                        onChange={(e) => setMcqCount(Number(e.target.value))}
                                        className="input"
                                    />
                                </Field>

                                <Field label="Coding Problems">
                                    <input
                                        type="number"
                                        min="0"
                                        value={codingCount}
                                        onChange={(e) => setCodingCount(Number(e.target.value))}
                                        className="input"
                                    />
                                </Field>

                                <Field label="Total Marks">
                                    <input
                                        type="number"
                                        min="1"
                                        value={totalMarks}
                                        onChange={(e) => setTotalMarks(Number(e.target.value))}
                                        className="input"
                                    />
                                </Field>

                                <Field label="Passing Score">
                                    <input
                                        type="number"
                                        min="0"
                                        value={passingScore}
                                        onChange={(e) =>
                                            setPassingScore(Number(e.target.value))
                                        }
                                        className="input"
                                    />
                                </Field>

                                <Field label="Difficulty">
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="input"
                                    >
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                        <option>Mixed</option>
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
                                <ToggleRow
                                    title="Randomize Questions"
                                    description="Show questions in a different order"
                                    enabled={randomizeQuestions}
                                    onClick={() =>
                                        setRandomizeQuestions(!randomizeQuestions)
                                    }
                                />

                                <ToggleRow
                                    title="Negative Marking"
                                    description="Deduct marks for incorrect answers"
                                    enabled={negativeMarking}
                                    onClick={() =>
                                        setNegativeMarking(!negativeMarking)
                                    }
                                />
                            </div>
                        </section>

                        <section className="rounded-xl bg-[#111616] p-6 text-white">
                            <div className="text-xs font-semibold uppercase tracking-wider text-[#f15b1f]">
                                Assessment Summary
                            </div>

                            <h2 className="mt-2 text-2xl font-bold">
                                {assessmentType === "mcq"
                                    ? "MCQ Assessment"
                                    : assessmentType === "coding"
                                        ? "Coding Assessment"
                                        : "Mixed Assessment"}
                            </h2>

                            <div className="mt-6 grid gap-3 md:grid-cols-4">
                                <SummaryItem label="MCQ" value={String(mcqCount)} />
                                <SummaryItem label="Coding" value={String(codingCount)} />
                                <SummaryItem label="Marks" value={String(totalMarks)} />
                                <SummaryItem label="Pass Mark" value={String(passingScore)} />
                            </div>
                        </section>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setCurrentStep(0)}
                                className="rounded-lg border border-black/15 bg-white px-5 py-2.5 text-sm font-medium"
                            >
                                <ArrowLeft className="mr-2 inline" size={15} />
                                Previous Step
                            </button>

                            <button
                                onClick={() => setCurrentStep(2)}
                                className="rounded-lg bg-[#f15b1f] px-5 py-2.5 text-sm font-semibold text-white"
                            >
                                Continue to Security
                                <ArrowRight className="ml-2 inline" size={15} />
                            </button>
                        </div>
                    </div>
                )}
                {currentStep === 2 && (
                    <div className="space-y-6">

                        {/* Security Level */}
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<ShieldCheck size={17} />}
                                title="Security Level"
                            />

                            <div className="grid gap-4 md:grid-cols-3">
                                {[
                                    {
                                        id: "standard",
                                        title: "Standard",
                                        description: "Basic monitoring",
                                    },
                                    {
                                        id: "high",
                                        title: "High Security",
                                        description: "Recommended for exams",
                                    },
                                    {
                                        id: "strict",
                                        title: "Strict",
                                        description: "Maximum protection",
                                    },
                                ].map((level) => {
                                    const selected = securityLevel === level.id;

                                    return (
                                        <button
                                            key={level.id}
                                            onClick={() => setSecurityLevel(level.id)}
                                            className={[
                                                "rounded-xl border p-5 text-left transition",
                                                selected
                                                    ? "border-[#f15b1f] bg-[#fff7f1] shadow-sm"
                                                    : "border-black/10 bg-white hover:border-black/20",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="font-semibold">
                                                    {level.title}
                                                </div>

                                                {selected && (
                                                    <Check
                                                        size={17}
                                                        className="text-[#f15b1f]"
                                                    />
                                                )}
                                            </div>

                                            <div className="mt-1 text-xs text-black/45">
                                                {level.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Identity & Camera */}
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<Users size={17} />}
                                title="Identity & Camera Monitoring"
                            />

                            <div className="grid gap-4 md:grid-cols-2">

                                <SecurityToggle
                                    icon={<ShieldCheck size={18} />}
                                    title="Identity Verification"
                                    description="Verify participant identity before starting"
                                    enabled={identityVerification}
                                    onClick={() =>
                                        setIdentityVerification(!identityVerification)
                                    }
                                />

                                <SecurityToggle
                                    icon={<Users size={18} />}
                                    title="Primary Camera"
                                    description="Monitor participant through webcam"
                                    enabled={primaryCamera}
                                    onClick={() =>
                                        setPrimaryCamera(!primaryCamera)
                                    }
                                />

                                <SecurityToggle
                                    icon={<Users size={18} />}
                                    title="Secondary Camera"
                                    description="Use a mobile device as second camera"
                                    enabled={secondaryCamera}
                                    onClick={() =>
                                        setSecondaryCamera(!secondaryCamera)
                                    }
                                />

                                <SecurityToggle
                                    icon={<Zap size={18} />}
                                    title="AI Proctoring"
                                    description="Detect suspicious participant behaviour"
                                    enabled={aiProctoring}
                                    onClick={() =>
                                        setAiProctoring(!aiProctoring)
                                    }
                                />

                            </div>
                        </section>

                        {/* Browser & Activity */}
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<Lock size={17} />}
                                title="Browser & Activity Protection"
                            />

                            <div className="grid gap-4 md:grid-cols-2">

                                <SecurityToggle
                                    icon={<Lock size={18} />}
                                    title="Strict Browser Lock"
                                    description="Prevent leaving the assessment window"
                                    enabled={browserLock}
                                    onClick={() =>
                                        setBrowserLock(!browserLock)
                                    }
                                />

                                <SecurityToggle
                                    icon={<Zap size={18} />}
                                    title="Tab Switching Detection"
                                    description="Detect attempts to switch browser tabs"
                                    enabled={tabDetection}
                                    onClick={() =>
                                        setTabDetection(!tabDetection)
                                    }
                                />

                                <SecurityToggle
                                    icon={<Zap size={18} />}
                                    title="Audio Monitoring"
                                    description="Analyze microphone activity for anomalies"
                                    enabled={audioMonitoring}
                                    onClick={() =>
                                        setAudioMonitoring(!audioMonitoring)
                                    }
                                />

                                <SecurityToggle
                                    icon={<ShieldCheck size={18} />}
                                    title="Incident Detection"
                                    description="Automatically flag suspicious events"
                                    enabled={true}
                                    onClick={() => { }}
                                />

                            </div>
                        </section>

                        {/* Security Summary */}
                        <section className="overflow-hidden rounded-xl bg-[#111616] text-white">

                            <div className="border-b border-white/10 p-6">
                                <div className="flex items-center justify-between">

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/40">
                                            Security Configuration
                                        </div>

                                        <div className="mt-1 text-xl font-semibold">
                                            SentinelX Protection
                                        </div>
                                    </div>

                                    <span className="rounded-full bg-[#f15b1f] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                                        {securityLevel === "strict"
                                            ? "Strict"
                                            : securityLevel === "high"
                                                ? "High Security"
                                                : "Standard"}
                                    </span>

                                </div>
                            </div>

                            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">

                                <SummaryItem
                                    label="Identity"
                                    value={
                                        identityVerification
                                            ? "Enabled"
                                            : "Disabled"
                                    }
                                />

                                <SummaryItem
                                    label="Cameras"
                                    value={
                                        secondaryCamera
                                            ? "Dual Camera"
                                            : primaryCamera
                                                ? "Primary Only"
                                                : "Disabled"
                                    }
                                />

                                <SummaryItem
                                    label="Browser"
                                    value={
                                        browserLock
                                            ? "Locked"
                                            : "Unlocked"
                                    }
                                />

                                <SummaryItem
                                    label="AI Monitoring"
                                    value={
                                        aiProctoring
                                            ? "Active"
                                            : "Disabled"
                                    }
                                />

                            </div>
                        </section>

                        {/* Navigation */}
                        <div className="flex justify-between">

                            <button
                                onClick={() => setCurrentStep(1)}
                                className="rounded-lg border border-black/15 bg-white px-5 py-2.5 text-sm font-medium"
                            >
                                <ArrowLeft
                                    className="mr-2 inline"
                                    size={15}
                                />
                                Previous Step
                            </button>

                            <button
                                onClick={() => setCurrentStep(3)}
                                className="rounded-lg bg-[#f15b1f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d94f18]"
                            >
                                Continue to Preview
                                <ArrowRight
                                    className="ml-2 inline"
                                    size={15}
                                />
                            </button>

                        </div>
                    </div>
                )}
                {currentStep === 3 && (
                    <div className="space-y-6">

                        {/* Preview Header */}
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wider text-[#f15b1f]">
                                        Assessment Preview
                                    </div>

                                    <h2 className="mt-2 text-2xl font-bold">
                                        {title}
                                    </h2>

                                    <p className="mt-2 text-sm text-black/50">
                                        Review all assessment settings before publishing.
                                    </p>
                                </div>

                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                    Ready for Review
                                </span>
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-4">
                                <SummaryItem
                                    label="MCQ Questions"
                                    value={String(mcqCount)}
                                />

                                <SummaryItem
                                    label="Coding Problems"
                                    value={String(codingCount)}
                                />

                                <SummaryItem
                                    label="Total Marks"
                                    value={String(totalMarks)}
                                />

                                <SummaryItem
                                    label="Passing Score"
                                    value={String(passingScore)}
                                />
                            </div>
                        </section>

                        {/* Assessment Configuration */}
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<FileText size={17} />}
                                title="Assessment Configuration"
                            />

                            <div className="grid gap-4 md:grid-cols-3">
                                <PreviewItem
                                    label="Assessment Type"
                                    value={
                                        assessmentType === "mcq"
                                            ? "MCQ"
                                            : assessmentType === "coding"
                                                ? "Coding"
                                                : "Mixed"
                                    }
                                />

                                <PreviewItem
                                    label="Difficulty"
                                    value={difficulty}
                                />

                                <PreviewItem
                                    label="Duration"
                                    value={`${duration} Minutes`}
                                />

                                <PreviewItem
                                    label="Randomize Questions"
                                    value={
                                        randomizeQuestions
                                            ? "Enabled"
                                            : "Disabled"
                                    }
                                />

                                <PreviewItem
                                    label="Negative Marking"
                                    value={
                                        negativeMarking
                                            ? "Enabled"
                                            : "Disabled"
                                    }
                                />

                                <PreviewItem
                                    label="Auto Submit"
                                    value={
                                        autoSubmit
                                            ? "Enabled"
                                            : "Disabled"
                                    }
                                />
                            </div>
                        </section>

                        {/* Security Preview */}
                        <section className="rounded-xl bg-[#111616] p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wider text-[#f15b1f]">
                                        Security Configuration
                                    </div>

                                    <h2 className="mt-2 text-xl font-bold">
                                        SentinelX Protection
                                    </h2>
                                </div>

                                <span className="rounded-full bg-[#f15b1f] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                                    {securityLevel === "strict"
                                        ? "Strict"
                                        : securityLevel === "high"
                                            ? "High Security"
                                            : "Standard"}
                                </span>
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-2">
                                <SecurityStatus
                                    title="Identity Verification"
                                    enabled={identityVerification}
                                />

                                <SecurityStatus
                                    title="Primary Camera"
                                    enabled={primaryCamera}
                                />

                                <SecurityStatus
                                    title="Secondary Camera"
                                    enabled={secondaryCamera}
                                />

                                <SecurityStatus
                                    title="AI Proctoring"
                                    enabled={aiProctoring}
                                />

                                <SecurityStatus
                                    title="Browser Lock"
                                    enabled={browserLock}
                                />

                                <SecurityStatus
                                    title="Tab Switching Detection"
                                    enabled={tabDetection}
                                />

                                <SecurityStatus
                                    title="Audio Monitoring"
                                    enabled={audioMonitoring}
                                />

                                <SecurityStatus
                                    title="Incident Detection"
                                    enabled={true}
                                />
                            </div>
                        </section>

                        {/* Access */}
                        <section className="rounded-xl border border-black/10 bg-[#faf8f3] p-6">
                            <SectionHeader
                                icon={<Link2 size={17} />}
                                title="Assessment Access"
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <PreviewItem
                                    label="Access Code"
                                    value={accessCode || "Not generated yet"}
                                />

                                <PreviewItem
                                    label="Access Mode"
                                    value="Open Access"
                                />

                                <div className="md:col-span-2">
                                    <PreviewItem
                                        label="Join Link"
                                        value={
                                            joinLink
                                                ? `${window.location.origin}${joinLink}`
                                                : "Not generated yet"
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Navigation */}
                        <div className="flex justify-between">
                            <button
                                onClick={() => setCurrentStep(2)}
                                className="rounded-lg border border-black/15 bg-white px-5 py-2.5 text-sm font-medium"
                            >
                                <ArrowLeft
                                    className="mr-2 inline"
                                    size={15}
                                />
                                Previous Step
                            </button>

                            <button
                                onClick={() => setCurrentStep(4)}
                                className="rounded-lg bg-[#f15b1f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d94f18]"
                            >
                                Continue to Publish
                                <ArrowRight
                                    className="ml-2 inline"
                                    size={15}
                                />
                            </button>
                        </div>
                    </div>
                )}
                {currentStep === 4 && (
                    <div className="rounded-xl border border-black/10 bg-[#faf8f3] p-10 text-center">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0e7] text-[#f15b1f]">
                            <Check size={30} />
                        </div>

                        <div className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#f15b1f]">
                            Step 05
                        </div>

                        <h2 className="mt-2 text-3xl font-bold">
                            Ready to Publish
                        </h2>

                        <p className="mx-auto mt-3 max-w-lg text-sm text-black/50">
                            Your assessment configuration is complete.
                            Review the details once more and publish the assessment.
                        </p>

                        <div className="mx-auto mt-8 grid max-w-2xl gap-3 md:grid-cols-3">
                            <PreviewItem
                                label="Assessment"
                                value="Data Structures"
                            />

                            <PreviewItem
                                label="Questions"
                                value={String(mcqCount + codingCount)}
                            />

                            <PreviewItem
                                label="Security"
                                value={
                                    securityLevel === "strict"
                                        ? "Strict"
                                        : securityLevel === "high"
                                            ? "High Security"
                                            : "Standard"
                                }
                            />
                        </div>

                        <div className="mt-8 flex justify-center gap-3">
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="rounded-lg border border-black/15 bg-white px-5 py-2.5 text-sm font-medium"
                            >
                                <ArrowLeft
                                    className="mr-2 inline"
                                    size={15}
                                />
                                Back to Preview
                            </button>

                            <button
                                onClick={handlePublish}
                                className="rounded-lg bg-[#f15b1f] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d94f18]"
                            >
                                Publish Assessment
                                <Check
                                    className="ml-2 inline"
                                    size={15}
                                />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
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
        <div className="mb-6 flex items-center gap-2 border-b border-black/10 pb-4">
            <span className="text-[#f15b1f]">{icon}</span>
            <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
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
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-black/45">
                {label}
            </label>
            {children}
        </div>
    );
}

function ToggleRow({
    title,
    description,
    enabled,
    onClick,
}: {
    title: string;
    description: string;
    enabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-between rounded-lg border border-black/10 bg-white p-4 text-left"
        >
            <div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="mt-1 text-xs text-black/45">{description}</div>
            </div>

            <span
                className={[
                    "relative h-5 w-9 rounded-full transition",
                    enabled ? "bg-[#f15b1f]" : "bg-black/15",
                ].join(" ")}
            >
                <span
                    className={[
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white transition",
                        enabled ? "left-[18px]" : "left-0.5",
                    ].join(" ")}
                />
            </span>
        </button>
    );
}

function SecurityItem({
    icon,
    title,
}: {
    icon: React.ReactNode;
    title: string;
}) {
    return (
        <div className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-0">
            <span className="text-[#f15b1f]">{icon}</span>
            <span className="text-xs text-white/80">{title}</span>
            <Check className="ml-auto text-emerald-400" size={14} />
        </div>
    );
}

function SummaryItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {label}
            </div>

            <div className="mt-2 text-lg font-semibold">
                {value}
            </div>
        </div>
    );
}

function SecurityToggle({
    icon,
    title,
    description,
    enabled,
    onClick,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    enabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={[
                "flex w-full items-center justify-between rounded-xl border p-5 text-left transition",
                enabled
                    ? "border-black/10 bg-white"
                    : "border-black/10 bg-black/[0.02] opacity-60",
            ].join(" ")}
        >
            <div className="flex items-start gap-4">

                <div
                    className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        enabled
                            ? "bg-[#fff0e7] text-[#f15b1f]"
                            : "bg-black/[0.05] text-black/40",
                    ].join(" ")}
                >
                    {icon}
                </div>

                <div>
                    <div className="text-sm font-semibold">
                        {title}
                    </div>

                    <div className="mt-1 text-xs text-black/45">
                        {description}
                    </div>
                </div>

            </div>

            <span
                className={[
                    "relative h-5 w-9 shrink-0 rounded-full transition",
                    enabled
                        ? "bg-[#f15b1f]"
                        : "bg-black/15",
                ].join(" ")}
            >
                <span
                    className={[
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white transition",
                        enabled
                            ? "left-[18px]"
                            : "left-0.5",
                    ].join(" ")}
                />
            </span>
        </button>
    );
}

function PreviewItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border border-black/10 bg-white p-4 text-left">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                {label}
            </div>

            <div className="mt-2 text-sm font-semibold break-all">
                {value}
            </div>
        </div>
    );
}

function SecurityStatus({
    title,
    enabled,
}: {
    title: string;
    enabled: boolean;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <div
                className={[
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    enabled
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-white/10 text-white/30",
                ].join(" ")}
            >
                {enabled ? <Check size={14} /> : "—"}
            </div>

            <span className="text-sm text-white/80">
                {title}
            </span>

            <span className="ml-auto text-xs text-white/40">
                {enabled ? "Enabled" : "Disabled"}
            </span>
        </div>
    );
}