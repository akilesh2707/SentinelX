"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Clock3,
    FileCode2,
    FileQuestion,
    ListChecks,
    MoreHorizontal,
    Plus,
    Search,
    Tag,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { CreateQuestionModal } from "./create-question-modal";
import { QuestionDetailsModal } from "./question-details-modal";

type QuestionOption = {
    id: string;
    questionId: string;
    optionKey: string;
    text: string;
    isCorrect: boolean;
    order: number;
    createdAt: string;
};

type CodingTestCase = {
    id: string;
    questionId: string;
    input: string;
    expectedOutput?: string;
    isHidden: boolean;
    marks: number;
    order: number;
    createdAt: string;
};

type Question = {
    id: string;
    type: "MCQ" | "CODING";
    title: string;
    description: string | null;
    topic: string | null;
    difficulty: string;
    defaultMarks: number;
    explanation: string | null;
    starterCode: string | null;
    inputFormat: string | null;
    outputFormat: string | null;
    constraints: string | null;
    options: QuestionOption[];
    testCases: CodingTestCase[];
    createdAt: string;
    updatedAt: string;
};

type Filter = "All" | "MCQ" | "CODING" | "Easy" | "Medium" | "Hard";

const filters: Filter[] = ["All", "MCQ", "CODING", "Easy", "Medium", "Hard"];

const difficultyStyles: Record<string, string> = {
    easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-orange-50 text-orange-700 border-orange-200",
    hard: "bg-red-50 text-red-700 border-red-200",
};

