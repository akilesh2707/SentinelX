"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

type TestCase = {
    id?: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    marks: number;
    order: number;
};

type CodingFormProps = {
    data: any;
    onChange: (data: any) => void;
};

export function CodingForm({ data, onChange }: CodingFormProps) {
    const [starterCode, setStarterCode] = useState(data?.starterCode || "");
    const [inputFormat, setInputFormat] = useState(data?.inputFormat || "");
    const [outputFormat, setOutputFormat] = useState(data?.outputFormat || "");
    const [constraints, setConstraints] = useState(data?.constraints || "");
    
    const [testCases, setTestCases] = useState<TestCase[]>(
        data?.testCases || [{ input: "", expectedOutput: "", isHidden: false, marks: 1, order: 1 }]
    );

    useEffect(() => {
        onChange({
            starterCode,
            inputFormat,
            outputFormat,
            constraints,
            testCases,
        });
    }, [starterCode, inputFormat, outputFormat, constraints, testCases, onChange]);

    const addTestCase = () => {
        setTestCases([
            ...testCases,
            { input: "", expectedOutput: "", isHidden: true, marks: 1, order: testCases.length + 1 }
        ]);
    };

    const removeTestCase = (index: number) => {
        if (testCases.length === 1) return;
        const newCases = [...testCases];
        newCases.splice(index, 1);
        // reorder
        newCases.forEach((tc, i) => tc.order = i + 1);
        setTestCases(newCases);
    };

    const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
        const newCases = [...testCases];
        newCases[index] = { ...newCases[index], [field]: value };
        setTestCases(newCases);
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium text-carbon mb-1">Coding Details</h3>
                <p className="text-sm text-carbon/70 mb-4">Configure the environment and problem constraints.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-carbon/80">Input Format</label>
                        <textarea
                            value={inputFormat}
                            onChange={(e) => setInputFormat(e.target.value)}
                            placeholder="e.g. First line contains integer N..."
                            rows={3}
                            className="w-full bg-white border border-border rounded-lg px-4 py-2 text-sm text-carbon placeholder:text-carbon/50 focus:outline-none focus:border-signal resize-y"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-carbon/80">Output Format</label>
                        <textarea
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value)}
                            placeholder="e.g. Print a single integer..."
                            rows={3}
                            className="w-full bg-white border border-border rounded-lg px-4 py-2 text-sm text-carbon placeholder:text-carbon/50 focus:outline-none focus:border-signal resize-y"
                        />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-carbon/80">Constraints</label>
                        <input
                            type="text"
                            value={constraints}
                            onChange={(e) => setConstraints(e.target.value)}
                            placeholder="e.g. 1 <= N <= 10^5"
                            className="w-full bg-white border border-border rounded-lg px-4 py-2 text-sm text-carbon placeholder:text-carbon/50 focus:outline-none focus:border-signal"
                        />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-carbon/80 flex justify-between">
                            Starter Code
                            <span className="text-xs text-carbon/80">Optional</span>
                        </label>
                        <textarea
                            value={starterCode}
                            onChange={(e) => setStarterCode(e.target.value)}
                            placeholder="function solve() {\n  // your code here\n}"
                            rows={6}
                            className="w-full bg-[#0d1117] font-mono border border-border rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-signal resize-y"
                        />
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-medium text-carbon">Test Cases</h3>
                        <p className="text-sm text-carbon/70">At least one test case is required.</p>
                    </div>
                    <button
                        type="button"
                        onClick={addTestCase}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white text-carbon rounded-lg border border-border hover:bg-black/5"
                    >
                        <Plus size={16} />
                        Add Test Case
                    </button>
                </div>
                
                <div className="space-y-4">
                    {testCases.map((tc, index) => (
                        <div key={index} className="bg-[#fbfaf6] border border-border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                                <div className="font-medium text-carbon flex items-center gap-3">
                                    Test Case {index + 1}
                                    <button
                                        type="button"
                                        onClick={() => updateTestCase(index, "isHidden", !tc.isHidden)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            tc.isHidden ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                                        }`}
                                    >
                                        {tc.isHidden ? (
                                            <><EyeOff size={14} /> Hidden</>
                                        ) : (
                                            <><Eye size={14} /> Public</>
                                        )}
                                    </button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-carbon/80">Marks</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={tc.marks}
                                            onChange={(e) => updateTestCase(index, "marks", Number(e.target.value))}
                                            className="w-16 bg-white border border-border rounded px-2 py-1 text-sm text-carbon placeholder:text-carbon/50 focus:outline-none focus:border-signal"
                                        />
                                    </div>
                                    {testCases.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTestCase(index)}
                                            className="p-1.5 text-carbon/50 hover:text-red-500 rounded-md hover:bg-black/5 transition-colors"
                                            title="Remove test case"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-carbon/80">Input</label>
                                    <textarea
                                        value={tc.input}
                                        onChange={(e) => updateTestCase(index, "input", e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#0d1117] font-mono border border-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-signal resize-y"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-carbon/80">Expected Output</label>
                                    <textarea
                                        value={tc.expectedOutput}
                                        onChange={(e) => updateTestCase(index, "expectedOutput", e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#0d1117] font-mono border border-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-signal resize-y"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
