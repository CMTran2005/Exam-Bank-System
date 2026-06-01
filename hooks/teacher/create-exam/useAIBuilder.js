import { useState } from "react";
import { toast } from "sonner";
import { useExamUIStore } from "@/store/useExamUIStore";
import { useExamDataStore } from "@/store/useExamDataStore";

/**
 * Hàm useAIBuilder
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  setQuestionsList - Tham số đầu vào
 * @returns {any}
 */
export function useAIBuilder({ setQuestionsList, setShowAIAssistant }) {
    const { aiPromptText, setAiPromptText, aiGenType, setAiGenType } = useExamUIStore();
    const [aiGenerating, setAiGenerating] = useState(false);

    const handleAIGenerateQuestion = async () => {
        if (!aiPromptText.trim()) {
            toast.error("Vui lòng nhập chủ đề hoặc yêu cầu trước khi tạo câu hỏi.");
            return;
        }

        setAiGenerating(true);
        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "generate_question", promptText: aiPromptText, type: aiGenType })
            });

            const data = await response.json();
            if (data.error) {
                toast.error("Lỗi tạo câu hỏi: " + data.error);
                return;
            }

            const newQ = {
                id: Date.now() + Math.random(),
                type: aiGenType,
                content: data.content || "",
                images: [],
                difficulty: data.difficulty || "nhan_biet",
                points: data.points || "1.0",
                suggested_solution: data.suggested_solution || "",
                final_answer: data.final_answer || "",
                answer_images: [],
                isCollapsed: false
            };

            if (aiGenType === "multiple_choice") {
                const labels = ["A", "B", "C", "D"];
                newQ.options = (data.choices || []).map(c => c.text || "");
                newQ.options_images = ["", "", "", ""];
                const correctIdx = (data.choices || []).findIndex(c => c.isCorrect);
                newQ.correct_answer = correctIdx !== -1 ? labels[correctIdx] : "A";
            } else if (aiGenType === "true_false") {
                newQ.subQuestions = (data.subQuestions || []).map(sq => ({
                    id: Date.now() + Math.random() + Math.random(),
                    content: sq.content || "",
                    isCorrect: sq.isCorrect || false,
                    points: sq.points || "0.25"
                }));
            }

            setQuestionsList(prev => [...prev, newQ]);
            setAiPromptText("");
            setShowAIAssistant(false);
            toast.success("Tạo câu hỏi thành công!");
        } catch (err) {
            console.error("Lỗi gọi AI tạo câu hỏi:", err);
            toast.error("Lỗi kết nối AI: " + err.message);
        } finally {
            setAiGenerating(false);
        }
    };

    const handleAIImageParse = async (file) => {
        if (!file) return;

        setAiGenerating(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise(resolve => {
                reader.onload = resolve;
            });
            const base64Data = reader.result;

            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "parse_image_to_questions", image: base64Data })
            });

            const data = await response.json();
            if (data.error) {
                toast.error("Lỗi AI: " + data.error);
                return;
            }

            if (!data.questions || data.questions.length === 0) {
                toast.error("AI không tìm thấy câu hỏi trắc nghiệm nào trong ảnh.");
                return;
            }

            const newQuestions = data.questions.map(q => {
                const newQ = {
                    id: Date.now() + Math.random(),
                    type: "multiple_choice",
                    content: q.content || "",
                    images: [],
                    difficulty: q.difficulty || "nhan_biet",
                    points: q.points || "1.0",
                    suggested_solution: q.suggested_solution || "",
                    final_answer: q.final_answer || "",
                    answer_images: [],
                    isCollapsed: false,
                    options: ["", "", "", ""],
                    options_images: ["", "", "", ""],
                    correct_answer: "A"
                };

                const labels = ["A", "B", "C", "D"];
                if (q.choices && Array.isArray(q.choices)) {
                    newQ.options = q.choices.map(c => c.text || "");
                    const correctIdx = q.choices.findIndex(c => c.isCorrect);
                    if (correctIdx !== -1) {
                        newQ.correct_answer = labels[correctIdx];
                    }
                }
                
                return newQ;
            });

            setQuestionsList(prev => [...prev, ...newQuestions]);
            toast.success(`Đã bóc tách thành công ${newQuestions.length} câu hỏi!`);
        } catch (err) {
            console.error("Lỗi gọi AI bóc tách ảnh:", err);
            toast.error("Lỗi kết nối AI: " + err.message);
        } finally {
            setAiGenerating(false);
        }
    };

    return { aiGenerating, handleAIGenerateQuestion, handleAIImageParse };
}
