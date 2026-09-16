"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Pencil, Trash2, Eye } from "lucide-react";
import { QuestionForm } from "./components/question-form";

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [difficultyFilter, setDifficultyFilter] = useState("ALL");
    
    // Simplified preview state
    const [previewQuestion, setPreviewQuestion] = useState<any | null>(null);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/questions");
            if (!res.ok) throw new Error("Failed to load questions");
            const data = await res.json();
            setQuestions(data.questions || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this question?")) return;
        try {
            const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete question");
            setQuestions(questions.filter(q => q.id !== id));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (question: any) => {
        setEditingQuestion(question);
        setShowForm(true);
    };

    const filteredQuestions = questions.filter(q => {
        if (typeFilter !== "ALL" && q.type !== typeFilter) return false;
        if (difficultyFilter !== "ALL" && q.difficulty !== difficultyFilter) return false;
        if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                        Question Bank
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Manage your reusable MCQ and Coding questions
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingQuestion(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-signal text-carbon font-medium rounded-lg hover:bg-signal/90 transition-colors"
                >
                    <Plus size={18} />
                    Create Question
                </button>
            </div>

            {error && (
                <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500">
                    {error}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-graphite border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-signal"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-graphite border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-signal"
                >
                    <option value="ALL">All Types</option>
                    <option value="MCQ">MCQ</option>
                    <option value="CODING">Coding</option>
                </select>
                <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="bg-graphite border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-signal"
                >
                    <option value="ALL">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin h-8 w-8 border-4 border-signal border-t-transparent rounded-full" />
                </div>
            ) : filteredQuestions.length === 0 ? (
                <div className="text-center p-12 border border-border rounded-xl bg-graphite">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface mb-4">
                        <Filter className="text-text-secondary" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-text-primary mb-1">No questions found</h3>
                    <p className="text-text-secondary">Try adjusting your filters or create a new question.</p>
                </div>
            ) : (
                <div className="bg-graphite border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface border-b border-border text-text-secondary">
                            <tr>
                                <th className="px-6 py-4 font-medium">Title</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Topic</th>
                                <th className="px-6 py-4 font-medium">Difficulty</th>
                                <th className="px-6 py-4 font-medium">Marks</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredQuestions.map((q) => (
                                <tr key={q.id} className="hover:bg-surface/50 transition-colors">
                                    <td className="px-6 py-4 text-text-primary font-medium">{q.title}</td>
                                    <td className="px-6 py-4 text-text-secondary">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${q.type === 'MCQ' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                            {q.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary">{q.topic || '-'}</td>
                                    <td className="px-6 py-4 text-text-secondary">{q.difficulty}</td>
                                    <td className="px-6 py-4 text-text-secondary">{q.defaultMarks}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setPreviewQuestion(q)} className="p-2 text-text-secondary hover:text-signal transition-colors" title="Preview">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => handleEdit(q)} className="p-2 text-text-secondary hover:text-signal transition-colors" title="Edit">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(q.id)} className="p-2 text-text-secondary hover:text-red-500 transition-colors" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
                    <div className="w-full max-w-3xl bg-paper h-full overflow-y-auto shadow-2xl border-l border-border animate-in slide-in-from-right-8 duration-300">
                        <QuestionForm
                            initialData={editingQuestion}
                            onClose={() => setShowForm(false)}
                            onSave={() => {
                                setShowForm(false);
                                fetchQuestions();
                            }}
                        />
                    </div>
                </div>
            )}

            {previewQuestion && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-graphite border border-border rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-text-primary mb-2">{previewQuestion.title}</h2>
                        <div className="flex gap-2 mb-6 text-xs font-mono text-text-secondary">
                            <span className="bg-surface px-2 py-1 rounded">{previewQuestion.type}</span>
                            <span className="bg-surface px-2 py-1 rounded">{previewQuestion.difficulty}</span>
                            <span className="bg-surface px-2 py-1 rounded">{previewQuestion.defaultMarks} Marks</span>
                        </div>
                        {previewQuestion.description && (
                            <div className="mb-6 text-text-secondary whitespace-pre-wrap text-sm border-l-2 border-border pl-4">
                                {previewQuestion.description}
                            </div>
                        )}

                        {previewQuestion.type === "MCQ" && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-text-primary mb-3">Options:</h3>
                                {previewQuestion.options?.map((opt: any) => (
                                    <div key={opt.id} className={`p-4 rounded-lg border ${opt.isCorrect ? 'bg-signal/10 border-signal text-signal' : 'bg-surface border-border text-text-primary'}`}>
                                        <span className="font-bold mr-3">{opt.optionKey}.</span>
                                        {opt.text}
                                    </div>
                                ))}
                            </div>
                        )}

                        {previewQuestion.type === "CODING" && (
                            <div className="space-y-6">
                                {previewQuestion.starterCode && (
                                    <div>
                                        <h3 className="font-semibold text-text-primary mb-2">Starter Code:</h3>
                                        <pre className="p-4 bg-[#0d1117] border border-border rounded-lg text-sm text-gray-300 overflow-x-auto">
                                            {previewQuestion.starterCode}
                                        </pre>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-text-primary mb-2">Test Cases ({previewQuestion.testCases?.length}):</h3>
                                    <div className="space-y-3">
                                        {previewQuestion.testCases?.map((tc: any, i: number) => (
                                            <div key={tc.id} className="p-4 bg-surface border border-border rounded-lg text-sm">
                                                <div className="flex justify-between mb-2">
                                                    <span className="font-medium text-text-primary">Test Case {i + 1} {tc.isHidden && <span className="text-red-400 text-xs ml-2">(Hidden)</span>}</span>
                                                    <span className="text-text-secondary">{tc.marks} Marks</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-xs text-text-secondary mb-1">Input</div>
                                                        <pre className="p-2 bg-[#0d1117] rounded">{tc.input}</pre>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-text-secondary mb-1">Expected Output</div>
                                                        <pre className="p-2 bg-[#0d1117] rounded">{tc.expectedOutput}</pre>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button 
                                onClick={() => setPreviewQuestion(null)}
                                className="px-4 py-2 bg-surface text-text-primary rounded-lg hover:bg-surface/80"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
