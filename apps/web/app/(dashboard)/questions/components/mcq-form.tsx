"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

type McqOption = {
    optionKey: string;
    text: string;
    isCorrect: boolean;
    order: number;
};

type McqFormProps = {
    data: any;
    onChange: (data: any) => void;
};

const DEFAULT_OPTIONS: McqOption[] = [
    { optionKey: "A", text: "", isCorrect: true, order: 1 },
    { optionKey: "B", text: "", isCorrect: false, order: 2 },
    { optionKey: "C", text: "", isCorrect: false, order: 3 },
    { optionKey: "D", text: "", isCorrect: false, order: 4 },
];

export function McqForm({ data, onChange }: McqFormProps) {
    const [options, setOptions] = useState<McqOption[]>(
        data?.options || DEFAULT_OPTIONS
    );

    // Sync upward
    useEffect(() => {
        onChange({ options });
    }, [options, onChange]);

    const handleOptionTextChange = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index].text = text;
        setOptions(newOptions);
    };

    const handleSetCorrect = (index: number) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index,
        }));
        setOptions(newOptions);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-text-primary mb-1">Multiple Choice Options</h3>
                <p className="text-sm text-text-secondary">Provide exactly 4 options and select the correct answer.</p>
            </div>

            <div className="grid gap-4">
                {options.map((opt, index) => (
                    <div
                        key={opt.optionKey}
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                            opt.isCorrect
                                ? "bg-signal/5 border-signal"
                                : "bg-graphite border-border"
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => handleSetCorrect(index)}
                            className={`mt-2 flex-shrink-0 transition-colors ${
                                opt.isCorrect ? "text-signal" : "text-text-secondary hover:text-text-primary"
                            }`}
                            title="Mark as correct"
                        >
                            {opt.isCorrect ? (
                                <CheckCircle2 size={24} />
                            ) : (
                                <Circle size={24} />
                            )}
                        </button>

                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                Option {opt.optionKey}
                                {opt.isCorrect && <span className="text-signal text-xs">(Correct Answer)</span>}
                            </label>
                            <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => handleOptionTextChange(index, e.target.value)}
                                placeholder={`Enter text for option ${opt.optionKey}`}
                                className={`w-full border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none transition-colors ${
                                    opt.isCorrect 
                                        ? "bg-paper border-signal/30 focus:border-signal" 
                                        : "bg-paper border-border focus:border-text-secondary"
                                }`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
