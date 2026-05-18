/**
 * @file MultipleChoiceForm.jsx
 * @description Biểu mẫu nhập liệu dành riêng cho Câu hỏi dạng "Trắc nghiệm đơn".
 * Hỗ trợ giáo viên nhập nội dung cho 4 phương án lựa chọn (A, B, C, D) và chọn phương án đúng duy nhất.
 */

"use client";

import { Input } from "@/components/ui/input";
import RichInput from "./RichInput";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImagePlus, X } from "lucide-react";
import LatexRenderer from "@/components/shared/LatexRenderer";

const OPTIONS_LABELS = ["A", "B", "C", "D"];

const OPTION_COLORS = {
    A: { ring: "ring-blue-500", bg: "bg-blue-50/60   dark:bg-blue-900/20", text: "text-blue-700   dark:text-blue-200", border: "border-blue-300/80   dark:border-blue-800" },
    B: { ring: "ring-violet-500", bg: "bg-violet-50/60 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-200", border: "border-violet-300/80 dark:border-violet-800" },
    C: { ring: "ring-amber-500", bg: "bg-amber-50/60  dark:bg-amber-900/20", text: "text-amber-700  dark:text-amber-200", border: "border-amber-300/80  dark:border-amber-800" },
    D: { ring: "ring-emerald-500", bg: "bg-emerald-50/60 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-200", border: "border-emerald-300/80 dark:border-emerald-800" },
};

/**
 * Component chính của biểu mẫu Câu hỏi Trắc nghiệm Đơn.
 * @param {object} questionData - Trạng thái dữ liệu của câu hỏi
 * @param {function} setQuestionData - Hàm cập nhật dữ liệu câu hỏi
 */
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
                    const valText = questionData.options[idx] || "";

                    return (
                        <div
                            key={label}
                            className={`rounded-lg border transition-all duration-150 overflow-hidden ${isSelected
                                ? `${color.bg} ${color.border} ring-1 ${color.ring}`
                                : "border-border bg-muted/20 dark:bg-muted/10 hover:bg-muted/40 dark:hover:bg-muted/20"
                                }`}
                        >
                            <div className="flex items-center gap-2.5 px-3.5 py-3">
                                <RadioGroupItem
                                    value={label}
                                    id={`opt-${label}`}
                                    className="shrink-0"
                                />

                                <span className={`font-bold text-sm w-5 shrink-0 ${isSelected ? color.text : "text-muted-foreground"}`}>
                                    {label}.
                                </span>

                                <RichInput
                                    id={`opt-input-${questionData.id}-${label}`}
                                    placeholder={`Nội dung đáp án ${label}...`}
                                    value={valText}
                                    onChange={(val) => handleOptionChange(idx, val)}
                                    className="flex-1 bg-background"
                                />

                                {!hasImage && (
                                    <label
                                        title={`Thêm ảnh cho đáp án ${label}`}
                                        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-ring cursor-pointer transition-colors bg-background dark:bg-slate-900/30"
                                    >
                                        <ImagePlus className="w-4 h-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleOptionImageChange(idx, e.target.files?.[0])}
                                        />
                                    </label>
                                )}
                            </div>

                            {valText && valText.includes("$") && (
                                <div className="px-3.5 py-2.5 bg-slate-50/60 dark:bg-slate-950/40 border-t border-dashed border-border/60 text-xs text-muted-foreground flex items-center gap-2 select-none">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/40 shrink-0">
                                        Xem trước LaTeX
                                    </span>
                                    <div className="flex-1 overflow-x-auto py-0.5 leading-relaxed text-foreground font-medium">
                                        <LatexRenderer text={valText} />
                                    </div>
                                </div>
                            )}

                            {hasImage && (
                                <div className="px-3.5 pb-3 pt-1 flex items-start gap-2.5">
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
                                        className="h-8 px-2 flex items-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-ring cursor-pointer transition-colors bg-background dark:bg-slate-900/30"
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
