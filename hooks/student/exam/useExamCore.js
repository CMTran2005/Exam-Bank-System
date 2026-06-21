import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import localforage from "localforage";
import { examService } from "@/services/examService";
import { classService } from "@/services/classService";
import { examAttemptService } from "@/services/examAttemptService";
import { getShuffleMap } from "@/lib/shuffleUtils";

export function useExamCore(examId, classId, isPracticeMode, currentUser, isTimerEnabled, handleAutoSubmit, setTimeLeft, setAnswers) {
    const router = useRouter();
    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [shuffleMap, setShuffleMap] = useState({});
    const [pastAttemptsCount, setPastAttemptsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    const hasInitializedRef = useRef(false);

    const loadExamData = useCallback(async () => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        try {
            const examData = await examService.getExamDetails(examId);
            if (!examData) {
                toast.error("Không tìm thấy đề thi!");
                router.push("/student");
                return;
            }
            if (examData.questions && Array.isArray(examData.questions)) {
                examData.questions = examData.questions.sort((a, b) => (a.order || 0) - (b.order || 0));
            }
            setExam(examData);

            let durationMins = examData.duration || 45;
            if (classId) {
                const classData = await classService.getClassDetails(classId);
                if (!classData) {
                    toast.error("Không tìm thấy lớp học!");
                    router.push("/student");
                    return;
                }
                if (classData.startTime) {
                    const now = new Date().getTime();
                    const start = new Date(classData.startTime).getTime();
                    if (now < start) {
                        toast.error(`Chưa đến giờ thi! Bài thi sẽ bắt đầu lúc ${new Date(classData.startTime).toLocaleString('vi-VN')}`);
                        router.push("/student");
                        return;
                    }
                }
                if (classData.duration) {
                    durationMins = classData.duration;
                }
            }

            const attempts = await examAttemptService.getStudentAttempts(currentUser.uid);
            const previousCompleted = attempts.filter(a => a.examId === examId && a.classId === "practice" && a.status === "completed");
            setPastAttemptsCount(previousCompleted.length);

            let currentAttempt = attempts.find(a => a.examId === examId && a.classId === (classId || "practice") && a.status !== "completed");

            if (!currentAttempt) {
                const completedAttempt = previousCompleted.length > 0 ? previousCompleted[0] : attempts.find(a => a.examId === examId && a.classId === (classId || "practice") && a.status === "completed");

                if (completedAttempt && classId && classId !== "practice") {
                    toast.info("Bạn đã hoàn thành bài thi này rồi.");
                    router.push(`/student/exam/${examId}/result`);
                    return;
                }

                currentAttempt = await examAttemptService.startExam(currentUser.uid, currentUser.name, examId, classId || "practice", examData.title);
            }

            try {
                const cachedAnswers = await localforage.getItem(`exam_draft_${currentAttempt.id}`);
                if (cachedAnswers) {
                    const currentAnsCount = Object.keys(currentAttempt.answers || {}).length;
                    const cachedAnsCount = Object.keys(cachedAnswers).length;
                    if (cachedAnsCount > currentAnsCount) {
                        currentAttempt.answers = cachedAnswers;
                        toast.info("Đã khôi phục đáp án chưa đồng bộ từ lần mất mạng trước.");
                        if (navigator.onLine) {
                            examAttemptService.saveAnswersDraft(currentAttempt.id, cachedAnswers).catch(()=>{});
                        }
                    }
                }
            } catch (e) {
                console.error("Lỗi đọc IndexedDB:", e);
            }

            setAttempt(currentAttempt);
            if (currentAttempt.answers) setAnswers(currentAttempt.answers);

            setShuffleMap(getShuffleMap(currentAttempt.id, examData.questions));

            const startTime = new Date(currentAttempt.startTime).getTime();
            const durationMs = durationMins * 60 * 1000;
            const endTime = startTime + durationMs;
            const now = new Date().getTime();

            let remainingSeconds = Math.floor((endTime - now) / 1000);
            if (remainingSeconds <= 0) {
                remainingSeconds = 0;
                if (!isPracticeMode || (isPracticeMode && isTimerEnabled && false)) {
                    handleAutoSubmit(currentAttempt.id, currentAttempt.answers || {}, examData);
                }
            }
            setTimeLeft(remainingSeconds);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải đề thi");
            setLoading(false);
        }
    }, [examId, classId, currentUser, router, isPracticeMode, isTimerEnabled, handleAutoSubmit, setTimeLeft, setAnswers]);

    useEffect(() => {
        if (currentUser && examId && (classId || isPracticeMode)) {
            loadExamData();
        }
    }, [currentUser, examId, classId, isPracticeMode, loadExamData]);

    return { exam, attempt, shuffleMap, pastAttemptsCount, loading };
}
