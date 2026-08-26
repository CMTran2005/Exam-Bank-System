import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { examAttemptService } from "@/services/examAttemptService";
import { flashcardService } from "@/services/flashcardService";

import { useExamCore } from "./exam/useExamCore";
import { useExamTimer } from "./exam/useExamTimer";
import { useExamAnswers } from "./exam/useExamAnswers";
import { useExamSync } from "./exam/useExamSync";

export function useExamState(examId, classId, isPracticeMode, currentUser, confirmDialog) {
    const router = useRouter();

    // We need refs to pass into our hook callbacks to avoid stale closures
    const attemptRef = useRef(null);
    const examRef = useRef(null);

    // Local UI States
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [currentSubQuestionIdx, setCurrentSubQuestionIdx] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showQuestionMap, setShowQuestionMap] = useState(false);

    // Forward declare functions for circular dependencies
    const executeSubmit = async (aId, ans, ex) => {
        setIsSubmitting(true);
        clearInterval(timerRef.current);
        clearInterval(autoSaveTimerRef.current);

        try {
            await examAttemptService.submitExam(aId, ex.id, currentUser.uid, ans);
            if (currentUser?.uid) {
                await flashcardService.saveMistakes(currentUser.uid, ex, ans).catch(console.error);
            }
            toast.success("Nộp bài thành công!");
            router.push(`/student/exam/${ex.id}/result${isPracticeMode ? '?mode=practice' : ''}`);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi nộp bài. Vui lòng thử lại!");
            setIsSubmitting(false);
        }
    };

    const handleAutoSubmit = useCallback(async (attemptId, currentAnswers, currentExam) => {
        toast.error("Đã hết thời gian làm bài! Hệ thống tự động nộp bài.");
        await executeSubmit(attemptId, currentAnswers, currentExam);
    }, [currentUser, isPracticeMode, router]);

    // 1. Sync & Answers
    const { saveAnswers } = useExamSync(
        null, null, null, false, currentQuestionIdx, useRef(null) 
    ); // Placeholder to be overridden, as useExamSync must be at top level but needs attempt.

    // 2. Answers State
    const { 
        answers, setAnswers, reviewMarks, practiceResults, 
        handleSelectAnswer, handleSelectTrueFalse, handleTextAnswer, handleFillBlankAnswer, handleGroupAnswer, 
        handleToggleReview, handleCheckAnswer
    } = useExamAnswers(examRef, async (updatedAnswers) => {
        // inline saveAnswers to break circular dependency
        if (!attemptRef.current) return;
        try {
            const localforage = (await import("localforage")).default;
            await localforage.setItem(`exam_draft_${attemptRef.current.id}`, updatedAnswers);
        } catch (e) {}
        if (navigator.onLine) {
            examAttemptService.saveAnswersDraft(attemptRef.current.id, updatedAnswers).catch(() => {});
        }
    });

    // 3. Timer State
    const { 
        timeLeft, setTimeLeft, 
        isTimerEnabled, setIsTimerEnabled, 
        isSubmitting, setIsSubmitting, 
        timerRef, autoSaveTimerRef 
    } = useExamTimer(
        attemptRef.current, examRef.current, answers, isPracticeMode, handleAutoSubmit
    );

    // 4. Core State
    const { exam, attempt, shuffleMap, pastAttemptsCount, loading } = useExamCore(
        examId, classId, isPracticeMode, currentUser, 
        isTimerEnabled, handleAutoSubmit, setTimeLeft, setAnswers
    );

    // Update Refs
    attemptRef.current = attempt;
    examRef.current = exam;

    // Actual Sync Hook
    useExamSync(attempt, exam, answers, isSubmitting, currentQuestionIdx, autoSaveTimerRef);

    // 5. Additional Actions
    const handleSubmit = useCallback(async () => {
        const totalQ = exam?.questions?.length || 0;
        let answeredQ = 0;
        exam?.questions?.forEach(q => {
            const ans = answers[q.id];
            const checkAnswerStatus = (type, qAns, qObj) => {
                if (type === 'true_false') return qAns && Object.keys(qAns).length === (qObj.statements?.length || 0);
                if (type === 'fill_blank') {
                    const blanksCount = (qObj.content?.match(/\[\[.*?\]\]/g) || []).length;
                    const ansKeys = qAns ? Object.keys(qAns).filter(k => qAns[k] && qAns[k].trim() !== "") : [];
                    return ansKeys.length === blanksCount && blanksCount > 0;
                }
                if (type === 'essay') return qAns && qAns.trim().length > 0;
                return qAns !== undefined;
            };

            if (q.type?.startsWith('group_')) {
                const subQs = q.subQuestions || [];
                let allSubAns = subQs.length > 0;
                subQs.forEach(sub => {
                    if (!checkAnswerStatus(sub.type, ans ? ans[sub.id] : undefined, sub)) allSubAns = false;
                });
                if (allSubAns) answeredQ++;
            } else {
                if (checkAnswerStatus(q.type, ans, q)) answeredQ++;
            }
        });

        let msg = "Bạn có chắc chắn muốn nộp bài?";
        if (answeredQ < totalQ) {
            msg = `Bạn mới trả lời ${answeredQ}/${totalQ} câu. Các câu chưa trả lời sẽ không có điểm. Xác nhận nộp bài?`;
        }

        if (await confirmDialog(msg, "Xác nhận nộp bài", "Nộp bài", "Xem lại")) {
            await executeSubmit(attempt.id, answers, exam);
        }
    }, [exam, answers, confirmDialog, attempt]);

    const handleExitPractice = useCallback(async () => {
        if (await confirmDialog("Bạn có chắc chắn muốn thoát? Quá trình làm bài hiện tại sẽ bị xóa.", "Thoát luyện tập")) {
            if (attempt?.id) {
                try {
                    await examAttemptService.deleteAttempt(attempt.id);
                } catch (e) {
                    console.error("Lỗi khi xóa attempt luyện tập:", e);
                }
            }
            router.push("/student");
        }
    }, [attempt, confirmDialog, router]);

    const handleReadAloud = useCallback((question) => {
        if (!("speechSynthesis" in window)) {
            toast.error("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.");
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        let textToRead = question.content || "";
        textToRead = textToRead.replace(/<[^>]*>?/gm, '').replace(/\[\[.*?\]\]/g, 'chỗ trống').replace(/\$/g, '');

        if (question.type === "multiple_choice" && question.options) {
            const labels = ["A", "B", "C", "D", "E"];
            textToRead += ". Các phương án là: ";
            question.options.forEach((opt, idx) => {
                let optText = opt.replace(/<[^>]*>?/gm, '').replace(/\$/g, '');
                textToRead += ` Phương án ${labels[idx]}: ${optText}.`;
            });
        }

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = exam?.subject?.toLowerCase().includes("anh") ? "en-US" : "vi-VN";
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    }, [isSpeaking, exam]);

    // Export interface matches the old monolithic hook perfectly
    return {
        exam, attempt, answers, reviewMarks, currentQuestionIdx, currentSubQuestionIdx, pastAttemptsCount,
        practiceResults, isTimerEnabled, isSubmitting, timeLeft, loading, isSpeaking, showQuestionMap, shuffleMap,
        setCurrentQuestionIdx, setCurrentSubQuestionIdx, setIsTimerEnabled, setShowQuestionMap,
        handleSelectAnswer, handleSelectTrueFalse, handleTextAnswer, handleFillBlankAnswer, handleGroupAnswer,
        handleToggleReview, handleSubmit, handleCheckAnswer, handleExitPractice, handleReadAloud
    };
}
