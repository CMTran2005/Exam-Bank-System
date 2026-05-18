"use client";

import { Textarea } from "@/components/ui/textarea";
import LatexRenderer from "@/components/shared/LatexRenderer";

export default function EssayForm({ questionData, setQuestionData }) {
    return (
        <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Lời giải gợi ý / Hướng dẫn chấm bài:</label>
            <Textarea
                placeholder="Nhập lời giải chi tiết, đáp số hoặc các bước phân tích chấm điểm tự luận tại đây..."
                value={questionData.suggested_solution || ""}
                onChange={(e) => setQuestionData({ ...questionData, suggested_solution: e.target.value })}
                rows={5}
                className="font-medium"
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
    );
}
