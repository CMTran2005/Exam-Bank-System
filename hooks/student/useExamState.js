import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import localforage from "localforage";
import { examService } from "@/services/examService";
import { examAttemptService } from "@/services/examAttemptService";
import { flashcardService } from "@/services/flashcardService";
import { classService } from "@/services/classService";
import { getShuffleMap } from "@/lib/shuffleUtils";

export function useExamState(examId, classId, isPracticeMode, currentUser, confirmDialog) {
    const router = useRouter();

    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [shuffleMap, setShuffleMap] = useState({});
    const [pastAttemptsCount, setPastAttemptsCount] = useState(0);

    const [answers, setAnswers] = useState({});
    const [reviewMarks, setReviewMarks] = useState({});
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [currentSubQuestionIdx, setCurrentSubQuestionIdx] = useState(0);

    const [practiceResults, setPracticeResults] = useState({});
    const [isTimerEnabled, setIsTimerEnabled] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showQuestionMap, setShowQuestionMap] = useState(false);

    const timerRef = useRef(null);
    const autoSaveTimerRef = useRef(null);
    const lastSavedAnswersRef = useRef({});
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
    }, [examId, classId, currentUser, router, isPracticeMode, isTimerEnabled]);

    useEffect(() => {
        if (currentUser && examId && (classId || isPracticeMode)) {
            loadExamData();
        }
    }, [currentUser, examId, classId, isPracticeMode, loadExamData]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && !isSubmitting && isTimerEnabled) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        if (attempt && exam) {
                            if (!isPracticeMode) {
                                handleAutoSubmit(attempt.id, answers, exam);
                            } else {
                                toast.info("Đã hết thời gian chuẩn của đề thi, nhưng bạn vẫn có thể làm tiếp trong chế độ Luyện Tập!");
                            }
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timeLeft, isSubmitting, attempt, answers, exam, isTimerEnabled, isPracticeMode]);

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
    }, [attempt, answers, isSubmitting]);

    // Báo cáo Live Status
    useEffect(() => {
        if (!attempt || isSubmitting) return;

        const reportStatus = () => {
            examAttemptService.updateLiveStatus(attempt.id, {
                currentQuestionIndex: currentQuestionIdx,
                isOnline: navigator.onLine,
                progress: exam?.questions?.length ? Math.round((Object.keys(answers).length / exam.questions.length) * 100) : 0
            });
        };

        // Report on question change
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

    const executeSubmit = async (aId = attempt?.id, ans = answers, ex = exam) => {
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

    const handleAutoSubmit = async (attemptId, currentAnswers, currentExam) => {
        toast.error("Đã hết thời gian làm bài! Hệ thống tự động nộp bài.");
        await executeSubmit(attemptId, currentAnswers, currentExam);
    };

    const saveAnswers = async (updated) => {
        if (!attempt) return;
        
        try {
            await localforage.setItem(`exam_draft_${attempt.id}`, updated);
        } catch (e) {
            console.error("Lỗi lưu IndexedDB:", e);
        }

        if (navigator.onLine) {
            examAttemptService.saveAnswersDraft(attempt.id, updated).catch(() => {});
        }
    };

    const handleSelectAnswer = (questionId, optionIndex) => {
        setAnswers(prev => {
            const updated = { ...prev, [questionId]: optionIndex };
            saveAnswers(updated);
            return updated;
        });
    };

    const handleSelectTrueFalse = (questionId, statementIdx, value) => {
        setAnswers(prev => {
            const currentAns = prev[questionId] || {};
            const updatedAns = { ...currentAns, [statementIdx]: value };
            const updated = { ...prev, [questionId]: updatedAns };
            saveAnswers(updated);
            return updated;
        });
    };

    const handleTextAnswer = (questionId, text) => {
        setAnswers(prev => {
            const updated = { ...prev, [questionId]: text };
            saveAnswers(updated);
            return updated;
        });
    };

    const handleFillBlankAnswer = (questionId, blankIdx, value) => {
        setAnswers(prev => {
            const currentAns = prev[questionId] || {};
            const updatedAns = { ...currentAns, [blankIdx]: value };
            const updated = { ...prev, [questionId]: updatedAns };
            saveAnswers(updated);
            return updated;
        });
    };

    const handleGroupAnswer = (questionId, subQId, subType, value, extraIdx = null) => {
        setAnswers(prev => {
            const currentQAns = prev[questionId] || {};
            let subAns = currentQAns[subQId];
            
            if (subType === 'multiple_choice' || subType === 'essay' || subType === 'matching' || subType === 'ordering') {
                subAns = value;
            } else if (subType === 'true_false' || subType === 'fill_blank') {
                subAns = subAns || {};
                subAns = { ...subAns, [extraIdx]: value };
            }
            
            const updated = { ...prev, [questionId]: { ...currentQAns, [subQId]: subAns } };
            saveAnswers(updated);
            return updated;
        });
    };

    const handleToggleReview = (questionId) => {
        setReviewMarks(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const handleSubmit = async () => {
        const totalQ = exam?.questions?.length || 0;
        let answeredQ = 0;
        exam?.questions?.forEach(q => {
            const ans = answers[q.id];
            const checkAnswerStatus = (type, qAns, qObj) => {
                if (type === 'true_false') {
                    return qAns && Object.keys(qAns).length === (qObj.statements?.length || 0);
                } else if (type === 'fill_blank') {
                    const blanksCount = (qObj.content?.match(/\[\[.*?\]\]/g) || []).length;
                    const ansKeys = qAns ? Object.keys(qAns).filter(k => qAns[k] && qAns[k].trim() !== "") : [];
                    return ansKeys.length === blanksCount && blanksCount > 0;
                } else if (type === 'essay') {
                    return qAns && qAns.trim().length > 0;
                } else {
                    return qAns !== undefined;
                }
            };

            if (q.type?.startsWith('group_')) {
                const subQs = q.subQuestions || [];
                let allSubAns = true;
                if (subQs.length === 0) allSubAns = false;
                subQs.forEach(sub => {
                    if (!checkAnswerStatus(sub.type, ans ? ans[sub.id] : undefined, sub)) {
                        allSubAns = false;
                    }
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
            await executeSubmit();
        }
    };

    const handleCheckAnswer = (qId, subQId = null) => {
        const q = exam.questions.find(x => x.id === qId);
        if (!q) return;

        const cleanAndNormalize = (text) => {
            if (text === undefined || text === null) return "";
            let cleaned = text
                .toString()
                .replace(/<[^>]*>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\$/g, "")
                .trim()
                .toLowerCase()
                .replace(/,/g, ".");

            if (/[\d\+\-\*\/=]/.test(cleaned)) {
                cleaned = cleaned.replace(/\s+/g, "");
            } else {
                cleaned = cleaned.replace(/\s+/g, " ");
            }
            return cleaned;
        };

        const checkSingleQ = (qObj, sAns) => {
            if (qObj.type === 'true_false') {
                const stmts = qObj.statements || [];
                let stmtCorrectCount = 0;
                stmts.forEach((stmt, idx) => {
                    if (sAns && sAns[idx] === stmt.correct) stmtCorrectCount++;
                });
                return (stmtCorrectCount === stmts.length && stmts.length > 0);
            } else if (qObj.type === 'fill_blank') {
                const regex = /\[\[(.*?)\]\]/g;
                const correctAnswers = [];
                let match;
                while ((match = regex.exec(qObj.content || "")) !== null) {
                    correctAnswers.push(cleanAndNormalize(match[1]));
                }
                let blankCorrectCount = 0;
                correctAnswers.forEach((correct, idx) => {
                    const ansStr = cleanAndNormalize(sAns && sAns[idx] || "");
                    if (ansStr === correct) blankCorrectCount++;
                });
                return (blankCorrectCount === correctAnswers.length && correctAnswers.length > 0);
            } else if (qObj.type === 'essay') {
                const finalAns = cleanAndNormalize(qObj.final_answer || "");
                const ansStr = cleanAndNormalize(sAns || "");
                return (finalAns && ansStr === finalAns);
            } else if (qObj.type === 'matching') {
                if (!sAns || !Array.isArray(sAns)) return false;
                let correctCount = 0;
                qObj.pairs?.forEach((pair, idx) => {
                    if (sAns[idx] === pair.id) correctCount++;
                });
                return (correctCount === qObj.pairs?.length && qObj.pairs?.length > 0);
            } else if (qObj.type === 'ordering') {
                if (!sAns || !Array.isArray(sAns)) return false;
                let correctCount = 0;
                qObj.items?.forEach((item, idx) => {
                    if (sAns[idx] === item.id) correctCount++;
                });
                return (correctCount === qObj.items?.length && qObj.items?.length > 0);
            } else {
                const alphabet = ["A", "B", "C", "D", "E", "F"];
                const actualCorrectIndex = alphabet.indexOf(qObj.correct_answer);
                return (sAns === actualCorrectIndex);
            }
        };

        if (subQId) {
            const sub = q.subQuestions?.find(x => x.id === subQId);
            if (!sub) return;
            const studentAns = answers[qId] ? answers[qId][subQId] : undefined;
            const isCorrect = checkSingleQ(sub, studentAns);
            setPracticeResults(prev => ({
                ...prev,
                [`${qId}_${subQId}`]: { checked: true, isCorrect }
            }));
            return;
        }

        const studentAns = answers[qId];
        let isCorrect = false;

        if (q.type?.startsWith('group_')) {
            const subQs = q.subQuestions || [];
            let allSubCorrect = true;
            if (subQs.length === 0) allSubCorrect = false;
            subQs.forEach(sub => {
                const sAns = studentAns ? studentAns[sub.id] : undefined;
                if (!checkSingleQ(sub, sAns)) allSubCorrect = false;
            });
            isCorrect = allSubCorrect;
        } else {
            isCorrect = checkSingleQ(q, studentAns);
        }

        setPracticeResults(prev => ({
            ...prev,
            [qId]: { checked: true, isCorrect }
        }));
    };

    const handleExitPractice = async () => {
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
    };

    const handleReadAloud = (question) => {
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
        textToRead = textToRead.replace(/<[^>]*>?/gm, '');
        textToRead = textToRead.replace(/\[\[.*?\]\]/g, 'chỗ trống');
        textToRead = textToRead.replace(/\$/g, '');

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
    };

    return {
        exam, attempt, answers, reviewMarks, currentQuestionIdx, currentSubQuestionIdx, pastAttemptsCount,
        practiceResults, isTimerEnabled, isSubmitting, timeLeft, loading, isSpeaking, showQuestionMap, shuffleMap,
        setCurrentQuestionIdx, setCurrentSubQuestionIdx, setIsTimerEnabled, setShowQuestionMap,
        handleSelectAnswer, handleSelectTrueFalse, handleTextAnswer, handleFillBlankAnswer, handleGroupAnswer,
        handleToggleReview, handleSubmit, handleCheckAnswer, handleExitPractice, handleReadAloud
    };
}
