import { examCollaborationService } from "@/services/examCollaborationService";
import { createDefaultSubQuestion } from "@/components/question/GroupQuestionForm";

export const TYPE_CONFIG = {
    multiple_choice: { label: "Trắc nghiệm Đơn", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
    group_multiple_choice: { label: "Trắc nghiệm Nhóm", bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-300 dark:border-violet-700" },
    true_false: { label: "Đúng / Sai Đơn", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
    group_true_false: { label: "Đúng / Sai Nhóm", bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-300 dark:border-teal-700" },
    fill_blank: { label: "Điền khuyết Đơn", bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-700 dark:text-pink-300", border: "border-pink-300 dark:border-pink-700" },
    group_fill_blank: { label: "Điền khuyết Nhóm", bg: "bg-fuchsia-100 dark:bg-fuchsia-900/40", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-300 dark:border-fuchsia-700" },
    essay: { label: "Tự luận Đơn", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
    group_essay: { label: "Tự luận Nhóm", bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
};

export const createDefaultQuestion = (type = "multiple_choice") => {
    const isGroup = type.startsWith("group_");
    const baseType = isGroup ? type.replace("group_", "") : type;

    const base = {
        id: Date.now() + Math.random(),
        type,
        content: "",
        images: [],
        isCollapsed: false,
    };

    if (isGroup) {
        return {
            ...base,
            subQuestions: [createDefaultSubQuestion(baseType)],
        };
    }

    return {
        ...base,
        options: ["", "", "", ""],
        options_images: ["", "", "", ""],
        correct_answer: "A",
        statements: [{ text: "", correct: true }],
        suggested_solution: "",
        points: "1.0",
        difficulty: "nhan_biet",
        final_answer: "",
        answer_images: [],
    };
};

export function useQuestionEditor({ setQuestionsList, examId, isSyncingFromRemote, currentUser, setShowPicker }) {
    const addQuestion = (type) => {
        setQuestionsList((prev) => {
            const updated = [...prev, createDefaultQuestion(type)];
            if (examId && !isSyncingFromRemote.current) examCollaborationService.updateQuestions(examId, updated);
            return updated;
        });
        if (setShowPicker) setShowPicker(false);
    };

    const removeQuestion = (id) => {
        setQuestionsList(prev => {
            const updated = prev.filter((q) => q.id !== id);
            if (examId && !isSyncingFromRemote.current) examCollaborationService.updateQuestions(examId, updated);
            return updated;
        });
    };
    
    const duplicateQuestion = (question) => {
        const newQ = JSON.parse(JSON.stringify(question));
        newQ.id = Date.now() + Math.random();
        if (newQ.number_label) newQ.number_label += " (Bản sao)";
        setQuestionsList(prev => {
            const idx = prev.findIndex(q => q.id === question.id);
            const copy = [...prev];
            copy.splice(idx + 1, 0, newQ);
            if (examId && !isSyncingFromRemote.current) examCollaborationService.updateQuestions(examId, copy);
            return copy;
        });
    };

    const toggleCollapse = (id) => {
        setQuestionsList(prev => {
            const updated = prev.map((q) => q.id === id ? { ...q, isCollapsed: !q.isCollapsed } : q);
            if (examId && !isSyncingFromRemote.current) examCollaborationService.updateQuestions(examId, updated);
            return updated;
        });
    };
    
    const updateQuestionData = (id, updatedData) => {
        setQuestionsList(prev => {
            const updated = prev.map((q) => {
                if (q.id === id) {
                    return { ...q, ...updatedData, lockedBy: currentUser?.uid };
                }
                return q;
            });
            if (examId && !isSyncingFromRemote.current) examCollaborationService.updateQuestions(examId, updated);
            return updated;
        });
        
        // Auto-unlock sau 5 giây
        if (examId && currentUser?.uid) {
            clearTimeout(window[`lockTimer_${id}`]);
            window[`lockTimer_${id}`] = setTimeout(() => {
                setQuestionsList(prev => {
                    const updated = prev.map((q) => {
                        if (q.id === id && q.lockedBy === currentUser.uid) {
                            const { lockedBy, ...rest } = q;
                            return rest;
                        }
                        return q;
                    });
                    const hasChanged = JSON.stringify(prev) !== JSON.stringify(updated);
                    if (hasChanged && !isSyncingFromRemote.current) {
                        examCollaborationService.updateQuestions(examId, updated);
                    }
                    return updated;
                });
            }, 5000);
        }
    };

    return { addQuestion, removeQuestion, duplicateQuestion, toggleCollapse, updateQuestionData };
}
