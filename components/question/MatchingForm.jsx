/**
 * @file MatchingForm.jsx
 * @description Biểu mẫu nhập liệu dành riêng cho Câu hỏi dạng "Nối từ / Ghép cặp".
 * Hỗ trợ giáo viên nhập nội dung cho 2 cột (Trái - Phải).
 */

"use client";

import RichInput from "./RichInput";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import LatexRenderer from "@/components/shared/LatexRenderer";

export default function MatchingForm({ questionData, setQuestionData }) {

    const handlePairChange = (index, field, value) => {
        const newPairs = [...questionData.pairs];
        newPairs[index][field] = value;
        setQuestionData({ ...questionData, pairs: newPairs });
    };

    const addPair = () => {
        setQuestionData({
            ...questionData,
            pairs: [...questionData.pairs, { id: Date.now().toString(), left: "", right: "" }]
        });
    };

    const removePair = (index) => {
        const newPairs = questionData.pairs.filter((_, i) => i !== index);
        setQuestionData({ ...questionData, pairs: newPairs });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">
                    Danh sách các cặp ghép nối (Cột Trái ➜ Cột Phải)
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addPair}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Thêm cặp
                </Button>
            </div>

            <div className="space-y-2.5">
                {questionData.pairs.map((pair, idx) => (
                    <div
                        key={pair.id}
                        className="rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50/10 dark:bg-cyan-950/10 transition-all duration-150 overflow-hidden"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 px-3 py-3">
                            <span className="font-bold text-sm text-cyan-600 dark:text-cyan-400 w-5 shrink-0 text-center sm:text-right">
                                {idx + 1}.
                            </span>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <RichInput
                                            id={`pair-left-${questionData.id}-${idx}`}
                                            placeholder="Vế trái (Ví dụ: Apple)"
                                            value={pair.left}
                                            onChange={(val) => handlePairChange(idx, "left", val)}
                                            className="bg-background border-cyan-200 focus-visible:ring-cyan-500"
                                        />
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mx-1" />
                                    <div className="flex-1">
                                        <RichInput
                                            id={`pair-right-${questionData.id}-${idx}`}
                                            placeholder="Vế phải (Ví dụ: Quả táo)"
                                            value={pair.right}
                                            onChange={(val) => handlePairChange(idx, "right", val)}
                                            className="bg-background border-cyan-200 focus-visible:ring-cyan-500"
                                        />
                                    </div>
                                </div>
                                
                                {(pair.left?.includes("$") || pair.right?.includes("$")) && (
                                    <div className="px-3 py-2 bg-background border border-dashed border-cyan-200/60 rounded text-xs text-muted-foreground flex items-center gap-2 select-none">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200/50 shrink-0">
                                            LaTeX
                                        </span>
                                        <div className="flex-1 flex gap-2 overflow-x-auto font-medium text-foreground">
                                            {pair.left?.includes("$") && <LatexRenderer text={pair.left} />}
                                            {(pair.left?.includes("$") && pair.right?.includes("$")) && <ArrowRight className="w-3 h-3 text-cyan-400" />}
                                            {pair.right?.includes("$") && <LatexRenderer text={pair.right} />}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {questionData.pairs.length > 2 && (
                                <button
                                    type="button"
                                    title="Xóa cặp này"
                                    onClick={() => removePair(idx)}
                                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors bg-background"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
