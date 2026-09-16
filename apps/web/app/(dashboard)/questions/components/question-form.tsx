"use client";

import { useState } from "react";
import { X, Check, Code } from "lucide-react";
import { McqForm } from "./mcq-form";
import { CodingForm } from "./coding-form";

type QuestionFormProps = {
    initialData?: any;
    onClose: () => void;
    onSave: () => void;
};

export function QuestionForm({ initialData, onClose, onSave }: QuestionFormProps) {
    const isEdit = !!initialData;
    const [type, setType] = useState<"MCQ" | "CODING">(initialData?.type || "MCQ");
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [topic, setTopic] = useState(initialData?.topic || "");
    const [difficulty, setDifficulty] = useState(initialData?.difficulty || "EASY");
    const [defaultMarks, setDefaultMarks] = useState(initialData?.defaultMarks || 1);
    const [explanation, setExplanation] = useState(initialData?.explanation || "");

    const [mcqData, setMcqData] = useState(initialData?.type === "MCQ" ? initialData : null);
    const [codingData, setCodingData] = useState(initialData?.type === "CODING" ? initialData : null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        try {
            setError(null);
            setSaving(true);

            if (!title) throw new Error("Title is required");

            let payload: any = {
                title,
                description,
                topic,
                difficulty,
                defaultMarks: Number(defaultMarks),
                explanation,
                type,
            };

            if (type === "MCQ") {
                if (!mcqData?.options || mcqData.options.length !== 4) {
                    throw new Error("MCQ must have exactly 4 options");
                }
                const correctCount = mcqData.options.filter((o: any) => o.isCorrect).length;
                if (correctCount !== 1) {
                    throw new Error("MCQ must have exactly 1 correct option");
                }
                payload.options = mcqData.options;
            } else {
                if (!codingData?.testCases || codingData.testCases.length === 0) {
                    throw new Error("Coding question must have at least 1 test case");
                }
                payload = { ...payload, ...codingData };
            }

            const url = isEdit ? `/api/questions/${initialData.id}` : "/api/questions";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save question");

            onSave();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-border bg-graphite sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-semibold text-text-primary">
                        {isEdit ? "Edit Question" : "Create New Question"}
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">
                        {isEdit ? "Modify existing question details" : "Add a new question to the bank"}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {!isEdit && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => setType("MCQ")}
                            className={`p-4 rounded-xl border text-left transition-all ${type === "MCQ" ? "bg-signal/10 border-signal" : "bg-graphite border-border hover:border-signal/50"}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${type === "MCQ" ? "bg-signal text-carbon" : "bg-surface text-text-secondary"}`}>
                                    <Check size={18} />
                                </div>
                                <span className="font-semibold text-text-primary">Multiple Choice</span>
                            </div>
                            <p className="text-sm text-text-secondary">Standard 4-option question with a single correct answer.</p>
                        </button>

                        <button
                            onClick={() => setType("CODING")}
                            className={`p-4 rounded-xl border text-left transition-all ${type === "CODING" ? "bg-signal/10 border-signal" : "bg-graphite border-border hover:border-signal/50"}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${type === "CODING" ? "bg-signal text-carbon" : "bg-surface text-text-secondary"}`}>
                                    <Code size={18} />
                                </div>
                                <span className="font-semibold text-text-primary">Coding Assessment</span>
                            </div>
                            <p className="text-sm text-text-secondary">Code evaluation with hidden and public test cases.</p>
                        </button>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Question Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Find the maximum element in an array"
                            className="w-full bg-graphite border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-signal"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Description / Problem Statement</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detailed explanation of the question..."
                            rows={4}
                            className="w-full bg-graphite border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-signal resize-y"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Topic</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Arrays, React, SQL"
                                className="w-full bg-graphite border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-signal"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Difficulty</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full bg-graphite border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-signal"
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Default Marks</label>
                            <input
                                type="number"
                                min="1"
                                value={defaultMarks}
                                onChange={(e) => setDefaultMarks(e.target.value)}
                                className="w-full bg-graphite border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-signal"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border">
                    {type === "MCQ" ? (
                        <McqForm data={mcqData} onChange={setMcqData} />
                    ) : (
                        <CodingForm data={codingData} onChange={setCodingData} />
                    )}
                </div>
            </div>

            <div className="p-6 border-t border-border bg-graphite sticky bottom-0 z-10 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-lg border border-border text-text-primary hover:bg-surface transition-colors font-medium"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-lg bg-signal text-carbon font-medium hover:bg-signal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? "Saving..." : "Save Question"}
                </button>
            </div>
        </div>
    );
}
