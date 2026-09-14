import { motion } from "framer-motion";
import { X, CheckCircle2, Circle } from "lucide-react";

type QuestionOption = {
    id: string;
    optionKey: string;
    text: string;
    isCorrect: boolean;
    order: number;
};

type CodingTestCase = {
    id: string;
    input: string;
    expectedOutput?: string;
    isHidden: boolean;
    marks: number;
    order: number;
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
};

type QuestionDetailsModalProps = {
    isOpen: boolean;
    question: Question | null;
    onClose: () => void;
};

export function QuestionDetailsModal({ isOpen, question, onClose }: QuestionDetailsModalProps) {
    if (!isOpen || !question) return null;

    const difficultyStyles: Record<string, string> = {
        easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
        medium: "bg-orange-50 text-orange-700 border-orange-200",
        hard: "bg-red-50 text-red-700 border-red-200",
    };

    const difficultyRaw = question.difficulty.toLowerCase();
    const difficultyStyle = difficultyStyles[difficultyRaw] || difficultyStyles.medium;
    const difficultyLabel = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1).toLowerCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#171a1b]/70 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#fbfaf6] shadow-2xl"
            >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between border-b border-[#e4e1d8] bg-[#fbfaf6] px-6 py-4 z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-[#171a1b]">Question Details</h2>
                        <span className="rounded-md border border-[#d8d5cd] bg-[#f0ede5] px-2 py-0.5 text-[10px] font-semibold text-[#565a56]">
                            {question.type}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-[#888a84] transition hover:bg-[#eae7df] hover:text-[#333735]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-8">
                        {/* Common Information */}
                        <section>
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${difficultyStyle}`}>
                                    {difficultyLabel}
                                </span>
                                {question.topic && (
                                    <span className="rounded-md bg-[#e9e6df] px-2 py-0.5 text-[10px] font-medium text-[#656863]">
                                        {question.topic}
                                    </span>
                                )}
                                <span className="rounded-md bg-[#e9e6df] px-2 py-0.5 text-[10px] font-medium text-[#656863]">
                                    {question.defaultMarks} Marks
                                </span>
                                <span className="rounded-md bg-[#e9e6df] px-2 py-0.5 text-[10px] font-medium text-[#656863]">
                                    Created: {new Date(question.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="mb-2 text-xl font-semibold text-[#171a1b]">{question.title}</h3>

                            {question.description && (
                                <div className="mt-4">
                                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#a0a19b]">Description</h4>
                                    <p className="whitespace-pre-wrap text-sm text-[#303433]">{question.description}</p>
                                </div>
                            )}

                            {question.explanation && (
                                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-700">Explanation</h4>
                                    <p className="text-sm text-blue-900">{question.explanation}</p>
                                </div>
                            )}
                        </section>

                        {/* MCQ Specific */}
                        {question.type === "MCQ" && (
                            <section className="space-y-3 border-t border-[#e4e1d8] pt-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#a0a19b]">Options</h4>
                                <div className="grid gap-3">
                                    {question.options.map((opt) => (
                                        <div
                                            key={opt.id}
                                            className={`flex items-center gap-3 rounded-lg border p-3 ${
                                                opt.isCorrect ? "border-emerald-300 bg-emerald-50" : "border-[#d8d5cd] bg-white"
                                            }`}
                                        >
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#e9e6df] text-xs font-bold text-[#656863]">
                                                {opt.optionKey}
                                            </div>
                                            <p className="flex-1 text-sm text-[#303433]">{opt.text}</p>
                                            {opt.isCorrect && (
                                                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                                    <CheckCircle2 size={16} />
                                                    Correct Answer
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Coding Specific */}
                        {question.type === "CODING" && (
                            <section className="space-y-6 border-t border-[#e4e1d8] pt-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#a0a19b]">Coding Information</h4>

                                {question.starterCode && (
                                    <div>
                                        <h5 className="mb-2 text-[11px] font-semibold text-[#565a56]">Starter Code</h5>
                                        <pre className="overflow-x-auto rounded-lg border border-[#d8d5cd] bg-[#f0ede5] p-3 text-xs text-[#303433]">
                                            <code>{question.starterCode}</code>
                                        </pre>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {question.inputFormat && (
                                        <div>
                                            <h5 className="mb-2 text-[11px] font-semibold text-[#565a56]">Input Format</h5>
                                            <p className="whitespace-pre-wrap rounded-lg border border-[#e4e1d8] bg-white p-3 text-sm text-[#303433]">
                                                {question.inputFormat}
                                            </p>
                                        </div>
                                    )}
                                    {question.outputFormat && (
                                        <div>
                                            <h5 className="mb-2 text-[11px] font-semibold text-[#565a56]">Output Format</h5>
                                            <p className="whitespace-pre-wrap rounded-lg border border-[#e4e1d8] bg-white p-3 text-sm text-[#303433]">
                                                {question.outputFormat}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {question.constraints && (
                                    <div>
                                        <h5 className="mb-2 text-[11px] font-semibold text-[#565a56]">Constraints</h5>
                                        <p className="whitespace-pre-wrap rounded-lg border border-[#e4e1d8] bg-white p-3 text-sm text-[#303433]">
                                            {question.constraints}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <h5 className="mb-3 text-[11px] font-semibold text-[#565a56]">Test Cases ({question.testCases.length})</h5>
                                    <div className="space-y-3">
                                        {question.testCases.map((tc, idx) => (
                                            <div key={tc.id} className="rounded-lg border border-[#d8d5cd] bg-white p-4">
                                                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                                                    <span className="font-semibold text-[#171a1b]">Test Case {tc.order}</span>
                                                    <span className="rounded border border-[#e4e1d8] bg-[#fbfaf6] px-2 py-0.5 text-[#565a56]">
                                                        {tc.marks} Marks
                                                    </span>
                                                    {tc.isHidden ? (
                                                        <span className="rounded bg-orange-50 px-2 py-0.5 font-medium text-orange-700">Hidden Test</span>
                                                    ) : (
                                                        <span className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">Visible Test</span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <div className="mb-1 text-[10px] font-semibold uppercase text-[#a0a19b]">Input</div>
                                                        <pre className="overflow-x-auto rounded border border-[#e4e1d8] bg-[#fbfaf6] p-2 text-[11px]">
                                                            <code>{tc.input}</code>
                                                        </pre>
                                                    </div>
                                                    <div>
                                                        <div className="mb-1 text-[10px] font-semibold uppercase text-[#a0a19b]">Expected Output</div>
                                                        <pre className="overflow-x-auto rounded border border-[#e4e1d8] bg-[#fbfaf6] p-2 text-[11px]">
                                                            {tc.expectedOutput !== undefined ? (
                                                                <code>{tc.expectedOutput}</code>
                                                            ) : (
                                                                <span className="italic text-[#a0a19b]">Hidden for security (Excluded from bulk fetch)</span>
                                                            )}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-[#e4e1d8] bg-[#f6f4ef] px-6 py-4 z-10">
                    <div className="flex items-center justify-end">
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#565a56] shadow-sm ring-1 ring-inset ring-[#d8d5cd] transition hover:bg-[#fbfaf6]"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
