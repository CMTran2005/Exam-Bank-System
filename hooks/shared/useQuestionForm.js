import { useState } from "react";
import { toast } from "sonner";

/**
 * Hàm useQuestionForm
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any} question - Tham số đầu vào
 * @returns {any}
 */
export function useQuestionForm(question, onChangeData) {
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [aiTaggingLoading, setAiTaggingLoading] = useState(false);

    const updateField = (field, value) => {
        onChangeData({ ...question, [field]: value });
    };

    const handleAITagging = async () => {
        if (!question.content || !question.content.trim()) {
            toast.error("Vui lòng nhập nội dung đề bài trước khi yêu cầu gợi ý thẻ.");
            return;
        }

        setAiTaggingLoading(true);
        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate_tags",
                    content: question.content,
                    type: question.type
                })
            });

            const data = await response.json();
            if (data.error) {
                toast.error("Lỗi máy chủ: " + data.error);
                return;
            }

            const updatedQuestion = { ...question };
            if (data.tags && Array.isArray(data.tags)) {
                const currentTags = question.tags || [];
                const merged = Array.from(new Set([...currentTags, ...data.tags]));
                updatedQuestion.tags = merged;
            }
            if (data.difficulty) {
                updatedQuestion.difficulty = data.difficulty;
            }

            onChangeData(updatedQuestion);
        } catch (err) {
            console.error("Lỗi gợi ý thẻ:", err);
            toast.error("Lỗi kết nối máy chủ: " + err.message);
        } finally {
            setAiTaggingLoading(false);
        }
    };

    const handleAddManualTag = (e) => {
        if (e.key === "Enter" || e.type === "click") {
            e.preventDefault();
            const trimmed = tagInput.trim();
            if (trimmed) {
                const currentTags = question.tags || [];
                if (!currentTags.includes(trimmed)) {
                    onChangeData({ ...question, tags: [...currentTags, trimmed] });
                }
                setTagInput("");
            }
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        const currentTags = question.tags || [];
        onChangeData({ ...question, tags: currentTags.filter(t => t !== tagToRemove) });
    };

    const handleImageChange = (e, targetField) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        files.forEach((file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const currentImages = question[targetField] || [];
                updateField(targetField, [...currentImages, reader.result]);
            };
        });
        e.target.value = "";
    };

    const removeImage = (indexToRemove, targetField) => {
        const currentImages = question[targetField] || [];
        updateField(targetField, currentImages.filter((_, idx) => idx !== indexToRemove));
    };

    const createPasteHandler = (targetField, customUpdateCallback = null) => async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault();
                setLoading(true);
                const file = items[i].getAsFile();
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = async () => {
                    const base64Image = reader.result;
                    try {
                        const { auth } = await import("@/lib/firebase");
                        const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
                        
                        const response = await fetch("/api/ocr", {
                            method: "POST",
                            headers: { 
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({ image: base64Image }),
                        });
                        const data = await response.json();
                        if (data.error || (!data.content && !data.suggested_solution)) {
                            if (customUpdateCallback) {
                                customUpdateCallback(null, base64Image);
                            } else {
                                const currentImages = Array.isArray(question.images) ? question.images : [];
                                onChangeData({
                                    ...question,
                                    images: [...currentImages, base64Image]
                                });
                            }
                        } else {
                            // Gộp nội dung và lời giải (nếu có) để dán thẳng vào trường mà người dùng đang focus
                            let textToInsert = "";
                            if (data.content) textToInsert += data.content;
                            if (data.suggested_solution) {
                                textToInsert += textToInsert ? `\n\n**Lời giải:**\n${data.suggested_solution}` : data.suggested_solution;
                            }
                            
                            if (customUpdateCallback) {
                                customUpdateCallback(textToInsert, null);
                            } else {
                                const currentText = question[targetField] || "";
                                onChangeData({
                                    ...question,
                                    [targetField]: currentText ? `${currentText}\n${textToInsert}` : textToInsert
                                });
                            }
                        }
                    } catch (err) {
                        console.error("Lỗi gọi API dán ảnh, giữ nguyên ảnh gốc:", err);
                        if (customUpdateCallback) {
                            customUpdateCallback(null, base64Image);
                        } else {
                            const currentImages = Array.isArray(question.images) ? question.images : [];
                            onChangeData({
                                ...question,
                                images: [...currentImages, base64Image]
                            });
                        }
                    } finally {
                        setLoading(false);
                    }
                };
            }
        }
    };

    const [aiGeneratingSolution, setAiGeneratingSolution] = useState(false);

    const handleGenerateSolution = async (customQuestion = null, customUpdateCallback = null) => {
        const targetQuestion = customQuestion || question;
        if (!targetQuestion.content || !targetQuestion.content.trim()) {
            return toast.error("Nội dung câu hỏi đang trống. Không thể sinh lời giải.");
        }

        setAiGeneratingSolution(true);
        try {
            const { auth } = await import("@/lib/firebase");
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";

            const payload = {
                action: "generate_solution",
                type: targetQuestion.type,
                content: targetQuestion.content,
                choices: targetQuestion.options || targetQuestion.statements?.map(s => s.text) || []
            };

            const response = await fetch("/api/ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            if (customUpdateCallback) {
                customUpdateCallback(data);
            } else {
                const updates = { suggested_solution: data.suggested_solution || "" };
                
                if (targetQuestion.type === "multiple_choice" && data.correct_choice_index !== undefined && data.correct_choice_index !== null) {
                    const letters = ["A", "B", "C", "D"];
                    if (data.correct_choice_index >= 0 && data.correct_choice_index < 4) {
                        updates.correct_answer = letters[data.correct_choice_index];
                    }
                } else if (targetQuestion.type === "essay" && data.final_answer) {
                    updates.final_answer = data.final_answer;
                } else if (targetQuestion.type === "true_false" && Array.isArray(data.final_answer)) {
                    if (targetQuestion.statements && targetQuestion.statements.length === data.final_answer.length) {
                        updates.statements = targetQuestion.statements.map((stmt, i) => ({
                            ...stmt,
                            correct: !!data.final_answer[i]
                        }));
                    }
                }

                onChangeData({ ...targetQuestion, ...updates });
            }
            toast.success("Đã sinh lời giải tự động thành công!");
        } catch (error) {
            console.error("Lỗi sinh lời giải AI:", error);
            toast.error(error.message || "Không thể sinh lời giải, vui lòng thử lại.");
        } finally {
            setAiGeneratingSolution(false);
        }
    };

    return {
        loading, tagInput, setTagInput, aiTaggingLoading, aiGeneratingSolution,
        updateField, handleAITagging, handleAddManualTag, handleRemoveTag,
        handleImageChange, removeImage, createPasteHandler, handleGenerateSolution
    };
}
