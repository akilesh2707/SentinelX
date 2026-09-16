"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProctoringEngine } from "./use-proctoring-engine";
import { useMediaProctoring } from "./use-media-proctoring";
import { Camera, Mic, MicOff, VideoOff, Camera as CameraIcon } from "lucide-react";
import { captureSnapshot } from "./snapshot-util";

type AttemptState = {
    id: string;
    status: string;
    startedAt: string | null;
    expiresAt: string | null;
    assessment: {
        primaryCamera: boolean;
        audioMonitoring: boolean;
    };
};

type Option = {
    id: string;
    optionKey: string;
    text: string;
};

type Question = {
    id: string;
    type: "MCQ" | "CODING";
    title: string;
    description: string | null;
    topic: string | null;
    difficulty: string;
    inputFormat: string | null;
    outputFormat: string | null;
    constraints: string | null;
    starterCode: string | null;
    options: Option[];
};

type AttemptQuestion = {
    id: string;
    order: number;
    marks: number;
    answered: boolean;
    visited: boolean;
    question: Question;
};

type AnswerState = {
    id: string;
    attemptQuestionId: string;
    selectedOptionId: string | null;
    submittedCode: string | null;
    language: string | null;
    answeredAt: string;
};

export function ExamInterface({ attempt }: { attempt: AttemptState }) {
    const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const activeStreamRef = useRef<MediaStream | null>(null);
    const pendingSnapshotsRef = useRef<Record<string, { blob: Blob, capturedAt: string }>>({});
    const pendingIncidentsRef = useRef<Record<string, string>>({});
    const processedAutomaticEvidenceRef = useRef<Set<string>>(new Set());

    const handleUploadEvidence = (clientEventId: string, incidentId: string, blob: Blob, capturedAt: string) => {
        if (processedAutomaticEvidenceRef.current.has(clientEventId)) return;
        processedAutomaticEvidenceRef.current.add(clientEventId);

        try {
            const clientEvidenceId = crypto.randomUUID();
            const fd = new FormData();
            fd.append("incidentId", incidentId);
            fd.append("clientEvidenceId", clientEvidenceId);
            fd.append("type", "CAMERA_SNAPSHOT");
            fd.append("capturedAt", capturedAt);
            fd.append("file", blob, "snapshot.webp");

            fetch(`/api/attempts/${attempt.id}/evidence`, {
                method: "POST",
                body: fd
            }).catch(e => console.error("Automatic snapshot upload failed:", e));
        } catch (e) {
            console.error("Automatic snapshot prep failed:", e);
        }
    };

    const { recordEvent } = useProctoringEngine({ 
        attemptId: attempt.id, 
        status: attempt.status,
        onSecurityEvent: (type, clientEventId) => {
            if (activeStreamRef.current) {
                captureSnapshot(activeStreamRef.current)
                    .then(blob => {
                        const capturedAt = new Date().toISOString();
                        const incidentId = pendingIncidentsRef.current[clientEventId];
                        
                        if (incidentId) {
                            handleUploadEvidence(clientEventId, incidentId, blob, capturedAt);
                            delete pendingIncidentsRef.current[clientEventId];
                        } else {
                            pendingSnapshotsRef.current[clientEventId] = { blob, capturedAt };
                        }
                    })
                    .catch(e => console.error("Failed to automatically capture snapshot:", e));
            }
        },
        onIncidentsCreated: (mapping) => {
            Object.entries(mapping).forEach(([clientEventId, incidentId]) => {
                const pendingSnapshot = pendingSnapshotsRef.current[clientEventId];
                if (pendingSnapshot) {
                    handleUploadEvidence(clientEventId, incidentId, pendingSnapshot.blob, pendingSnapshot.capturedAt);
                    delete pendingSnapshotsRef.current[clientEventId];
                } else {
                    pendingIncidentsRef.current[clientEventId] = incidentId;
                }
            });
        }
    });

    // Maps attemptQuestionId to answer value (optionId or code string)
    const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
    // Tracks save status per attemptQuestionId
    const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);

    const [customInput, setCustomInput] = useState<Record<string, string>>({});
    const [executionResult, setExecutionResult] = useState<Record<string, any>>({});
    const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});

    const [snapshotStatus, setSnapshotStatus] = useState<"idle" | "capturing" | "uploading" | "saved" | "error">("idle");
    const [snapshotError, setSnapshotError] = useState<string | null>(null);

    const isExamActive = attempt.status === "IN_PROGRESS" && !submitResult && timeLeft !== 0;

    const { stream, cameraStatus, micStatus } = useMediaProctoring({
        requiresCamera: attempt.assessment.primaryCamera,
        requiresMic: attempt.assessment.audioMonitoring,
        isActive: isExamActive,
        recordEvent
    });

    useEffect(() => {
        activeStreamRef.current = stream;
    }, [stream]);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const [qRes, aRes] = await Promise.all([
                    fetch(`/api/attempts/${attempt.id}/questions`),
                    fetch(`/api/attempts/${attempt.id}/answers`)
                ]);

                const qData = await qRes.json();
                const aData = await aRes.json();

                if (!qRes.ok) throw new Error(qData.error || "Failed to load questions");
                if (!aRes.ok) throw new Error(aData.error || "Failed to load answers");

                if (isMounted) {
                    setQuestions(qData.questions);

                    // Reconstruct local state from persisted answers
                    const hydratedAnswers: Record<string, string> = {};
                    (aData.answers || []).forEach((ans: AnswerState) => {
                        if (ans.selectedOptionId) hydratedAnswers[ans.attemptQuestionId] = ans.selectedOptionId;
                        else if (ans.submittedCode) hydratedAnswers[ans.attemptQuestionId] = ans.submittedCode;
                    });
                    setLocalAnswers(hydratedAnswers);
                    setLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [attempt.id]);

    useEffect(() => {
        if (!attempt.expiresAt) return;
        const expiresAtMs = new Date(attempt.expiresAt).getTime();

        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.max(0, expiresAtMs - now);
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [attempt.expiresAt]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const saveAnswer = async (attemptQuestionId: string, value: string, type: "MCQ" | "CODING") => {
        setSaveStatus(prev => ({ ...prev, [attemptQuestionId]: 'saving' }));

        try {
            const payload = type === "MCQ"
                ? { attemptQuestionId, selectedOptionId: value }
                : { attemptQuestionId, submittedCode: value, language: "javascript" };

            const res = await fetch(`/api/attempts/${attempt.id}/answers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save");

            // Mark as answered in local question state dynamically so nav updates
            setQuestions(prev => prev.map(q => q.id === attemptQuestionId ? { ...q, answered: true } : q));
            setSaveStatus(prev => ({ ...prev, [attemptQuestionId]: 'saved' }));
        } catch (error) {
            console.error("Autosave failed", error);
            setSaveStatus(prev => ({ ...prev, [attemptQuestionId]: 'error' }));
        }
    };

    // Debounce wrapper specifically for coding textarea
    useEffect(() => {
        if (!questions[currentIndex] || questions[currentIndex].question.type !== "CODING") return;

        const qId = questions[currentIndex].id;
        const val = localAnswers[qId];

        // Don't trigger if it hasn't changed from server state, but since we don't strictly
        // track original vs changed locally easily, we just save if value exists and isn't marked saved currently
        if (val === undefined || saveStatus[qId] === 'saved') return;

        const timer = setTimeout(() => {
            saveAnswer(qId, val, "CODING");
        }, 800);

        return () => clearTimeout(timer);
    }, [localAnswers, currentIndex, questions]);

    const handleRunCode = async (attemptQuestionId: string) => {
        setIsRunning(prev => ({ ...prev, [attemptQuestionId]: true }));
        try {
            const code = localAnswers[attemptQuestionId] ?? questions.find(q => q.id === attemptQuestionId)?.question.starterCode ?? "";
            const input = customInput[attemptQuestionId] ?? "";

            const questionId = questions.find(q => q.id === attemptQuestionId)?.question.id;

            const res = await fetch(`/api/code/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: "python",
                    code,
                    input,
                    attemptId: attempt.id,
                    questionId
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to execute");

            setExecutionResult(prev => ({ ...prev, [attemptQuestionId]: data.result }));
        } catch (error: any) {
            setExecutionResult(prev => ({ ...prev, [attemptQuestionId]: { stderr: error.message, exitCode: -1 } }));
        } finally {
            setIsRunning(prev => ({ ...prev, [attemptQuestionId]: false }));
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/attempts/${attempt.id}/submit`, {
                method: "POST"
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to submit");

            recordEvent("EXAM_SUBMITTED");
            setSubmitResult(data.attempt);
            setShowSubmitConfirm(false);
        } catch (error) {
            console.error("Submit failed", error);
            alert("Failed to submit assessment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCaptureSnapshot = async () => {
        if (!stream) {
            setSnapshotError("Camera stream not available");
            return;
        }

        setSnapshotStatus("capturing");
        setSnapshotError(null);

        try {
            // 1. Fetch active incident for testing
            const incidentRes = await fetch(`/api/attempts/${attempt.id}/active-incident`);
            const incidentData = await incidentRes.json();
            
            if (!incidentRes.ok || !incidentData.incidentId) {
                throw new Error("No active incident available for testing. Trigger an event first.");
            }

            // 2. Capture Snapshot
            const blob = await captureSnapshot(stream);
            const clientEvidenceId = crypto.randomUUID();

            setSnapshotStatus("uploading");

            // 3. Upload Snapshot
            const formData = new FormData();
            formData.append("incidentId", incidentData.incidentId);
            formData.append("clientEvidenceId", clientEvidenceId);
            formData.append("type", "CAMERA_SNAPSHOT");
            formData.append("capturedAt", new Date().toISOString());
            formData.append("file", blob, "snapshot.webp");

            const uploadRes = await fetch(`/api/attempts/${attempt.id}/evidence`, {
                method: "POST",
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok) {
                throw new Error(uploadData.error || "Upload failed");
            }

            setSnapshotStatus("saved");
            setTimeout(() => setSnapshotStatus("idle"), 3000);
        } catch (error: any) {
            console.error("Snapshot error:", error);
            setSnapshotStatus("error");
            setSnapshotError(error.message || "Failed to capture snapshot");
            setTimeout(() => {
                setSnapshotStatus("idle");
                setSnapshotError(null);
            }, 5000);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-[#a0a19b]">Loading assessment environment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="rounded-lg bg-red-500/10 p-6 text-center max-w-md border border-red-500/20">
                    <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
                    <p className="text-red-400/80">{error}</p>
                </div>
            </div>
        );
    }

    if (timeLeft === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="rounded-xl bg-[#fbfaf6] p-8 text-center max-w-md shadow-xl border border-[#dedbd2]">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <Clock size={32} className="text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#171a1b] mb-2">Time Expired</h2>
                    <p className="text-[#737777]">The allocated time for this assessment has ended. Your attempt is locked.</p>
                    <div className="mt-8">
                        <button
                            onClick={() => setShowSubmitConfirm(true)}
                            className="w-full py-3 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl font-semibold hover:bg-emerald-600/20 transition-colors"
                        >
                            Submit Assessment
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const answeredCount = questions.filter(q => q.answered || (localAnswers[q.id] && saveStatus[q.id] === 'saved')).length;
    const hasCoding = questions.some(q => q.question.type === "CODING");

    if (submitResult) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={32} />
                </div>
                <h1 className="text-3xl font-bold text-[#fbfaf6] mb-4">Assessment Submitted</h1>
                <p className="text-[#a0a19b] mb-8">
                    Your answers have been securely recorded. You may now close this window.
                </p>

                <div className="bg-[#2d2d2d] rounded-xl p-6 w-full text-left space-y-4">
                    <div className="flex justify-between items-center border-b border-[#303433] pb-4">
                        <span className="text-[#a0a19b]">Submission Status</span>
                        <span className="font-semibold text-[#fbfaf6]">{submitResult.status}</span>
                    </div>
                    {submitResult.score !== null && (
                        <div className="flex justify-between items-center border-b border-[#303433] pb-4">
                            <span className="text-[#a0a19b]">Calculated Score</span>
                            <span className="font-semibold text-emerald-400">
                                {submitResult.score} / {submitResult.maxScore}
                            </span>
                        </div>
                    )}
                    {hasCoding && (
                        <div className="text-sm text-emerald-400 bg-emerald-400/10 p-4 rounded-lg">
                            Your coding questions were evaluated against hidden test cases. Check the final score above.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="flex-1 flex overflow-hidden relative">
            {/* Confirmation Modal */}
            <AnimatePresence>
                {showSubmitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#171a1b] border border-[#303433] rounded-2xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold mb-4 text-[#fbfaf6]">Submit Assessment?</h2>
                            <p className="text-[#a0a19b] mb-4">
                                Are you sure you want to submit your assessment? You cannot change your answers after submission.
                            </p>
                            {hasCoding && (
                                <div className="text-sm text-orange-400 bg-orange-400/10 p-3 rounded-lg mb-6">
                                    Your coding answers will be evaluated securely against hidden test cases upon submission.
                                </div>
                            )}

                            <div className="bg-[#2d2d2d] rounded-lg p-4 mb-8 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[#a0a19b]">Answered</span>
                                    <span className="text-emerald-400 font-medium">{answeredCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#a0a19b]">Unanswered</span>
                                    <span className="text-orange-400 font-medium">{questions.length - answeredCount}</span>
                                </div>
                                <div className="flex justify-between border-t border-[#303433] pt-2 mt-2">
                                    <span className="text-[#a0a19b]">Total Questions</span>
                                    <span className="text-[#fbfaf6] font-medium">{questions.length}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowSubmitConfirm(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 rounded-lg border border-[#303433] text-[#fbfaf6] hover:bg-[#303433] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors flex items-center justify-center"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm Submit"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar Navigator */}
            <aside className="w-64 border-r border-[#303433] bg-[#171a1b] flex flex-col h-full">
                <div className="p-4 border-b border-[#303433]">
                    <div className="flex items-center gap-2 bg-[#fbfaf6] text-[#171a1b] px-4 py-2.5 rounded-lg font-mono font-bold justify-center shadow-inner">
                        <Clock size={16} />
                        {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="mb-3 text-xs font-semibold text-[#a0a19b] uppercase tracking-wider">
                        Questions ({questions.length})
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {questions.map((q, idx) => {
                            const isCurrent = idx === currentIndex;
                            const isAnswered = q.answered || (localAnswers[q.id] && saveStatus[q.id] === 'saved');

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`
                                        h-10 w-full rounded font-semibold text-sm transition-colors flex items-center justify-center
                                        ${isCurrent ? 'ring-2 ring-orange-500 bg-[#303433] text-white' :
                                          isAnswered ? 'bg-[#fbfaf6]/20 text-[#fbfaf6] hover:bg-[#fbfaf6]/30' :
                                          'bg-transparent border border-[#303433] text-[#a0a19b] hover:border-[#fbfaf6]/40 hover:text-white'}
                                    `}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* Media Preview Section */}
                {(attempt.assessment.primaryCamera || attempt.assessment.audioMonitoring) && (
                    <div className="p-4 border-t border-[#303433] bg-[#2d2d2d] mt-auto">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[#a0a19b] uppercase tracking-wider">Monitoring</span>
                            <div className="flex gap-2">
                                {attempt.assessment.audioMonitoring && (
                                    micStatus === "ready" ? <Mic size={14} className="text-emerald-400" /> : <MicOff size={14} className="text-red-400" />
                                )}
                                {attempt.assessment.primaryCamera && (
                                    cameraStatus === "ready" ? <Camera size={14} className="text-emerald-400" /> : <VideoOff size={14} className="text-red-400" />
                                )}
                            </div>
                        </div>
                        {attempt.assessment.primaryCamera && (
                            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-[#303433] relative">
                                {cameraStatus === "ready" && stream ? (
                                    <video 
                                        autoPlay 
                                        playsInline 
                                        muted 
                                        className="w-full h-full object-cover scale-x-[-1]"
                                        ref={(video) => {
                                            if (video && video.srcObject !== stream) {
                                                video.srcObject = stream;
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full w-full text-[#a0a19b] text-xs">
                                        {cameraStatus === "loading" ? "Starting camera..." : "Camera unavailable"}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Test Snapshot Controls */}
                        {attempt.assessment.primaryCamera && cameraStatus === "ready" && stream && (
                            <div className="mt-3">
                                <button
                                    onClick={handleCaptureSnapshot}
                                    disabled={snapshotStatus !== "idle"}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#303433] hover:bg-[#404443] text-xs font-semibold text-[#fbfaf6] transition-colors disabled:opacity-50"
                                >
                                    {snapshotStatus === "idle" && <><CameraIcon size={14} /> Capture Snapshot (Test)</>}
                                    {snapshotStatus === "capturing" && <><Loader2 size={14} className="animate-spin" /> Capturing...</>}
                                    {snapshotStatus === "uploading" && <><Loader2 size={14} className="animate-spin" /> Uploading...</>}
                                    {snapshotStatus === "saved" && <><CheckCircle2 size={14} className="text-emerald-400" /> Saved!</>}
                                    {snapshotStatus === "error" && <span className="text-red-400">Error</span>}
                                </button>
                                {snapshotError && (
                                    <div className="mt-2 text-[10px] text-red-400 leading-tight">
                                        {snapshotError}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </aside>

            {/* Main Question Area */}
            <main className="flex-1 flex flex-col bg-[#fbfaf6] overflow-hidden text-[#171a1b]">
                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="mb-6 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-[#171a1b] text-white text-xs font-bold px-2.5 py-1 rounded">
                                            Q{currentIndex + 1}
                                        </span>
                                        <span className="text-[#737777] text-sm font-medium">
                                            {currentQuestion.question.type === "MCQ" ? "Multiple Choice" : "Programming"}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-[#171a1b]">{currentQuestion.question.title}</h2>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-orange-600">{currentQuestion.marks} <span className="text-[#a0a19b] text-sm font-normal">marks</span></div>
                                    <div className="h-4 mt-1 flex justify-end">
                                        {saveStatus[currentQuestion.id] === 'saving' && <span className="text-xs text-orange-500 flex items-center gap-1 animate-pulse"><Loader2 size={12} className="animate-spin" /> Saving...</span>}
                                        {saveStatus[currentQuestion.id] === 'saved' && <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> Saved</span>}
                                        {saveStatus[currentQuestion.id] === 'error' && <span className="text-xs text-red-500 flex items-center gap-1">Save failed. Retrying soon...</span>}
                                    </div>
                                </div>
                            </div>

                            {currentQuestion.question.description && (
                                <div className="prose prose-sm max-w-none text-[#303433] mb-8 bg-white p-6 rounded-xl border border-[#dedbd2] shadow-sm">
                                    {currentQuestion.question.description}
                                </div>
                            )}

                            {/* MCQ rendering */}
                            {currentQuestion.question.type === "MCQ" && (
                                <div className="space-y-3">
                                    {currentQuestion.question.options.map((opt) => {
                                        const isSelected = localAnswers[currentQuestion.id] === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setLocalAnswers(prev => ({ ...prev, [currentQuestion.id]: opt.id }));
                                                    saveAnswer(currentQuestion.id, opt.id, "MCQ");
                                                }}
                                                className={`
                                                    w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                                                    ${isSelected
                                                        ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                                                        : 'border-[#dedbd2] bg-white hover:border-[#a0a19b] hover:bg-gray-50'}
                                                `}
                                            >
                                                {isSelected ? (
                                                    <CheckCircle2 className="text-orange-500 shrink-0" size={20} />
                                                ) : (
                                                    <Circle className="text-[#a0a19b] shrink-0" size={20} />
                                                )}
                                                <span className="font-medium text-[#171a1b]">{opt.text}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Coding rendering */}
                            {currentQuestion.question.type === "CODING" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        {currentQuestion.question.inputFormat && (
                                            <div className="bg-white p-4 rounded-lg border border-[#dedbd2]">
                                                <h3 className="text-xs font-bold text-[#737777] uppercase mb-2">Input Format</h3>
                                                <p className="text-sm font-mono">{currentQuestion.question.inputFormat}</p>
                                            </div>
                                        )}
                                        {currentQuestion.question.outputFormat && (
                                            <div className="bg-white p-4 rounded-lg border border-[#dedbd2]">
                                                <h3 className="text-xs font-bold text-[#737777] uppercase mb-2">Output Format</h3>
                                                <p className="text-sm font-mono">{currentQuestion.question.outputFormat}</p>
                                            </div>
                                        )}
                                    </div>

                                    {currentQuestion.question.constraints && (
                                        <div className="bg-white p-4 rounded-lg border border-[#dedbd2]">
                                            <h3 className="text-xs font-bold text-[#737777] uppercase mb-2">Constraints</h3>
                                            <p className="text-sm font-mono">{currentQuestion.question.constraints}</p>
                                        </div>
                                    )}

                                    <div className="rounded-xl border border-[#303433] overflow-hidden bg-[#1e1e1e]">
                                        <div className="bg-[#2d2d2d] px-4 py-2 text-xs font-mono text-[#a0a19b] border-b border-[#303433] flex justify-between">
                                            <span>solution.py</span>
                                            <span>Language: Python</span>
                                        </div>
                                        <textarea
                                            value={localAnswers[currentQuestion.id] ?? currentQuestion.question.starterCode ?? ""}
                                            onChange={(e) => {
                                                setLocalAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }));
                                                if (saveStatus[currentQuestion.id] === 'saved') {
                                                    setSaveStatus(prev => ({ ...prev, [currentQuestion.id]: 'saving' }));
                                                }
                                            }}
                                            className="w-full h-64 bg-transparent text-[#d4d4d4] p-4 font-mono text-sm resize-none focus:outline-none"
                                            placeholder="Write your python code here..."
                                            spellCheck={false}
                                        />
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div className="border border-[#303433] rounded-xl overflow-hidden bg-[#171a1b]">
                                            <div className="bg-[#2d2d2d] px-4 py-2 text-xs font-mono text-[#a0a19b] border-b border-[#303433]">
                                                Custom Input (stdin)
                                            </div>
                                            <textarea
                                                value={customInput[currentQuestion.id] ?? ""}
                                                onChange={(e) => setCustomInput(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                                                className="w-full h-32 bg-transparent text-[#d4d4d4] p-4 font-mono text-sm resize-none focus:outline-none"
                                                placeholder="Provide stdin..."
                                                spellCheck={false}
                                            />
                                        </div>

                                        <div className="border border-[#303433] rounded-xl overflow-hidden bg-[#171a1b] flex flex-col">
                                            <div className="bg-[#2d2d2d] px-4 py-2 text-xs font-mono text-[#a0a19b] border-b border-[#303433] flex justify-between">
                                                <span>Execution Output</span>
                                                {executionResult[currentQuestion.id] && (
                                                    <span className={executionResult[currentQuestion.id].exitCode === 0 ? "text-emerald-400" : "text-red-400"}>
                                                        Exit: {executionResult[currentQuestion.id].exitCode} | {executionResult[currentQuestion.id].durationMs}ms
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 p-4 font-mono text-sm overflow-auto text-[#d4d4d4] whitespace-pre-wrap">
                                                {isRunning[currentQuestion.id] ? (
                                                    <span className="text-[#a0a19b] flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Executing securely in sandbox...</span>
                                                ) : executionResult[currentQuestion.id] ? (
                                                    <>
                                                        {executionResult[currentQuestion.id].timedOut && (
                                                            <div className="text-red-400 mb-2 font-bold">Execution Timed Out</div>
                                                        )}
                                                        {executionResult[currentQuestion.id].stdout && (
                                                            <div className="text-[#fbfaf6]">{executionResult[currentQuestion.id].stdout}</div>
                                                        )}
                                                        {executionResult[currentQuestion.id].stderr && (
                                                            <div className="text-red-400 mt-2">{executionResult[currentQuestion.id].stderr}</div>
                                                        )}
                                                        {!executionResult[currentQuestion.id].stdout && !executionResult[currentQuestion.id].stderr && !executionResult[currentQuestion.id].timedOut && (
                                                            <span className="text-[#a0a19b] italic">No output</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-[#555955]">Output will appear here</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={() => handleRunCode(currentQuestion.id)}
                                            disabled={isRunning[currentQuestion.id]}
                                            className="px-6 py-2 bg-[#2d2d2d] hover:bg-[#303433] border border-[#555955] rounded-lg font-semibold text-[#fbfaf6] transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isRunning[currentQuestion.id] ? <Loader2 className="animate-spin" size={16} /> : null}
                                            Run Code
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="bg-white border-t border-[#dedbd2] p-4 px-8 flex items-center justify-between shadow-lg z-10">
                    <button
                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-[#303433] hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                        <ChevronLeft size={18} /> Previous
                    </button>

                    <div className="text-sm font-medium text-[#737777]">
                        Question {currentIndex + 1} of {questions.length}
                    </div>

                    <button
                        onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                        disabled={currentIndex === questions.length - 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#171a1b] text-white hover:bg-[#303433] disabled:opacity-50 transition-colors"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                </div>
            </main>
        </div>
    );
}
