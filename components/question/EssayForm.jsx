"use client";

import { Textarea } from "@/components/ui/textarea";

export default function EssayForm({ questionData, setQuestionData }) {
    return (
        <div className="space-y-3">
            <label className="text-sm font-semibold">Lời giải gợi ý / Hướng dẫn chấm bài:</label>
            <Textarea
                placeholder="Nhập lời giải chi tiết, đáp số hoặc các bước phân tích chấm điểm tự luận tại đây..."
                value={questionData.suggested_solution || ""}
                onChange={(e) => setQuestionData({ ...questionData, suggested_solution: e.target.value })}
                rows={5}
            />
        </div>
    );
}
