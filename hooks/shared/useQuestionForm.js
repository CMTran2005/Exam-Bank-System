import { useState } from "react";
import { toast } from "sonner";

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

    const handlePaste = async (e) => {
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
                        if (data.error || !data.content || !data.content.trim()) {
                            const currentImages = Array.isArray(question.images) ? question.images : [];
                            onChangeData({
                                ...question,
                                images: [...currentImages, base64Image]
                            });
                        } else {
                            onChangeData({
                                ...question,
                                content: question.content ? `${question.content}\n${data.content}` : data.content,
                                suggested_solution: data.suggested_solution
                                    ? (question.suggested_solution ? `${question.suggested_solution}\n${data.suggested_solution}` : data.suggested_solution)
                                    : question.suggested_solution
                            });
                        }
                    } catch (err) {
                        console.error("Lỗi gọi API dán ảnh, giữ nguyên ảnh gốc:", err);
                        const currentImages = Array.isArray(question.images) ? question.images : [];
                        onChangeData({
                            ...question,
                            images: [...currentImages, base64Image]
                        });
                    } finally {
                        setLoading(false);
                    }
                };
            }
        }
    };

    return {
        loading, tagInput, setTagInput, aiTaggingLoading,
        updateField, handleAITagging, handleAddManualTag, handleRemoveTag,
        handleImageChange, removeImage, handlePaste
    };
}
