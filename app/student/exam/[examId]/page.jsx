"use client";

import { use } from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Flag, LayoutGrid, ChevronLeft, ChevronRight, LogOut, AlertTriangle, Send, Loader2, CheckCircle2, XCircle, BookOpen, Timer, TimerOff, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classService } from "@/services/classService";
import { examService } from "@/services/examService";
import { examAttemptService } from "@/services/examAttemptService";
import { flashcardService } from "@/services/flashcardService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import LatexRenderer from "@/components/shared/LatexRenderer";
import { useConfirm } from "@/context/ConfirmContext";
import { getShuffleMap } from "@/lib/shuffleUtils";

/**
 * Component ExamInterface
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  params  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function ExamInterface({ params }) {
    const { examId } = use(params);
    const searchParams = useSearchParams();
    const classId = searchParams.get("classId");

    const { currentUser } = useAuth();
    const router = useRouter();
    const confirmDialog = useConfirm();

    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [shuffleMap, setShuffleMap] = useState({});
    const [pastAttemptsCount, setPastAttemptsCount] = useState(0);

    const [answers, setAnswers] = useState({});
    const [reviewMarks, setReviewMarks] = useState({});
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [currentSubQuestionIdx, setCurrentSubQuestionIdx] = useState(0);

    // Quản lý trạng thái (State) của chế độ Luyện tập tự do
    const isPracticeMode = searchParams.get("mode") === "practice";
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
            // Bước 1: Tải cấu trúc đề thi
            const examData = await examService.getExamDetails(examId);
            if (!examData) {
                toast.error("Không tìm thấy đề thi!");
                router.push("/student");
                return;
            }
            // Đảm bảo thứ tự câu hỏi chính xác theo trường 'order'
            if (examData.questions && Array.isArray(examData.questions)) {
                examData.questions = examData.questions.sort((a, b) => (a.order || 0) - (b.order || 0));
            }
            setExam(examData);

            // Bước 0: Xác thực thời gian bắt đầu đối với các đề thi có gắn với lớp học
            let durationMins = examData.duration || 45;
            let classData = null;
            if (classId) {
                classData = await classService.getClassDetails(classId);
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

            // Bước 2: Truy xuất hoặc Khởi tạo phiên làm bài (Attempt)
            const attempts = await examAttemptService.getStudentAttempts(currentUser.uid);

            // Thống kê số lần học sinh đã làm đề này ở chế độ luyện tập
            const previousCompleted = attempts.filter(a => a.examId === examId && a.classId === "practice" && a.status === "completed");
            setPastAttemptsCount(previousCompleted.length);

            // Tìm kiếm các phiên làm bài còn dang dở (chưa được nộp)
            let currentAttempt = attempts.find(a => a.examId === examId && a.classId === (classId || "practice") && a.status !== "completed");

            // Đánh giá tình trạng hoàn thành bài thi
            if (!currentAttempt) {
                const completedAttempt = previousCompleted.length > 0 ? previousCompleted[0] : attempts.find(a => a.examId === examId && a.classId === (classId || "practice") && a.status === "completed");

                // Cơ chế bảo vệ: Không cho phép thi lại nếu là bài thi chính thức (có classId)
                if (completedAttempt && classId && classId !== "practice") {
                    toast.info("Bạn đã hoàn thành bài thi này rồi.");
                    router.push(`/student/exam/${examId}/result`);
                    return;
                }

                // Khởi tạo phiên làm bài mới nếu là chế độ luyện tập hoặc chưa từng tham gia thi
                currentAttempt = await examAttemptService.startExam(currentUser.uid, currentUser.name, examId, classId || "practice", examData.title);
            }

            setAttempt(currentAttempt);
            if (currentAttempt.answers) setAnswers(currentAttempt.answers);

            // Khởi tạo thuật toán xáo trộn câu trả lời (Shuffle Map)
            setShuffleMap(getShuffleMap(currentAttempt.id, examData.questions));

            // Bước 3: Tính toán và đồng bộ thời gian làm bài còn lại
            const startTime = new Date(currentAttempt.startTime).getTime();
            const durationMs = durationMins * 60 * 1000;
            const endTime = startTime + durationMs;
            const now = new Date().getTime();

            let remainingSeconds = Math.floor((endTime - now) / 1000);
            if (remainingSeconds <= 0) {
                remainingSeconds = 0;
                // Tự động nộp bài (Auto-submit) đối với bài thi chính thức khi hết giờ, bỏ qua nếu đang luyện tập
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
    }, [examId, classId, currentUser, router]);

    useEffect(() => {
        if (currentUser && examId && (classId || isPracticeMode)) {
            loadExamData();
        }
    }, [currentUser, examId, classId, isPracticeMode, loadExamData]);

    // Cập nhật bộ đếm ngược thời gian (Countdown Timer)
    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && !isSubmitting && isTimerEnabled) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        // Xử lý sự kiện hết giờ
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

    // Cơ chế tự động lưu nháp (Auto-save) định kỳ: Tối ưu hóa bằng cách chỉ ghi lên Firebase khi phát hiện sự thay đổi
    useEffect(() => {
        if (attempt && !isSubmitting) {
            autoSaveTimerRef.current = setInterval(() => {
                const currentAnswersStr = JSON.stringify(answers);
                const lastSavedStr = JSON.stringify(lastSavedAnswersRef.current);

                if (currentAnswersStr !== lastSavedStr) {
                    examAttemptService.saveAnswersDraft(attempt.id, answers).then(() => {
                        lastSavedAnswersRef.current = answers;
                    }).catch(err => console.error("Auto-save failed", err));
                }
            }, 30000); // Tần suất kiểm tra: 30 giây một lần
        }
        return () => clearInterval(autoSaveTimerRef.current);
    }, [attempt, answers, isSubmitting]);

    // HỆ THỐNG GIÁM SÁT VÀ CHỐNG GIAN LẬN (Anti-cheat)
    useEffect(() => {
        if (isSubmitting || timeLeft <= 0 || !attempt) return;

        // Cơ chế 1: Phát hiện hành vi chuyển tab trình duyệt (Visibility API)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                examAttemptService.logCheat(attempt.id, "Chuyển Tab (Ẩn trình duyệt)");
            }
        };

        // Cơ chế 2: Phát hiện hành vi mất tiêu điểm (Chuyển cửa sổ hoặc ứng dụng khác)
        const handleBlur = () => {
            examAttemptService.logCheat(attempt.id, "Mất Focus (Mở ứng dụng khác)");
        };

        // Cơ chế 3: Vô hiệu hóa các phím tắt sao chép và xem mã nguồn
        const handleContextMenu = (e) => e.preventDefault();
        const handleCopyPaste = (e) => e.preventDefault();

        const handleKeyDown = (e) => {
            // Vô hiệu hóa các công cụ dành cho nhà phát triển (DevTools)
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
                (e.ctrlKey && e.key === "U") ||
                (e.ctrlKey && e.key === "P") || // Vô hiệu hóa tính năng In ấn
                (e.ctrlKey && e.key === "C") || // Vô hiệu hóa tính năng Sao chép
                (e.ctrlKey && e.key === "V")    // Vô hiệu hóa tính năng Dán
            ) {
                e.preventDefault();
                examAttemptService.logCheat(attempt.id, "Cố tình dùng phím tắt cấm");
            }
        };

        // Cơ chế 4: Giám sát DOM để phát hiện các tiện ích mở rộng can thiệp (Extension Detect)
        const observer = new MutationObserver((mutations) => {
            let suspiciousInjected = false;
            for (let mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const tag = node.tagName.toLowerCase();
                        const id = node.id ? node.id.toLowerCase() : "";
                        const cls = (typeof node.className === 'string') ? node.className.toLowerCase() : "";

                        // Phát hiện các Web Components lạ lọt vào (thường chứa dấu gạch ngang)
                        // Loại trừ các class hệ thống hợp lệ của TailwindCSS
                        if (
                            tag === "iframe" ||
                            (tag.includes("-") && !tag.includes("lucide")) ||
                            id.includes("sider") || id.includes("grammarly") || id.includes("chatgpt") ||
                            (cls.includes("sider") && !cls.includes("slider")) ||
                            cls.includes("grammarly") ||
                            cls.includes("extension-")
                        ) {
                            suspiciousInjected = true;
                            // Ẩn phần tử bị can thiệp để vô hiệu hóa tiện ích mở rộng
                            node.style.display = 'none';
                        }
                    }
                });
            }
            if (suspiciousInjected) {
                examAttemptService.logCheat(attempt.id, "Phát hiện tiện ích mở rộng (Extension) can thiệp");
            }
        });

        // Kích hoạt toàn bộ trình lắng nghe sự kiện (Event Listeners)
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("copy", handleCopyPaste);
        document.addEventListener("cut", handleCopyPaste);
        document.addEventListener("paste", handleCopyPaste);
        document.addEventListener("keydown", handleKeyDown);

        // Kích hoạt giám sát biến đổi DOM (MutationObserver)
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            // Giải phóng tài nguyên và các trình lắng nghe khi component bị gỡ (unmount)
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("copy", handleCopyPaste);
            document.removeEventListener("cut", handleCopyPaste);
            document.removeEventListener("paste", handleCopyPaste);
            document.removeEventListener("keydown", handleKeyDown);
            observer.disconnect();
        };
    }, [isSubmitting, timeLeft, attempt]);

    const handleSelectAnswer = (questionId, optionIndex) => {
        setAnswers(prev => {
            const updated = { ...prev, [questionId]: optionIndex };
            if (attempt) examAttemptService.saveAnswersDraft(attempt.id, updated).catch(() => { });
            return updated;
        });
    };

    const handleSelectTrueFalse = (questionId, statementIdx, value) => {
        setAnswers(prev => {
            const currentAns = prev[questionId] || {};
            const updatedAns = { ...currentAns, [statementIdx]: value };
            const updated = { ...prev, [questionId]: updatedAns };
            if (attempt) examAttemptService.saveAnswersDraft(attempt.id, updated).catch(() => { });
            return updated;
        });
    };

    const handleTextAnswer = (questionId, text) => {
        setAnswers(prev => {
            const updated = { ...prev, [questionId]: text };
            if (attempt) examAttemptService.saveAnswersDraft(attempt.id, updated).catch(() => { });
            return updated;
        });
    };

    const handleFillBlankAnswer = (questionId, blankIdx, value) => {
        setAnswers(prev => {
            const currentAns = prev[questionId] || {};
            const updatedAns = { ...currentAns, [blankIdx]: value };
            const updated = { ...prev, [questionId]: updatedAns };
            if (attempt) examAttemptService.saveAnswersDraft(attempt.id, updated).catch(() => { });
            return updated;
        });
    };

    const handleGroupAnswer = (questionId, subQId, subType, value, extraIdx = null) => {
        setAnswers(prev => {
            const currentQAns = prev[questionId] || {};
            let subAns = currentQAns[subQId];
            
            if (subType === 'multiple_choice' || subType === 'essay') {
                subAns = value;
            } else if (subType === 'true_false' || subType === 'fill_blank') {
                subAns = subAns || {};
                subAns = { ...subAns, [extraIdx]: value };
            }
            
            const updated = { ...prev, [questionId]: { ...currentQAns, [subQId]: subAns } };
            if (attempt) examAttemptService.saveAnswersDraft(attempt.id, updated).catch(() => { });
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
        // Kiểm tra câu chưa làm
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

    const handleAutoSubmit = async (attemptId, currentAnswers, currentExam) => {
        toast.error("Đã hết thời gian làm bài! Hệ thống tự động nộp bài.");
        await executeSubmit(attemptId, currentAnswers, currentExam);
    };

    const executeSubmit = async (aId = attempt?.id, ans = answers, ex = exam) => {
        setIsSubmitting(true);
        clearInterval(timerRef.current);
        clearInterval(autoSaveTimerRef.current);

        try {
            // Securely process grading via server-side API
            await examAttemptService.submitExam(aId, ex.id, currentUser.uid, ans);

            // Automatically log incorrect answers as flashcards for future practice
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

    const handleCheckAnswer = (qId, subQId = null) => {
        const q = exam.questions.find(x => x.id === qId);
        if (!q) return;

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
                    correctAnswers.push(match[1].trim().toLowerCase());
                }
                let blankCorrectCount = 0;
                correctAnswers.forEach((correct, idx) => {
                    const ansStr = (sAns && sAns[idx] || "").trim().toLowerCase();
                    if (ansStr === correct) blankCorrectCount++;
                });
                return (blankCorrectCount === correctAnswers.length && correctAnswers.length > 0);
            } else if (qObj.type === 'essay') {
                const finalAns = (qObj.final_answer || "").trim().toLowerCase();
                const ansStr = (sAns || "").trim().toLowerCase();
                return (finalAns && ansStr === finalAns);
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

    // Thoát chế độ Luyện tập
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

    // Xử lý Text-To-Speech (Đọc câu hỏi)
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
        textToRead = textToRead.replace(/<[^>]*>?/gm, ''); // Xóa HTML
        textToRead = textToRead.replace(/\[\[.*?\]\]/g, 'chỗ trống'); // Điền khuyết
        textToRead = textToRead.replace(/\$/g, ''); // Bỏ dấu $ LaTeX

        if (question.type === "multiple_choice" && question.options) {
            const labels = ["A", "B", "C", "D", "E"];
            textToRead += ". Các phương án là: ";
            question.options.forEach((opt, idx) => {
                let optText = opt.replace(/<[^>]*>?/gm, '').replace(/\$/g, '');
                textToRead += ` Phương án ${labels[idx]}: ${optText}.`;
            });
        }

        const utterance = new SpeechSynthesisUtterance(textToRead);

        // Tự động nhận diện nếu có tiếng Anh
        utterance.lang = exam.subject?.toLowerCase().includes("anh") ? "en-US" : "vi-VN";
        utterance.rate = 0.9;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    // Format thời gian
    const formatTime = (seconds) => {
        if (seconds === null) return "--:--";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading || !exam) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-semibold animate-pulse">Đang chuẩn bị đề thi...</p>
            </div>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIdx];
    const isAnswered = currentQuestion && answers[currentQuestion.id] !== undefined;
    const isMarked = currentQuestion && reviewMarks[currentQuestion.id];

    return (
        <div
            className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden select-none"
            onContextMenu={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
        >
            {/* Header */}
            <header className="h-14 sm:h-16 shrink-0 bg-card border-b border-border flex items-center justify-between px-3 sm:px-6 shadow-sm gap-2">
                <div className="flex items-center gap-2 min-w-0 max-w-[40%] sm:max-w-[30%]">
                    <div className="truncate pl-1 sm:pl-2">
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-xs sm:text-base text-foreground truncate" title={exam.title}>{exam.title}</h1>
                            {isPracticeMode && pastAttemptsCount > 0 && (
                                <span className="hidden md:inline-block bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                    Làm lại lần {pastAttemptsCount + 1}
                                </span>
                            )}
                        </div>
                        <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block truncate">{exam.subject} • {currentUser?.name}</p>
                    </div>
                </div>

                <div className="flex items-center justify-center shrink-0">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1 sm:py-2 rounded-full font-black text-xs sm:text-lg tracking-wider border-2 transition-colors ${!isTimerEnabled
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30'
                                : timeLeft !== null && timeLeft <= 300 && timeLeft > 0
                                    ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-950/30'
                                    : 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:border-blue-500'
                            }`}>
                            <Clock className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${timeLeft !== null && timeLeft <= 300 && timeLeft > 0 && isTimerEnabled ? 'animate-pulse' : ''}`} />
                            {isTimerEnabled ? formatTime(timeLeft) : "Vô hạn"}
                        </div>
                        {isPracticeMode && (
                            <button
                                onClick={() => setIsTimerEnabled(!isTimerEnabled)}
                                className={`p-1.5 sm:p-2 rounded-full border-2 transition-colors flex shrink-0 ${isTimerEnabled
                                        ? "bg-background border-border text-muted-foreground hover:text-red-500 hover:border-red-200"
                                        : "bg-indigo-100 border-indigo-200 text-indigo-600 dark:bg-indigo-900/50 dark:border-indigo-800 dark:text-indigo-400"
                                    }`}
                                title={isTimerEnabled ? "Tắt đếm ngược" : "Bật đếm ngược"}
                            >
                                {isTimerEnabled ? <TimerOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                    {isPracticeMode && (
                        <Button
                            onClick={handleExitPractice}
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20 font-bold h-8 sm:h-10 rounded-xl px-2 sm:px-4 text-[10px] sm:text-sm"
                        >
                            <LogOut className="w-3.5 h-3.5 sm:mr-2" />
                            <span className="hidden sm:inline">Thoát</span>
                        </Button>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`${isPracticeMode ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white font-bold h-8 sm:h-10 rounded-xl px-3 sm:px-6 text-[10px] sm:text-sm shadow-sm`}
                    >
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 sm:mr-2" /> : <Send className="w-3.5 h-3.5 mr-1 sm:mr-2" />}
                        <span className="hidden sm:inline">{isPracticeMode ? "Hoàn thành luyện tập" : "Nộp bài"}</span>
                        <span className="sm:hidden">Nộp</span>
                    </Button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                {/* Body: Question Area */}
                <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-8 flex flex-col relative">
                    <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">

                        {/* Question Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl sm:text-2xl font-black text-foreground">
                                Câu {currentQuestionIdx + 1}
                                <span className="text-sm font-semibold text-muted-foreground ml-2">/ {exam.questions?.length}</span>
                            </h2>
                            <div className="flex gap-2">
                                {exam?.subject?.toLowerCase().includes("anh") && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-8 rounded-lg gap-2 font-bold text-xs border-2 transition-colors ${isSpeaking
                                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800"
                                                : "border-border text-muted-foreground hover:bg-muted"
                                            }`}
                                        onClick={() => handleReadAloud(currentQuestion)}
                                        title="Đọc câu hỏi và đáp án"
                                    >
                                        {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline">{isSpeaking ? "Dừng đọc" : "Đọc đề"}</span>
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-8 rounded-lg gap-2 font-bold text-xs border-2 transition-colors ${isMarked
                                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30"
                                            : "border-border text-muted-foreground hover:bg-muted"
                                        }`}
                                    onClick={() => handleToggleReview(currentQuestion.id)}
                                >
                                    <Flag className={`w-3.5 h-3.5 ${isMarked ? "fill-amber-500" : ""}`} />
                                    <span className="hidden sm:inline">{isMarked ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}</span>
                                </Button>
                            </div>
                        </div>

                        {/* Question Content */}
                        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-8 mb-6 text-base sm:text-lg text-foreground font-medium leading-loose">
                            {currentQuestion?.type === 'fill_blank' ? (
                                (() => {
                                    const content = currentQuestion.content || "";
                                    const parts = content.split(/\[\[.*?\]\]/g);
                                    const regex = /\[\[(.*?)\]\]/g;
                                    const blanks = [];
                                    let match;
                                    while ((match = regex.exec(content)) !== null) {
                                        blanks.push(match[1]);
                                    }

                                    return (
                                        <div className="inline-block leading-loose w-full">
                                            {parts.map((part, idx) => (
                                                <span key={idx}>
                                                    {part && <span className="inline"><LatexRenderer content={part} inline={true} /></span>}
                                                    {idx < blanks.length && (
                                                        <input
                                                            type="text"
                                                            value={answers[currentQuestion.id]?.[idx] || ""}
                                                            onChange={(e) => handleFillBlankAnswer(currentQuestion.id, idx, e.target.value)}
                                                            className="mx-2 inline-block min-w-[120px] max-w-full border-b-2 border-border focus:border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 px-2 py-1 text-center font-bold text-blue-700 dark:text-blue-300 outline-none transition-colors rounded-sm"
                                                            placeholder="..."
                                                        />
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    );
                                })()
                            ) : (
                                <LatexRenderer content={currentQuestion?.content || ""} inline={false} />
                            )}

                            {/* Render question images */}
                            {currentQuestion?.images && currentQuestion.images.length > 0 && (
                                <div className="mt-6 space-y-4">
                                    {currentQuestion.images.map((img, i) => (
                                        img ? <img key={i} src={img} alt={`Hình ảnh minh họa ${i + 1}`} className="max-h-[400px] mx-auto rounded-xl border border-border object-contain shadow-sm" /> : null
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Options */}
                        {(!currentQuestion?.type || currentQuestion.type === "multiple_choice") && !currentQuestion?.type?.startsWith('group_') && (
                            <div className="space-y-3 sm:space-y-4 mb-8">
                                {(shuffleMap[currentQuestion.id] || currentQuestion?.options?.map((_, i) => i) || []).map((originalIdx, renderIdx) => {
                                    const opt = currentQuestion.options[originalIdx];
                                    const isSelected = answers[currentQuestion.id] === originalIdx;
                                    const alphabet = ["A", "B", "C", "D", "E", "F"];
                                    return (
                                        <button
                                            key={originalIdx}
                                            onClick={() => handleSelectAnswer(currentQuestion.id, originalIdx)}
                                            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left group ${isSelected
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700"
                                                }`}
                                        >
                                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${isSelected
                                                    ? "bg-blue-500 text-white shadow-sm"
                                                    : "bg-muted text-muted-foreground group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300"
                                                }`}>
                                                {alphabet[renderIdx]}
                                            </div>
                                            <div className={`mt-1 font-medium ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                                <LatexRenderer content={opt} inline={false} />
                                                {currentQuestion.options_images && currentQuestion.options_images[originalIdx] && (
                                                    <div className="mt-3">
                                                        <img src={currentQuestion.options_images[originalIdx]} alt={`Minh họa đáp án ${alphabet[renderIdx]}`} className="max-h-32 rounded-lg border border-border object-contain" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {currentQuestion?.type === "true_false" && (
                            <div className="space-y-3 sm:space-y-4 mb-8">
                                <p className="text-sm font-bold text-muted-foreground mb-4">Chọn Đúng hoặc Sai cho mỗi mệnh đề sau:</p>
                                {currentQuestion.statements?.map((stmt, idx) => {
                                    const studentChoice = answers[currentQuestion.id]?.[idx];
                                    return (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border-2 border-border bg-card">
                                            <div className="flex-1">
                                                <span className="font-bold mr-2">{idx + 1}.</span>
                                                <LatexRenderer content={stmt.text} inline={true} />
                                                {stmt.image && (
                                                    <div className="mt-3">
                                                        <img src={stmt.image} alt="Minh họa" className="max-h-40 rounded-lg border border-border" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleSelectTrueFalse(currentQuestion.id, idx, true)}
                                                    className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${studentChoice === true
                                                            ? "bg-emerald-500 border-emerald-600 text-white"
                                                            : "bg-background border-border text-muted-foreground hover:border-emerald-300"
                                                        }`}
                                                >
                                                    Đúng
                                                </button>
                                                <button
                                                    onClick={() => handleSelectTrueFalse(currentQuestion.id, idx, false)}
                                                    className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${studentChoice === false
                                                            ? "bg-red-500 border-red-600 text-white"
                                                            : "bg-background border-border text-muted-foreground hover:border-red-300"
                                                        }`}
                                                >
                                                    Sai
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {currentQuestion?.type === "essay" && (
                            <div className="space-y-3 sm:space-y-4 mb-8">
                                <p className="text-sm font-bold text-muted-foreground mb-2">Nhập câu trả lời của bạn:</p>
                                <textarea
                                    className="w-full min-h-[150px] p-4 rounded-xl border-2 border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-y shadow-sm"
                                    placeholder="Gõ câu trả lời tự luận vào đây..."
                                    value={answers[currentQuestion.id] || ""}
                                    onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                                />
                            </div>
                        )}

                        {currentQuestion?.type?.startsWith("group_") && (
                            <div className="space-y-8 mb-8">
                                {(() => {
                                    const subQ = currentQuestion.subQuestions?.[currentSubQuestionIdx];
                                    if (!subQ) return null;
                                    const idx = currentSubQuestionIdx;
                                    const subAns = answers[currentQuestion.id] ? answers[currentQuestion.id][subQ.id] : undefined;
                                    const shuffleMapSub = shuffleMap[subQ.id] || subQ.options?.map((_, i) => i) || [];
                                    
                                    return (
                                        <div key={subQ.id} className="border-t-2 border-dashed border-border pt-6 mt-6 first:border-0 first:pt-0 first:mt-0">
                                            <div className="font-bold text-lg mb-4 text-foreground">
                                                Câu {idx + 1}. <LatexRenderer content={subQ.content || ""} inline={true} />
                                            </div>
                                            {subQ.images && subQ.images.length > 0 && (
                                                <div className="mt-4 mb-4 space-y-4">
                                                    {subQ.images.map((img, i) => (
                                                        img ? <img key={i} src={img} alt="Hình ảnh minh họa" className="max-h-[300px] rounded-xl border border-border object-contain shadow-sm" /> : null
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {(!subQ.type || subQ.type === "multiple_choice") && (
                                                <div className="space-y-3 sm:space-y-4">
                                                    {shuffleMapSub.map((originalIdx, renderIdx) => {
                                                        const opt = subQ.options[originalIdx];
                                                        const isSelected = subAns === originalIdx;
                                                        const alphabet = ["A", "B", "C", "D", "E", "F"];
                                                        return (
                                                            <button
                                                                key={originalIdx}
                                                                onClick={() => handleGroupAnswer(currentQuestion.id, subQ.id, "multiple_choice", originalIdx)}
                                                                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left group ${isSelected
                                                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                                        : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700"
                                                                    }`}
                                                            >
                                                                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${isSelected
                                                                        ? "bg-blue-500 text-white shadow-sm"
                                                                        : "bg-muted text-muted-foreground group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300"
                                                                    }`}>
                                                                    {alphabet[renderIdx]}
                                                                </div>
                                                                <div className={`mt-1 font-medium ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                                                    <LatexRenderer content={opt} inline={false} />
                                                                    {subQ.options_images && subQ.options_images[originalIdx] && (
                                                                        <div className="mt-3">
                                                                            <img src={subQ.options_images[originalIdx]} alt="Minh họa đáp án" className="max-h-32 rounded-lg border border-border object-contain" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {subQ.type === "true_false" && (
                                                <div className="space-y-3 sm:space-y-4">
                                                    <p className="text-sm font-bold text-muted-foreground mb-4">Chọn Đúng hoặc Sai cho mỗi mệnh đề sau:</p>
                                                    {subQ.statements?.map((stmt, sIdx) => {
                                                        const studentChoice = subAns?.[sIdx];
                                                        return (
                                                            <div key={sIdx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border-2 border-border bg-card">
                                                                <div className="flex-1">
                                                                    <span className="font-bold mr-2">{sIdx + 1}.</span>
                                                                    <LatexRenderer content={stmt.text} inline={true} />
                                                                    {stmt.image && (
                                                                        <div className="mt-3">
                                                                            <img src={stmt.image} alt="Minh họa" className="max-h-40 rounded-lg border border-border" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <button
                                                                        onClick={() => handleGroupAnswer(currentQuestion.id, subQ.id, "true_false", true, sIdx)}
                                                                        className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${studentChoice === true
                                                                                ? "bg-emerald-500 border-emerald-600 text-white"
                                                                                : "bg-background border-border text-muted-foreground hover:border-emerald-300"
                                                                            }`}
                                                                    >
                                                                        Đúng
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleGroupAnswer(currentQuestion.id, subQ.id, "true_false", false, sIdx)}
                                                                        className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${studentChoice === false
                                                                                ? "bg-red-500 border-red-600 text-white"
                                                                                : "bg-background border-border text-muted-foreground hover:border-red-300"
                                                                            }`}
                                                                    >
                                                                        Sai
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {subQ.type === "essay" && (
                                                <div className="space-y-3 sm:space-y-4">
                                                    <p className="text-sm font-bold text-muted-foreground mb-2">Nhập câu trả lời của bạn:</p>
                                                    <textarea
                                                        className="w-full min-h-[100px] p-4 rounded-xl border-2 border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-y shadow-sm"
                                                        placeholder="Gõ câu trả lời tự luận vào đây..."
                                                        value={subAns || ""}
                                                        onChange={(e) => handleGroupAnswer(currentQuestion.id, subQ.id, "essay", e.target.value)}
                                                    />
                                                </div>
                                            )}
                                            
                                            {subQ.type === "fill_blank" && (
                                                <div className="mt-4 p-4 rounded-xl border-2 border-border bg-card">
                                                    <p className="text-sm font-bold text-muted-foreground mb-4">Điền vào các chỗ trống:</p>
                                                    {(() => {
                                                        const content = subQ.content || "";
                                                        const parts = content.split(/\[\[.*?\]\]/g);
                                                        const regex = /\[\[(.*?)\]\]/g;
                                                        const blanks = [];
                                                        let match;
                                                        while ((match = regex.exec(content)) !== null) blanks.push(match[1]);

                                                        return (
                                                            <div className="inline-block leading-loose w-full">
                                                                {parts.map((part, pIdx) => (
                                                                    <span key={pIdx}>
                                                                        {part && <span className="inline"><LatexRenderer content={part} inline={true} /></span>}
                                                                        {pIdx < blanks.length && (
                                                                            <input
                                                                                type="text"
                                                                                value={subAns?.[pIdx] || ""}
                                                                                onChange={(e) => handleGroupAnswer(currentQuestion.id, subQ.id, "fill_blank", e.target.value, pIdx)}
                                                                                className="mx-2 inline-block min-w-[120px] max-w-full border-b-2 border-border focus:border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 px-2 py-1 text-center font-bold text-blue-700 dark:text-blue-300 outline-none transition-colors rounded-sm"
                                                                                placeholder="..."
                                                                            />
                                                                        )}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {/* Phần Luyện Tập cho Từng Câu Hỏi Con */}
                                            {isPracticeMode && (
                                                <div className="mt-6 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                                                            💡 Chế độ Luyện Tập: Bạn có thể kiểm tra đáp án ngay!
                                                        </span>
                                                        <Button
                                                            onClick={() => handleCheckAnswer(currentQuestion.id, subQ.id)}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shrink-0 h-9 px-4 text-xs"
                                                            disabled={subAns === undefined || practiceResults[`${currentQuestion.id}_${subQ.id}`]?.checked}
                                                        >
                                                            Kiểm tra đáp án
                                                        </Button>
                                                    </div>
                                                    
                                                    {practiceResults[`${currentQuestion.id}_${subQ.id}`]?.checked && (
                                                        <div className="mt-4 pt-4 border-t-2 border-indigo-200/60 dark:border-indigo-900/60 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            <div className="font-black text-base mb-3">
                                                                {practiceResults[`${currentQuestion.id}_${subQ.id}`].isCorrect ? (
                                                                    <span className="text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Trả lời chính xác!</span>
                                                                ) : (
                                                                    <span className="text-red-600 flex items-center gap-2"><XCircle className="w-5 h-5" /> Chưa chính xác hoặc chưa đủ ý!</span>
                                                                )}
                                                            </div>
                                                            
                                                            {subQ.suggested_solution && (
                                                                <div className="text-sm mt-3 bg-background p-3 rounded-lg border border-border shadow-sm">
                                                                    <p className="font-black text-foreground mb-1 flex items-center gap-2">
                                                                        <BookOpen className="w-3.5 h-3.5 text-primary" /> Lời giải chi tiết:
                                                                    </p>
                                                                    <LatexRenderer content={subQ.suggested_solution} inline={false} />
                                                                </div>
                                                            )}
                                                            {!subQ.suggested_solution && (subQ.final_answer || subQ.correct_answer) && (
                                                                <div className="text-sm mt-3 bg-background p-3 rounded-lg border border-border shadow-sm">
                                                                    <p className="font-black text-foreground mb-1">Đáp án đúng:</p>
                                                                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {(!subQ.type || subQ.type === 'multiple_choice') ? (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-0.5 rounded font-black text-xs">
                                                                                    {subQ.correct_answer}
                                                                                </span>
                                                                                <LatexRenderer
                                                                                    content={subQ.options[Math.max(0, ["A", "B", "C", "D", "E", "F"].indexOf(subQ.correct_answer))]}
                                                                                    inline={true}
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <LatexRenderer content={subQ.final_answer || ""} inline={true} />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        {isPracticeMode && !currentQuestion.type?.startsWith('group_') && (
                            <div className="mt-2 mb-8 p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                                        💡 Chế độ Luyện Tập: Bạn có thể kiểm tra đáp án ngay!
                                    </span>
                                    <Button
                                        onClick={() => handleCheckAnswer(currentQuestion.id)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shrink-0"
                                        disabled={!isAnswered || practiceResults[currentQuestion.id]?.checked}
                                    >
                                        Kiểm tra đáp án
                                    </Button>
                                </div>
                                {practiceResults[currentQuestion.id]?.checked && (
                                    <div className="mt-5 pt-5 border-t-2 border-indigo-200/60 dark:border-indigo-900/60 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="font-black text-lg mb-3">
                                            {practiceResults[currentQuestion.id].isCorrect ? (
                                                <span className="text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-6 h-6" /> Làm tốt lắm! Trả lời chính xác.</span>
                                            ) : (
                                                <span className="text-red-600 flex items-center gap-2"><XCircle className="w-6 h-6" /> Rất tiếc, câu trả lời chưa đúng hoặc chưa đủ!</span>
                                            )}
                                        </div>
                                        
                                        <>
                                            {currentQuestion.explanation && (
                                                <div className="text-sm mt-4 bg-background p-4 rounded-xl border-2 border-border/80 shadow-sm leading-loose">
                                                    <p className="font-black text-foreground mb-2 flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-primary" /> Lời giải chi tiết:
                                                    </p>
                                                    <LatexRenderer content={currentQuestion.explanation} inline={false} />
                                                </div>
                                            )}
                                            {!currentQuestion.explanation && (currentQuestion.final_answer || currentQuestion.correct_answer) && (
                                                <div className="text-sm mt-4 bg-background p-4 rounded-xl border-2 border-border/80 shadow-sm">
                                                    <p className="font-black text-foreground mb-1">Đáp án đúng:</p>
                                                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {(!currentQuestion.type || currentQuestion.type === 'multiple_choice') ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-0.5 rounded font-black text-xs">
                                                                    {currentQuestion.correct_answer}
                                                                </span>
                                                                <LatexRenderer
                                                                    content={currentQuestion.options[Math.max(0, ["A", "B", "C", "D", "E", "F"].indexOf(currentQuestion.correct_answer))]}
                                                                    inline={true}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <LatexRenderer content={currentQuestion.final_answer || ""} inline={true} />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                        
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    {(() => {
                        const curQ = exam.questions[currentQuestionIdx];
                        const isGroup = curQ?.type?.startsWith('group_');
                        const subQsLength = isGroup ? (curQ.subQuestions?.length || 1) : 1;
                        
                        const isPrevDisabled = currentQuestionIdx === 0 && (!isGroup || currentSubQuestionIdx === 0);
                        const isNextDisabled = currentQuestionIdx === (exam.questions?.length || 1) - 1 && (!isGroup || currentSubQuestionIdx === subQsLength - 1);
                        
                        const handlePrev = () => {
                            if (isGroup && currentSubQuestionIdx > 0) {
                                setCurrentSubQuestionIdx(prev => prev - 1);
                            } else if (currentQuestionIdx > 0) {
                                const prevIdx = currentQuestionIdx - 1;
                                setCurrentQuestionIdx(prevIdx);
                                const prevQ = exam.questions[prevIdx];
                                if (prevQ?.type?.startsWith('group_')) {
                                    setCurrentSubQuestionIdx(Math.max(0, (prevQ.subQuestions?.length || 1) - 1));
                                } else {
                                    setCurrentSubQuestionIdx(0);
                                }
                            }
                        };
                        
                        const handleNext = () => {
                            if (isGroup && currentSubQuestionIdx < subQsLength - 1) {
                                setCurrentSubQuestionIdx(prev => prev + 1);
                            } else if (currentQuestionIdx < (exam.questions?.length || 1) - 1) {
                                setCurrentQuestionIdx(prev => prev + 1);
                                setCurrentSubQuestionIdx(0);
                            }
                        };
                        
                        return (
                            <div className="mt-auto pt-4 border-t border-border/40 flex justify-between items-center max-w-3xl mx-auto w-full sticky bottom-0 bg-background pb-2 z-10 gap-2">
                                <Button
                                    variant="outline"
                                    className="h-10 sm:h-12 px-3 sm:px-6 rounded-xl font-bold border-2 text-xs sm:text-sm"
                                    disabled={isPrevDisabled}
                                    onClick={handlePrev}
                                >
                                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                                    <span className="hidden sm:inline">Câu trước</span>
                                    <span className="sm:hidden">Trước</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-10 sm:h-12 w-10 sm:w-12 md:hidden rounded-xl font-bold border-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowQuestionMap(prev => !prev)}
                                    title="Bản đồ câu hỏi"
                                >
                                    <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                                </Button>
        
                                <Button
                                    className="h-10 sm:h-12 px-3 sm:px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md text-xs sm:text-sm"
                                    disabled={isNextDisabled}
                                    onClick={handleNext}
                                >
                                    <span className="hidden sm:inline">Câu tiếp theo</span>
                                    <span className="sm:hidden">Tiếp</span>
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-2" />
                                </Button>
                            </div>
                        );
                    })()}
                </div>

                {/* Backdrop overlay for mobile question map drawer */}
                {showQuestionMap && (
                    <div 
                        className="fixed inset-0 bg-black/60 z-[105] md:hidden animate-in fade-in duration-200"
                        onClick={() => setShowQuestionMap(false)}
                    />
                )}

                {/* Sidebar: Map of Questions */}
                <div className={`
                    shrink-0 border-l border-border bg-card flex flex-col transition-all duration-300 ease-in-out
                    md:w-72 lg:w-80 md:h-auto md:flex
                    ${showQuestionMap 
                        ? "fixed inset-x-0 bottom-0 h-[65vh] z-[110] border-t border-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300" 
                        : "hidden md:flex"
                    }
                `}>
                    <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-sm">Bản đồ câu hỏi</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 md:hidden text-muted-foreground hover:text-foreground rounded-lg"
                            onClick={() => setShowQuestionMap(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {exam.questions?.map((q, idx) => {
                                const ans = answers[q.id];
                                let isAns = false;
                                
                                const checkAnsStatus = (type, qAns, qObj) => {
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

                                const isRev = reviewMarks[q.id];
                                const isCur = currentQuestionIdx === idx;

                                if (q.type?.startsWith('group_')) {
                                    const subQs = q.subQuestions || [];
                                    return (
                                        <div key={q.id} className={`col-span-5 md:col-span-4 lg:col-span-5 border-2 rounded-xl p-3 bg-card transition-all ${isCur ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
                                            <div className="font-bold text-xs text-foreground mb-2 pb-1 border-b border-border">
                                                Câu {idx + 1}: {q.title || "Nhóm câu hỏi"}
                                            </div>
                                            <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                                {subQs.map((sub, sIdx) => {
                                                    const subAns = ans ? ans[sub.id] : undefined;
                                                    const isSubAns = checkAnsStatus(sub.type, subAns, sub);
                                                    
                                                    return (
                                                        <button
                                                            key={sub.id}
                                                            onClick={() => { 
                                                                setCurrentQuestionIdx(idx); 
                                                                setCurrentSubQuestionIdx(sIdx);
                                                                setShowQuestionMap(false); // Close map on click on mobile
                                                            }}
                                                            className={`h-10 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-all relative hover:scale-105 ${isRev
                                                                ? "bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-950/50 dark:border-amber-600 dark:text-amber-400"
                                                                : isSubAns
                                                                    ? "bg-blue-500 border-blue-600 text-white shadow-sm"
                                                                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                                                            }`}
                                                            title={`Câu con ${sIdx + 1}`}
                                                        >
                                                            {sIdx + 1}
                                                            {isRev && <Flag className="w-2.5 h-2.5 absolute -top-1 -right-1 fill-amber-500 text-amber-500 drop-shadow-sm" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                } else {
                                    isAns = checkAnsStatus(q.type, ans, q);
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => { 
                                                setCurrentQuestionIdx(idx); 
                                                setCurrentSubQuestionIdx(0);
                                                setShowQuestionMap(false); // Close map on click on mobile
                                            }}
                                            className={`h-10 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-all relative ${isCur
                                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                                                    : "hover:scale-105"
                                                } ${isRev
                                                    ? "bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-950/50 dark:border-amber-600 dark:text-amber-400"
                                                    : isAns
                                                        ? "bg-blue-500 border-blue-600 text-white shadow-sm"
                                                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                                                }`}
                                        >
                                            {idx + 1}
                                            {isRev && <Flag className="w-2.5 h-2.5 absolute -top-1 -right-1 fill-amber-500 text-amber-500 drop-shadow-sm" />}
                                        </button>
                                    );
                                }
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="p-4 border-t border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground flex flex-row justify-around items-center shrink-0 md:flex-col md:items-start md:justify-start md:space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-blue-500 border border-blue-600"></div> Đã trả lời
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-background border-2 border-border"></div> Chưa trả lời
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-amber-100 border-2 border-amber-400"></div> Xem lại sau
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
