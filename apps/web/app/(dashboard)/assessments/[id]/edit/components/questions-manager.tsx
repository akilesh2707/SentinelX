"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Search } from "lucide-react";

type Question = {
    id: string; // AssessmentQuestion ID
    questionId: string; // Original Question ID
    title: string;
    type: string;
    difficulty: string;
    marks: number;
    order: number;
};

type QuestionsManagerProps = {
    assessmentId: string;
    status: string;
    assessmentType: string;
    onUpdateTotals: (mcqCount: number, codingCount: number, totalMarks: number) => void;
};

export function QuestionsManager({ assessmentId, status, assessmentType, onUpdateTotals }: QuestionsManagerProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Add Question Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [bankQuestions, setBankQuestions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchQuestions();
        if (status === "DRAFT") {
            fetchBankQuestions();
        }
    }, [assessmentId, status]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/assessments/${assessmentId}/questions`);
            const data = await res.json();
            if (res.ok && data.success) {
                setQuestions(data.questions);
            }
        } catch (err) {
            console.error("Failed to load questions", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBankQuestions = async () => {
        try {
            const res = await fetch("/api/questions");
            const data = await res.json();
            if (res.ok && data.questions) {
                setBankQuestions(data.questions);
            }
        } catch (err) {
            console.error("Failed to load bank questions", err);
        }
    };

    const handleAddQuestions = async () => {
        if (selectedIds.size === 0) return;
        setAdding(true);
        try {
            const res = await fetch(`/api/assessments/${assessmentId}/questions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionIds: Array.from(selectedIds) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            
            await fetchQuestions();
            updateParentTotals();
            setShowAddModal(false);
            setSelectedIds(new Set());
        } catch (err: any) {
            alert(err.message || "Failed to add questions");
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (questionId: string) => {
        if (!confirm("Remove this question?")) return;
        try {
            const res = await fetch(`/api/assessments/${assessmentId}/questions/${questionId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                await fetchQuestions();
                updateParentTotals();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateMarks = async (questionId: string, marks: number) => {
        try {
            const res = await fetch(`/api/assessments/${assessmentId}/questions/${questionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ marks })
            });
            if (res.ok) {
                setQuestions(qs => qs.map(q => q.questionId === questionId ? { ...q, marks } : q));
                updateParentTotals();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === questions.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const q1 = questions[index];
        const q2 = questions[newIndex];

        // Optimistic update
        const newQuestions = [...questions];
        newQuestions[index] = { ...q2, order: q1.order };
        newQuestions[newIndex] = { ...q1, order: q2.order };
        setQuestions(newQuestions);

        const newQuestionIds = newQuestions.map(q => q.questionId);

        try {
            const res = await fetch(`/api/assessments/${assessmentId}/questions`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionIds: newQuestionIds })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            // Optionally set the updated questions from response
            if (data.questions) setQuestions(data.questions);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to reorder questions");
            fetchQuestions(); // Revert on failure
        }
    };

    const updateParentTotals = async () => {
        try {
            const res = await fetch(`/api/assessments/${assessmentId}`);
            const data = await res.json();
            if (res.ok && data.success && data.assessment) {
                onUpdateTotals(
                    data.assessment.mcqCount,
                    data.assessment.codingCount,
                    data.assessment.totalMarks
                );
            }
        } catch (err) {
            console.error("Failed to sync totals", err);
        }
    };

    const isReadOnly = status !== "DRAFT";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black/45">Questions</h3>
                {!isReadOnly && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 rounded-lg bg-[#f15b1f] px-4 py-2 text-xs font-semibold text-white"
                    >
                        <Plus size={14} /> Add from Bank
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center p-8 text-sm text-black/50">Loading questions...</div>
            ) : questions.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-black/20 rounded-xl text-sm text-black/50">
                    No questions attached.
                </div>
            ) : (
                <div className="space-y-3">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="flex items-center justify-between p-4 bg-white border border-black/10 rounded-xl">
                            <div className="flex-1">
                                <div className="text-sm font-semibold">{q.title}</div>
                                <div className="text-[11px] text-black/50 mt-1 flex items-center gap-2">
                                    <span className={q.type === 'MCQ' ? 'text-blue-600' : 'text-purple-600'}>{q.type}</span>
                                    <span>•</span>
                                    <span>{q.difficulty}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-black/50">Marks:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        disabled={isReadOnly}
                                        value={q.marks}
                                        onChange={(e) => handleUpdateMarks(q.questionId, Number(e.target.value))}
                                        className="w-16 p-1 text-sm border border-black/10 rounded disabled:opacity-50"
                                    />
                                </div>
                                {!isReadOnly && (
                                    <div className="flex items-center gap-1">
                                        <div className="flex flex-col gap-0.5 mr-2">
                                            <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="p-0.5 hover:bg-black/5 rounded disabled:opacity-30"><ArrowUp size={14}/></button>
                                            <button onClick={() => handleMove(idx, 'down')} disabled={idx === questions.length - 1} className="p-0.5 hover:bg-black/5 rounded disabled:opacity-30"><ArrowDown size={14}/></button>
                                        </div>
                                        <button onClick={() => handleRemove(q.questionId)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-black/10 flex justify-between items-center bg-[#faf8f3]">
                            <h3 className="text-lg font-bold">Add Questions</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-black/50 hover:text-black">Cancel</button>
                        </div>
                        <div className="p-6 border-b border-black/10">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                                <input
                                    placeholder="Search by title..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-black/10 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-2">
                            {bankQuestions
                                .filter(bq => !questions.some(q => q.questionId === bq.id))
                                .filter(bq => {
                                    if (assessmentType === "mcq" && bq.type !== "MCQ") return false;
                                    if (assessmentType === "coding" && bq.type !== "CODING") return false;
                                    return true;
                                })
                                .filter(bq => bq.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(bq => (
                                <label key={bq.id} className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${selectedIds.has(bq.id) ? 'border-[#f15b1f] bg-[#fff7f1]' : 'border-black/10 hover:border-black/20'}`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(bq.id)}
                                        onChange={(e) => {
                                            const newIds = new Set(selectedIds);
                                            if (e.target.checked) newIds.add(bq.id);
                                            else newIds.delete(bq.id);
                                            setSelectedIds(newIds);
                                        }}
                                        className="h-4 w-4 accent-[#f15b1f]"
                                    />
                                    <div>
                                        <div className="text-sm font-semibold">{bq.title}</div>
                                        <div className="text-xs text-black/50">{bq.type} • {bq.defaultMarks} Marks</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="p-6 border-t border-black/10 bg-[#faf8f3] flex justify-end">
                            <button
                                onClick={handleAddQuestions}
                                disabled={selectedIds.size === 0 || adding}
                                className="px-6 py-2 bg-[#f15b1f] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                            >
                                {adding ? "Adding..." : `Add Selected (${selectedIds.size})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
