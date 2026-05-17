"use client";

import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImagePlus, X } from "lucide-react";

const OPTIONS_LABELS = ["A", "B", "C", "D"];

const OPTION_COLORS = {
    A: { ring: "ring-blue-500", bg: "bg-blue-50   dark:bg-blue-900/40", text: "text-blue-700   dark:text-blue-200", border: "border-blue-300   dark:border-blue-600" },
    B: { ring: "ring-violet-500", bg: "bg-violet-50 dark:bg-violet-900/40", text: "text-violet-700 dark:text-violet-200", border: "border-violet-300 dark:border-violet-600" },
    C: { ring: "ring-amber-500", bg: "bg-amber-50  dark:bg-amber-900/40", text: "text-amber-700  dark:text-amber-200", border: "border-amber-300  dark:border-amber-600" },
    D: { ring: "ring-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-200", border: "border-emerald-300 dark:border-emerald-600" },
};


export default function MultipleChoiceForm({ questionData, setQuestionData }) {

    const handleOptionChange = (index, value) => {
        const newOptions = [...questionData.options];
        newOptions[index] = value;
        setQuestionData({ ...questionData, options: newOptions });
    };

    const handleOptionImageChange = (index, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const newImages = [...(questionData.options_images || ["", "", "", ""])];
            newImages[index] = reader.result;
            setQuestionData({ ...questionData, options_images: newImages });
        };
    };

    const removeOptionImage = (index) => {
        const newImages = [...(questionData.options_images || ["", "", "", ""])];
        newImages[index] = "";
        setQuestionData({ ...questionData, options_images: newImages });
    };

    const optionsImages = questionData.options_images || ["", "", "", ""];

    return (
        <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground block">Các phương án lựa chọn:</label>

            <RadioGroup
                value={questionData.correct_answer}
                onValueChange={(val) => setQuestionData({ ...questionData, correct_answer: val })}
                className="space-y-2"
            >
                {OPTIONS_LABELS.map((label, idx) => {
                    const color = OPTION_COLORS[label];
                    const isSelected = questionData.correct_answer === label;
                    const hasImage = !!optionsImages[idx];

                    return (
                        <div
                            key={label}
                            className={`rounded-lg border transition-all duration-150 ${isSelected
                                ? `${color.bg} ${color.border} ring-1 ${color.ring}`
                                : "border-border bg-muted/30 dark:bg-muted/20 hover:bg-muted/50 dark:hover:bg-muted/40"
                                }`}
                        >
                            {/* Hàng chính: radio + nhãn + input text */}
                            <div className="flex items-center gap-2 px-3 py-2">
                                <RadioGroupItem
                                    value={label}
                                    id={`opt-${label}`}
                                    className="shrink-0"
                                />

                                <span className={`font-bold text-sm w-5 shrink-0 ${isSelected ? color.text : "text-muted-foreground"}`}>
                                    {label}.
                                </span>

                                <Input
                                    id={`opt-input-${label}`}
                                    placeholder={`Nội dung đáp án ${label}...`}
                                    value={questionData.options[idx] || ""}
                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                    className="flex-1 h-9 bg-transparent border-0 shadow-none focus-visible:ring-0 px-2 font-medium placeholder:text-muted-foreground/60"
                                />

                                {!hasImage && (
                                    <label
                                        title={`Thêm ảnh cho đáp án ${label}`}
                                        className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-ring cursor-pointer transition-colors"
                                    >
                                        <ImagePlus className="w-3.5 h-3.5" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleOptionImageChange(idx, e.target.files?.[0])}
                                        />
                                    </label>
                                )}
                            </div>

                            {hasImage && (
                                <div className="px-3 pb-2 flex items-start gap-2">
                                    <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-border bg-muted shrink-0 shadow-sm group">
                                        <img
                                            src={optionsImages[idx]}
                                            alt={`Đáp án ${label}`}
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeOptionImage(idx)}
                                            title="Xóa ảnh này"
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <label
                                        title="Thay ảnh khác"
                                        className="h-8 px-2 flex items-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-ring cursor-pointer transition-colors"
                                    >
                                        <ImagePlus className="w-3 h-3" />
                                        Thay ảnh
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleOptionImageChange(idx, e.target.files?.[0])}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    );
                })}
            </RadioGroup>
        </div>
    );
}
