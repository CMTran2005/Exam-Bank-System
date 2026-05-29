import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useExamSync } from "./create-exam/useExamSync";
import { useQuestionEditor } from "./create-exam/useQuestionEditor";
import { useExamUIStore } from "@/store/useExamUIStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useCreateExam(examId = null) {
    const confirmDialog = useConfirm();
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    const {
        showPicker, setShowPicker,
        zenMode, toggleZenMode,
        showAIAssistant, setShowAIAssistant,
        aiPromptText, setAiPromptText,
        aiGenType, setAiGenType
    } = useExamUIStore();

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    const {
        editId, isCodeManuallyEdited, isSyncingFromRemote, activeUsers,
        examInfo, setExamInfo, questionsList, setQuestionsList, lastSaved,
        handleTitleChange, handleCodeChange, handleGradeChange, handleSaveExam
    } = useExamSync({ currentUser, examId, confirmDialog });

    const {
        addQuestion, removeQuestion, duplicateQuestion, toggleCollapse, updateQuestionData
    } = useQuestionEditor({ setQuestionsList, examId, isSyncingFromRemote, currentUser, setShowPicker });


    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleSaveExam();
            } else if (e.altKey && e.key === 'n') {
                e.preventDefault();
                addQuestion("multiple_choice");
            } else if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                if (questionsList.length > 0) {
                    duplicateQuestion(questionsList[questionsList.length - 1]);
                }
            } else if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                setShowAIAssistant(prev => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [examInfo, questionsList, currentUser, editId]);

    // toggleZenMode is now in Zustand store
    return {
        currentUser, loading,
        examInfo, setExamInfo, handleTitleChange, handleCodeChange, handleGradeChange,
        questionsList, setQuestionsList, addQuestion, removeQuestion, toggleCollapse, updateQuestionData, duplicateQuestion,
        showPicker, setShowPicker,
        zenMode, toggleZenMode, lastSaved,
        handleSaveExam,
        activeUsers
    };
}

export * from "./create-exam/useQuestionEditor";
