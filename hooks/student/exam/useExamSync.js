import { useEffect, useRef } from "react";
import { toast } from "sonner";
import localforage from "localforage";
import { examAttemptService } from "@/services/examAttemptService";

export function useExamSync(attempt, exam, answers, isSubmitting, currentQuestionIdx, autoSaveTimerRef) {
    const lastSavedAnswersRef = useRef({});

    const saveAnswers = async (updatedAnswers) => {
        if (!attempt) return;
        
        try {
            await localforage.setItem(`exam_draft_${attempt.id}`, updatedAnswers);
        } catch (e) {
            console.error("Lỗi lưu IndexedDB:", e);
        }

        if (navigator.onLine) {
            examAttemptService.saveAnswersDraft(attempt.id, updatedAnswers).catch(() => {});
        }
    };

    useEffect(() => {
        if (attempt && !isSubmitting) {
            autoSaveTimerRef.current = setInterval(() => {
                const currentAnswersStr = JSON.stringify(answers);
                const lastSavedStr = JSON.stringify(lastSavedAnswersRef.current);

                if (currentAnswersStr !== lastSavedStr) {
                    saveAnswers(answers).then(() => {
                        lastSavedAnswersRef.current = answers;
                    }).catch(err => console.error("Auto-save failed", err));
                }
            }, 30000);
        }
        return () => clearInterval(autoSaveTimerRef.current);
    }, [attempt, answers, isSubmitting, autoSaveTimerRef]);

    // Báo cáo Live Status & Xử lý Offline/Online
    useEffect(() => {
        if (!attempt || isSubmitting) return;

        const reportStatus = () => {
            examAttemptService.updateLiveStatus(attempt.id, {
                currentQuestionIndex: currentQuestionIdx,
                isOnline: navigator.onLine,
                progress: exam?.questions?.length ? Math.round((Object.keys(answers).length / exam.questions.length) * 100) : 0
            });
        };

        // Báo cáo ngay khi chuyển câu
        reportStatus();

        const handleOnline = async () => {
            reportStatus();
            try {
                const cachedAnswers = await localforage.getItem(`exam_draft_${attempt.id}`);
                if (cachedAnswers) {
                    await examAttemptService.saveAnswersDraft(attempt.id, cachedAnswers);
                    toast.success("Đã kết nối lại! Đồng bộ dữ liệu Offline thành công.");
                }
            } catch (e) {
                console.error("Lỗi đồng bộ IndexedDB:", e);
            }
        };

        const handleOffline = () => {
            reportStatus();
            toast.warning("Mất kết nối mạng! Tiến độ đang được lưu Offline. Vui lòng KHÔNG đóng trình duyệt.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [attempt, isSubmitting, currentQuestionIdx, answers, exam?.questions?.length]);

    return { saveAnswers };
}
