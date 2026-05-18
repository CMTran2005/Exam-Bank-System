/**
 * @file EssayForm.jsx
 * @description Biểu mẫu nhập liệu dành riêng cho Câu hỏi dạng "Tự luận đơn".
 * Hỗ trợ giáo viên soạn thảo Hướng dẫn chấm/Lời giải mẫu, và tải kèm các hình ảnh giải thích minh họa.
 */

"use client";

import RichTextarea from "./RichTextarea";
import LatexRenderer from "@/components/shared/LatexRenderer";
import { ImagePlus, X } from "lucide-react";

/**
 * Component chính của biểu mẫu Câu hỏi Tự luận Đơn.
 * @param {object} questionData - Trạng thái dữ liệu của câu hỏi
 * @param {function} setQuestionData - Hàm cập nhật dữ liệu câu hỏi
 */
export default function EssayForm({ questionData, setQuestionData }) {
    const handleSolutionImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const cur = questionData.solution_images || [];
                setQuestionData({ ...questionData, solution_images: [...cur, reader.result] });
            };
        });
    };

    const removeSolutionImage = (idx) => {
        const cur = questionData.solution_images || [];
        setQuestionData({ ...questionData, solution_images: cur.filter((_, i) => i !== idx) });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Lời giải gợi ý / Hướng dẫn chấm bài:</label>
                <RichTextarea
                    id={`essay-sol-${questionData.id}`}
                    placeholder="Nhập lời giải chi tiết, đáp số hoặc các bước phân tích chấm điểm tự luận tại đây..."
                    value={questionData.suggested_solution || ""}
                    onChange={(val) => setQuestionData({ ...questionData, suggested_solution: val })}
                    rows={5}
                />
                {questionData.suggested_solution && questionData.suggested_solution.includes("$") && (
                    <div className="mt-2 p-3.5 rounded-xl border border-blue-150 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/15 space-y-1.5 animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block select-none">
                            Xem trước lời giải (Word Equation View):
                        </span>
                        <div className="text-sm font-medium text-foreground">
                            <LatexRenderer text={questionData.suggested_solution} />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2 bg-slate-50/50 dark:bg-slate-900/20 p-3 rounded-lg border border-border/80">
                <label className="text-xs font-semibold text-muted-foreground block">
                    Hình ảnh minh họa lời giải (nếu có):
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                    <label className="h-16 w-16 flex flex-col items-center justify-center border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors bg-background">
                        <ImagePlus className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground mt-0.5 font-medium">Thêm ảnh</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleSolutionImageChange} />
                    </label>
                    {(questionData.solution_images || []).map((img, idx) => (
                        <div key={idx} className="relative h-16 w-16 border border-border rounded-lg overflow-hidden bg-muted shadow-sm">
                            <img src={img} alt="Lời giải minh họa" className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeSolutionImage(idx)}
                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
