"use client";

import { useEffect } from "react";
import { Info } from "lucide-react";
import LatexRenderer from "@/components/shared/LatexRenderer";

/**
 * Component FillBlankForm
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  questionData - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function FillBlankForm({ questionData, setQuestionData }) {
    // Tìm tất cả các đoạn text nằm trong dấu ngoặc kép [[ ]]
    const extractBlanks = (text) => {
        if (!text) return [];
        const regex = /\[\[(.*?)\]\]/g;
        const blanks = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            blanks.push(match[1]);
        }
        return blanks;
    };

    const blanks = extractBlanks(questionData.content);

    // Tự động điền các ô trống nhận diện được vào final_answer
    useEffect(() => {
        if (setQuestionData) {
            if (blanks.length > 0) {
                const autoFinalAnswer = blanks.map((b, i) => `${i + 1}. ${b}`).join(" | ");
                if (questionData.final_answer !== autoFinalAnswer) {
                    setQuestionData({ ...questionData, final_answer: autoFinalAnswer });
                }
            } else if (questionData.final_answer) {
                setQuestionData({ ...questionData, final_answer: "" });
            }
        }
    }, [blanks.join("|||"), questionData.final_answer, setQuestionData]);

    return (
        <div className="space-y-4">
            <div className="p-4 rounded-xl border border-pink-200 dark:border-pink-900/50 bg-pink-50/50 dark:bg-pink-950/20 text-sm">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-pink-600 dark:text-pink-400 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                        <p className="font-semibold text-pink-800 dark:text-pink-300">
                            Hướng dẫn tạo câu hỏi Điền khuyết:
                        </p>
                        <p className="text-pink-700/80 dark:text-pink-400/80">
                            Soạn thảo nội dung câu hỏi ở ô phía trên. Đặt những từ/cụm từ mà học sinh cần điền vào bên trong cặp ngoặc vuông kép <strong className="text-pink-600 dark:text-pink-400">[[ ]]</strong>.
                        </p>
                        <div className="bg-background/50 p-2.5 rounded-lg border border-pink-100 dark:border-pink-900/30 font-medium italic text-muted-foreground mt-2">
                            Ví dụ: Thủ đô của Việt Nam là [[Hà Nội]], nằm ở khu vực [[Đông Nam Á]].
                        </div>
                    </div>
                </div>
            </div>

            {blanks.length > 0 && (
                <div className="space-y-3">
                    <div className="p-4 rounded-xl border-2 border-dashed border-pink-200 dark:border-pink-900/50 bg-pink-50/30 dark:bg-pink-950/10">
                        <div className="flex flex-wrap gap-3">
                            {blanks.map((blank, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 pr-4 rounded-lg border border-pink-200 dark:border-pink-900/40 bg-pink-50/80 dark:bg-pink-950/30 shadow-sm w-max transition-all hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-md">
                                    <span className="w-6 h-6 rounded bg-pink-200/60 dark:bg-pink-900/60 flex items-center justify-center font-black text-pink-700 dark:text-pink-400 shrink-0 text-xs">
                                        {idx + 1}
                                    </span>
                                    <div className="font-bold text-pink-950 dark:text-pink-200 text-sm">
                                        <LatexRenderer content={blank} inline={true} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