export function QuestionsPage() {
    const [filter, setFilter] = useState<Filter>("All");
    const [search, setSearch] = useState("");

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

    const loadQuestions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/questions");

            if (!response.ok) {
                throw new Error("Failed to load questions");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to load questions");
            }

            setQuestions(data.questions);
        } catch (error) {
            console.error("Failed to load questions:", error);
            setError("Unable to load questions.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    const filteredQuestions = useMemo(() => {
        return questions.filter((question) => {
            const matchesFilter =
                filter === "All" ||
                (filter === "MCQ" && question.type === "MCQ") ||
                (filter === "CODING" && question.type === "CODING") ||
                (filter === "Easy" && question.difficulty.toLowerCase() === "easy") ||
                (filter === "Medium" && question.difficulty.toLowerCase() === "medium") ||
                (filter === "Hard" && question.difficulty.toLowerCase() === "hard");

            const searchText = search.toLowerCase();

            const matchesSearch =
                question.title.toLowerCase().includes(searchText) ||
                (question.topic && question.topic.toLowerCase().includes(searchText));

            return matchesFilter && matchesSearch;
        });
    }, [questions, filter, search]);

    return (
        <main className="min-h-full px-7 py-7 lg:px-9">
            {/* Page heading */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-7"
            >
                <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-orange-600">
                        SENTINELX / QUESTIONS
                    </span>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-700">
                        {questions.length.toString().padStart(2, "0")} TOTAL
                    </span>
                </div>

                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#fbfaf6]">
                            Question Bank
                        </h1>

                        <p className="mt-1 text-sm text-[#a0a19b]">
                            Manage your repository of MCQ and coding questions.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md"
                    >
                        <Plus size={16} />
                        Add Question
                    </button>
                </div>
            </motion.div>

            {/* Overview strip */}
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
            >
                {[
                    ["Total Questions", String(questions.length), FileQuestion],
                    [
                        "MCQs",
                        String(questions.filter((q) => q.type === "MCQ").length),
                        ListChecks,
                    ],
                    [
                        "Coding Tasks",
                        String(questions.filter((q) => q.type === "CODING").length),
                        FileCode2,
                    ],
                ].map(([label, value, Icon]) => {
                    const IconComponent = Icon as typeof FileQuestion;

                    return (
                        <motion.div
                            key={label as string}
                            whileHover={{ y: -2 }}
                            className="rounded-xl border border-[#dedbd2] bg-[#fbfaf6] p-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#92938d]">
                                    {label as string}
                                </span>
                                <IconComponent
                                    size={15}
                                    className="text-[#858780]"
                                />
                            </div>

                            <p className="mt-3 text-2xl font-semibold text-[#202424]">
                                {value as string}
                            </p>
                        </motion.div>
                    );
                })}
            </motion.section>

            {/* Controls */}
            <section className="mb-5 flex flex-col gap-3 rounded-xl border border-[#dedbd2] bg-[#fbfaf6] p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-1">
                    {filters.map((item) => (
                        <button
                            key={item}
                            onClick={() => setFilter(item)}
                            className={`relative rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${filter === item
                                ? "text-orange-700"
                                : "text-[#777974] hover:bg-[#f0ede5]"
                                }`}
                        >
                            {filter === item && (
                                <motion.span
                                    layoutId="question-filter"
                                    className="absolute inset-0 -z-0 rounded-lg bg-orange-50"
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                    }}
                                />
                            )}

                            <span className="relative z-10">{item}</span>
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92938d]"
                    />

                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search questions by title or topic..."
                        className="w-full rounded-lg border border-[#dcd9d1] bg-[#f7f5ef] py-2 pl-9 pr-3 text-xs text-[#303433] outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                </div>
            </section>

            {loading && (
                <div className="mb-5 rounded-xl border border-[#dedbd2] bg-[#fbfaf6] px-5 py-8 text-center">
                    <p className="text-sm font-medium text-[#555955]">
                        Loading questions...
                    </p>
                </div>
            )}

            {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center">
                    <p className="text-sm font-medium text-red-700">
                        {error}
                    </p>
                </div>
            )}

            {/* Questions list */}
            <section className="overflow-hidden rounded-xl border border-[#dedbd2] bg-[#fbfaf6]">
                <div className="border-b border-[#e4e1d8] px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-[#171a1b]">
                                Questions Directory
                            </h2>

                            <p className="mt-0.5 text-[11px] text-[#858680]">
                                {filteredQuestions.length} question
                                {filteredQuestions.length !== 1 ? "s" : ""} displayed
                            </p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-[#e8e5dd]">
                    <AnimatePresence mode="popLayout">
                        {filteredQuestions.map((question, index) => {
                            const difficultyRaw = question.difficulty?.toLowerCase() || "medium";
                            const difficultyStyle = difficultyStyles[difficultyRaw] || difficultyStyles.medium;
                            const difficultyLabel = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1).toLowerCase();

                            return (
                                <motion.article
                                    layout
                                    key={question.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{
                                        delay: index * 0.05,
                                    }}
                                    className="group px-5 py-5 transition-colors hover:bg-[#f6f3ec]"
                                >
                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                                        {/* Main */}
                                        <div className="min-w-0 flex-1">
                                            {/* Top Metadata */}
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-[9px] font-bold tracking-wider text-[#999a94]">
                                                    {question.type}
                                                </span>

                                                <span
                                                    className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold ${difficultyStyle}`}
                                                >
                                                    {difficultyLabel}
                                                </span>

                                                {question.topic && (
                                                    <span className="flex items-center gap-1 rounded-md bg-[#e9e6df] px-2 py-0.5 text-[9px] font-medium text-[#656863]">
                                                        <Tag size={10} />
                                                        {question.topic}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Question Title */}
                                            <h3 className="text-sm font-semibold text-[#252929]">
                                                {question.title}
                                            </h3>

                                            {/* Attributes */}
                                            <p className="mt-1 flex items-center gap-2 text-[11px] font-medium text-[#81837d]">
                                                <span>{question.defaultMarks} {question.defaultMarks === 1 ? 'Mark' : 'Marks'}</span>
                                                <span className="text-[#c0beb7]">•</span>
                                                {question.type === "MCQ" ? (
                                                    <span>{question.options?.length || 0} Options</span>
                                                ) : (
                                                    <span>{question.testCases?.length || 0} Test Cases</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Right side stats */}
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10px] sm:grid-cols-2 xl:w-[250px]">
                                            <div>
                                                <p className="mb-1 uppercase tracking-wider text-[#a0a19b]">
                                                    Type
                                                </p>
                                                <p className="font-medium text-[#393d3c]">
                                                    {question.type === "MCQ" ? "Multiple Choice" : "Coding Challenge"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="mb-1 uppercase tracking-wider text-[#a0a19b]">
                                                    Created
                                                </p>
                                                <p className="flex items-center gap-1 text-xs text-[#555955]">
                                                    <Clock3 size={12} />
                                                    {new Date(question.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 xl:ml-auto">
                                            <button
                                                onClick={() => setSelectedQuestion(question)}
                                                className="rounded-lg border border-[#d8d5cd] px-3 py-2 text-[10px] font-semibold text-[#565a56] transition hover:border-orange-300 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                            >
                                                View Details
                                            </button>

                                            <button
                                                title="More actions (Coming soon)"
                                                className="rounded-lg p-2 text-[#888a84] transition hover:bg-[#eae7df] hover:text-[#333735] focus:outline-none"
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </AnimatePresence>

                    {!loading && filteredQuestions.length === 0 && (
                        <div className="px-5 py-16 text-center">
                            <CheckCircle2
                                size={24}
                                className="mx-auto mb-3 text-[#aaa]"
                            />

                            <p className="text-sm font-medium text-[#555955]">
                                No questions found
                            </p>

                            <p className="mt-1 text-xs text-[#92938d]">
                                Try changing the filter or search term, or add a new question.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <AnimatePresence>
                {isCreateOpen && (
                    <CreateQuestionModal
                        isOpen={isCreateOpen}
                        onClose={() => setIsCreateOpen(false)}
                        onSuccess={() => loadQuestions()}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedQuestion && (
                    <QuestionDetailsModal
                        isOpen={!!selectedQuestion}
                        question={selectedQuestion}
                        onClose={() => setSelectedQuestion(null)}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
