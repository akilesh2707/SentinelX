import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type CreateQuestionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export function CreateQuestionModal({ isOpen, onClose, onSuccess }: CreateQuestionModalProps) {
    const [type, setType] = useState<"MCQ" | "CODING">("MCQ");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [defaultMarks, setDefaultMarks] = useState(1);
    const [explanation, setExplanation] = useState("");

    // MCQ specific
    const [options, setOptions] = useState([
        { optionKey: "A", text: "", isCorrect: false, order: 1 },
        { optionKey: "B", text: "", isCorrect: false, order: 2 },
        { optionKey: "C", text: "", isCorrect: false, order: 3 },
        { optionKey: "D", text: "", isCorrect: false, order: 4 },
    ]);

    // Coding specific
    const [starterCode, setStarterCode] = useState("");
    const [inputFormat, setInputFormat] = useState("");
    const [outputFormat, setOutputFormat] = useState("");
    const [constraints, setConstraints] = useState("");
    const [testCases, setTestCases] = useState([
        { input: "", expectedOutput: "", isHidden: false, marks: 1, order: 1 },
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: "instant" });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload: any = {
                type,
                title,
                description,
                topic,
                difficulty,
                defaultMarks,
                explanation,
            };

            if (type === "MCQ") {
                if (!options.some(o => o.isCorrect)) {
                    setError("Please explicitly select a correct answer.");
                    setLoading(false);
                    return;
                }
                payload.options = options;
            } else {
                payload.starterCode = starterCode;
                payload.inputFormat = inputFormat;
                payload.outputFormat = outputFormat;
                payload.constraints = constraints;
                payload.testCases = testCases;
            }

            const res = await fetch("/api/questions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to create question");
            }

            onSuccess();
            resetForm();
            onClose();
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setType("MCQ");
        setTitle("");
        setDescription("");
        setTopic("");
        setDifficulty("Medium");
        setDefaultMarks(1);
        setExplanation("");
        setOptions([
            { optionKey: "A", text: "", isCorrect: false, order: 1 },
            { optionKey: "B", text: "", isCorrect: false, order: 2 },
            { optionKey: "C", text: "", isCorrect: false, order: 3 },
            { optionKey: "D", text: "", isCorrect: false, order: 4 },
        ]);
        setStarterCode("");
        setInputFormat("");
        setOutputFormat("");
        setConstraints("");
        setTestCases([
            { input: "", expectedOutput: "", isHidden: false, marks: 1, order: 1 },
        ]);
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#171a1b]/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#fbfaf6] shadow-2xl"
            >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between border-b border-[#e4e1d8] bg-[#fbfaf6] px-6 py-4 z-10">
                    <h2 className="text-lg font-semibold text-[#171a1b]">Create Question</h2>
                    <button
                        onClick={handleClose}
                        className="rounded-lg p-2 text-[#888a84] transition hover:bg-[#eae7df] hover:text-[#333735]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
                    {error && (
                        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form id="create-question-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* Type Selection */}
                        <div className="flex gap-4">
                            {(["MCQ", "CODING"] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 rounded-xl border p-4 text-center transition ${
                                        type === t
                                            ? "border-orange-500 bg-orange-50 text-[#171a1a]"
                                            : "border-[#d8d5cd] bg-white text-[#171a1a] hover:bg-[#f6f4ef]"
                                    }`}
                                >
                                    <p className="font-semibold text-inherit">{t === "MCQ" ? "Multiple Choice" : "Coding Task"}</p>
                                </button>
                            ))}
                        </div>

                        {/* Basic Details */}
                        <div className="space-y-4 rounded-xl border border-[#e4e1d8] bg-white p-5">
                            <h3 className="font-semibold text-[#202424]">Basic Details</h3>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-[#171a1a]/80">Title</label>
                                <input
                                    required
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-lg border border-[#dcd9d1] bg-[#fbfaf6] px-3 py-2 text-sm text-[#171a1a] placeholder:text-[#171a1a]/50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    placeholder="Question title"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#171a1a]/80">Topic</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="w-full rounded-lg border border-[#dcd9d1] bg-[#fbfaf6] px-3 py-2 text-sm text-[#171a1a] placeholder:text-[#171a1a]/50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                        placeholder="e.g. Arrays, React"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#171a1a]/80">Difficulty</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full rounded-lg border border-[#dcd9d1] bg-[#fbfaf6] px-3 py-2 text-sm text-[#171a1a] placeholder:text-[#171a1a]/50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#171a1a]/80">Default Marks</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={defaultMarks}
                                        onChange={(e) => setDefaultMarks(Number(e.target.value))}
                                        className="w-full rounded-lg border border-[#dcd9d1] bg-[#fbfaf6] px-3 py-2 text-sm text-[#171a1a] placeholder:text-[#171a1a]/50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-[#171a1a]/80">Description</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full rounded-lg border border-[#dcd9d1] bg-[#fbfaf6] px-3 py-2 text-sm text-[#171a1a] placeholder:text-[#171a1a]/50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    placeholder="Detailed question description..."
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-[#171a1a]/80">Explanation (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={explanation}
                                    onChange={(e) => setExplanation(e.target.value)}
                                    className="w-full rounded-lg border border-[#dcd9d1] bg-[#fbfaf6] px-3 py-2 text-sm text-[#171a1a] placeholder:text-[#171a1a]/50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    placeholder="Explanation for the correct answer"
                                />
                            </div>
                        </div>

                        {/* MCQ Options */}
                        {type === "MCQ" && (
                            <div className="space-y-4 rounded-xl border border-[#e4e1d8] bg-white p-5">
                                <h3 className="font-semibold text-[#202424]">Options</h3>
                                <div className="space-y-3">
                                    {options.map((opt, idx) => (
                                        <div key={idx} className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${opt.isCorrect ? "border-orange-500 bg-orange-50 text-[#171a1a]" : "border-[#dcd9d1] bg-[#fbfaf6] text-[#171a1a]"}`}>
                                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold transition-colors ${opt.isCorrect ? "bg-orange-200 text-orange-900" : "bg-[#e4e1d8] text-[#171a1a]/70"}`}>
                                                {opt.optionKey}
                                            </div>
                                            <input
                                                required
                                                type="text"
                                                value={opt.text}
                                                onChange={(e) => {
                                                    const newOpts = [...options];
                                                    newOpts[idx].text = e.target.value;
                                                    setOptions(newOpts);
                                                }}
                                                placeholder={`Option ${opt.optionKey}`}
                                                className={`flex-1 rounded-md border border-transparent px-3 py-1.5 text-sm outline-none transition-colors bg-transparent text-[#171a1a] placeholder:text-[#171a1a]/50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100`}
                                            />
                                            <label className={`flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium transition-colors ${opt.isCorrect ? "text-[#171a1a]" : "text-[#171a1a]/80"}`}>
                                                <input
                                                    type="radio"
                                                    name="correctOption"
                                                    checked={opt.isCorrect}
                                                    onChange={() => {
                                                        const newOpts = options.map((o, i) => ({
                                                            ...o,
                                                            isCorrect: i === idx,
                                                        }));
                                                        setOptions(newOpts);
                                                    }}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                                                />
                                                Correct
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Coding Details */}
                        {type === "CODING" && (
                            <div className="space-y-6">
                                <div className="space-y-4 rounded-xl border border-[#e4e1d8] bg-white p-5">
                                    <h3 className="font-semibold text-[#202424]">Coding Details</h3>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-medium text-[#171a1a]/80">Input Format</label>
                                            <textarea
                                                rows={2}
                                                value={inputFormat}
                                                onChange={(e) => setInputFormat(e.target.value)}
                                                className="w-full rounded-lg border border-[#dcd9d1] bg-[#fbfaf6] px-3 py-2 text-sm text-[#171a1a] placeholder:text-[#171a1a]/50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-medium text-[#171a1a]/80">Output Format</label>
                                            <textarea
                                                rows={2}
                                                value={outputFormat}
                                                onChange={(e) => setOutputFormat(e.target.value)}
                                                className="w-full rounded-lg border border-[#dcd9d1] bg-[#fbfaf6] px-3 py-2 text-sm text-[#171a1a] placeholder:text-[#171a1a]/50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-[#171a1a]/80">Constraints</label>
                                        <textarea
                                            rows={2}
                                            value={constraints}
                                            onChange={(e) => setConstraints(e.target.value)}
                                            className="w-full rounded-lg border border-[#dcd9d1] bg-[#fbfaf6] px-3 py-2 text-sm text-[#171a1a] placeholder:text-[#171a1a]/50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-[#171a1a]/80">Starter Code (Optional)</label>
                                        <textarea
                                            rows={4}
                                            value={starterCode}
                                            onChange={(e) => setStarterCode(e.target.value)}
                                            className="w-full rounded-lg border border-[#dcd9d1] bg-[#fbfaf6] px-3 py-2 font-mono text-sm text-[#171a1a] placeholder:text-[#171a1a]/50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                            placeholder="def solution():\n    pass"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-xl border border-[#e4e1d8] bg-white p-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-[#202424]">Test Cases</h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTestCases([
                                                    ...testCases,
                                                    { input: "", expectedOutput: "", isHidden: true, marks: 1, order: testCases.length + 1 },
                                                ]);
                                            }}
                                            className="flex items-center gap-1.5 rounded-lg border border-[#d8d5cd] bg-[#fbfaf6] px-3 py-1.5 text-xs font-semibold text-[#171a1a]/80 transition hover:bg-[#f0ede5]"
                                        >
                                            <Plus size={14} /> Add Test Case
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {testCases.map((tc, idx) => (
                                            <div key={idx} className="relative rounded-lg border border-[#d8d5cd] bg-[#fbfaf6] p-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newTc = testCases.filter((_, i) => i !== idx);
                                                        setTestCases(newTc);
                                                    }}
                                                    className="absolute right-3 top-3 text-[#a0a29b] hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div className="mb-3 flex items-center gap-4 text-sm">
                                                    <span className="font-semibold text-[#171a1a]/80">Test Case {idx + 1}</span>
                                                    <label className="flex items-center gap-1.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={tc.isHidden}
                                                            onChange={(e) => {
                                                                const newTc = [...testCases];
                                                                newTc[idx].isHidden = e.target.checked;
                                                                setTestCases(newTc);
                                                            }}
                                                            className="rounded text-orange-600 focus:ring-orange-500"
                                                        />
                                                        Hidden
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-[#171a1a]/80">Marks:</label>
                                                        <input
                                                            required
                                                            type="number"
                                                            min="0"
                                                            value={tc.marks}
                                                            onChange={(e) => {
                                                                const newTc = [...testCases];
                                                                newTc[idx].marks = Number(e.target.value);
                                                                setTestCases(newTc);
                                                            }}
                                                            className="w-16 rounded border border-[#dcd9d1] bg-white px-2 py-1 outline-none focus:border-orange-400"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-[#171a1a]/70">Input</label>
                                                        <textarea
                                                            required
                                                            rows={2}
                                                            value={tc.input}
                                                            onChange={(e) => {
                                                                const newTc = [...testCases];
                                                                newTc[idx].input = e.target.value;
                                                                setTestCases(newTc);
                                                            }}
                                                            className="w-full rounded border border-[#dcd9d1] bg-white px-3 py-2 font-mono text-xs outline-none focus:border-orange-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-[#171a1a]/70">Expected Output</label>
                                                        <textarea
                                                            required
                                                            rows={2}
                                                            value={tc.expectedOutput}
                                                            onChange={(e) => {
                                                                const newTc = [...testCases];
                                                                newTc[idx].expectedOutput = e.target.value;
                                                                setTestCases(newTc);
                                                            }}
                                                            className="w-full rounded border border-[#dcd9d1] bg-white px-3 py-2 font-mono text-xs outline-none focus:border-orange-400"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-[#e4e1d8] bg-[#f6f4ef] px-6 py-4 z-10">
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-[#171a1a]/80 hover:bg-[#e4e1d8]"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="create-question-form"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Question"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
