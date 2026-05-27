"use client";

import { use } from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Flag, LayoutGrid, ChevronLeft, ChevronRight, LogOut, AlertTriangle, Send, Loader2, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classService } from "@/services/classService";
import { examService } from "@/services/examService";
import { examAttemptService } from "@/services/examAttemptService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import LatexRenderer from "@/components/shared/LatexRenderer";
import { useConfirm } from "@/context/ConfirmContext";

export default function ExamInterface({ params }) {
    const { examId } = use(params);
    const searchParams = useSearchParams();
    const classId = searchParams.get("classId");
    
    const { currentUser } = useAuth();
    const router = useRouter();
    const confirmDialog = useConfirm();

    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    
    const [answers, setAnswers] = useState({});
    const [reviewMarks, setReviewMarks] = useState({});
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    
    // Practice Mode State
    const isPracticeMode = searchParams.get("mode") === "practice";
    const [practiceResults, setPracticeResults] = useState({});
    
    const [timeLeft, setTimeLeft] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const timerRef = useRef(null);
    const autoSaveTimerRef = useRef(null);

    const loadExamData = useCallback(async () => {
        try {
            // 1. Tải đề thi
            const examData = await examService.getExamDetails(examId);
            if (!examData) {
                toast.error("Không tìm thấy đề thi!");
                router.push("/student");
                return;
            }
            // Sort questions if needed (ensure order)
            if (examData.questions && Array.isArray(examData.questions)) {
                 examData.questions = examData.questions.sort((a,b) => (a.order || 0) - (b.order || 0));
            }
            setExam(examData);

            // 0. Kiểm tra thời gian bắt đầu của lớp
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

            // 2. Tải hoặc Khởi tạo Attempt
            const attempts = await examAttemptService.getStudentAttempts(currentUser.uid);
            let currentAttempt = attempts.find(a => a.examId === examId && a.classId === classId);
            
            if (currentAttempt && currentAttempt.status === "completed") {
                toast.info("Bạn đã hoàn thành bài thi này rồi.");
                router.push(`/student/exam/${examId}/result`);
                return;
            }

            if (!currentAttempt) {
                // Trong chế độ luyện tập tự do, có thể bỏ qua classId
                currentAttempt = await examAttemptService.startExam(currentUser.uid, currentUser.name, examId, classId || "practice");
            }
            
            setAttempt(currentAttempt);
            if (currentAttempt.answers) setAnswers(currentAttempt.answers);

            // 3. Tính toán thời gian còn lại
            const startTime = new Date(currentAttempt.startTime).getTime();
            const durationMs = durationMins * 60 * 1000;
            const endTime = startTime + durationMs;
            const now = new Date().getTime();
            
            let remainingSeconds = Math.floor((endTime - now) / 1000);
            if (remainingSeconds <= 0) {
                remainingSeconds = 0;
                handleAutoSubmit(currentAttempt.id, currentAttempt.answers || {}, examData);
            } else {
                setTimeLeft(remainingSeconds);
            }
            
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

    // Đếm ngược thời gian
    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && !isSubmitting) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        // Hết giờ
                        if (attempt && exam) {
                            handleAutoSubmit(attempt.id, answers, exam);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timeLeft, isSubmitting, attempt, answers, exam]);

    // Auto-save định kỳ
    useEffect(() => {
        if (attempt && !isSubmitting) {
            autoSaveTimerRef.current = setInterval(() => {
                examAttemptService.saveAnswersDraft(attempt.id, answers);
            }, 30000); // Lưu nháp mỗi 30 giây
        }
        return () => clearInterval(autoSaveTimerRef.current);
    }, [attempt, answers, isSubmitting]);

    // Anti-cheat Nâng cao
    useEffect(() => {
        if (isSubmitting || timeLeft <= 0 || !attempt) return;

        // 1. Phát hiện chuyển Tab (Visibility)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                examAttemptService.logCheat(attempt.id, "Chuyển Tab (Ẩn trình duyệt)");
            }
        };

        // 2. Phát hiện mất Focus (Chuyển sang phần mềm khác / Màn hình khác)
        const handleBlur = () => {
            examAttemptService.logCheat(attempt.id, "Mất Focus (Mở ứng dụng khác)");
        };

        // 3. Chặn các hành vi sao chép và xem mã nguồn
        const handleContextMenu = (e) => e.preventDefault();
        const handleCopyPaste = (e) => e.preventDefault();
        
        const handleKeyDown = (e) => {
            // Chặn F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (Xem nguồn / Inspect)
            if (
                e.key === "F12" || 
                (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) || 
                (e.ctrlKey && e.key === "U") ||
                (e.ctrlKey && e.key === "P") || // In ấn
                (e.ctrlKey && e.key === "C") || // Copy
                (e.ctrlKey && e.key === "V")    // Paste
            ) {
                e.preventDefault();
                examAttemptService.logCheat(attempt.id, "Cố tình dùng phím tắt cấm");
            }
        };

        // 4. Phát hiện Extension can thiệp vào DOM (Sider, Grammarly, v.v.)
        const observer = new MutationObserver((mutations) => {
            let suspiciousInjected = false;
            for (let mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const tag = node.tagName.toLowerCase();
                        const id = node.id ? node.id.toLowerCase() : "";
                        const cls = (typeof node.className === 'string') ? node.className.toLowerCase() : "";
                        
                        // Web Components (thẻ có dấu gạch ngang là dấu hiệu của Extension)
                        // Bỏ qua các class hợp lệ của Tailwind như "text-"
                        if (
                            tag === "iframe" || 
                            (tag.includes("-") && !tag.includes("lucide")) || 
                            id.includes("sider") || id.includes("grammarly") || id.includes("chatgpt") ||
                            (cls.includes("sider") && !cls.includes("slider")) || 
                            cls.includes("grammarly") || 
                            cls.includes("extension-")
                        ) {
                            suspiciousInjected = true;
                            // Ẩn luôn thẻ đó để vô hiệu hóa extension
                            node.style.display = 'none'; 
                        }
                    }
                });
            }
            if (suspiciousInjected) {
                examAttemptService.logCheat(attempt.id, "Phát hiện tiện ích mở rộng (Extension) can thiệp");
            }
        });

        // Bật các Listener
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("copy", handleCopyPaste);
        document.addEventListener("cut", handleCopyPaste);
        document.addEventListener("paste", handleCopyPaste);
        document.addEventListener("keydown", handleKeyDown);
        
        // Theo dõi sự thay đổi của DOM để phát hiện Extension
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            // Dọn dẹp Listener khi component unmount hoặc khi nộp bài
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
            if (attempt) examAttemptService.saveAnswersDraft(attempt.id, updated).catch(()=>{});
            return updated;
        });
    };

    const handleSelectTrueFalse = (questionId, statementIdx, value) => {
        setAnswers(prev => {
            const currentAns = prev[questionId] || {};
            const updatedAns = { ...currentAns, [statementIdx]: value };
            const updated = { ...prev, [questionId]: updatedAns };
            if (attempt) examAttemptService.saveAnswersDraft(attempt.id, updated).catch(()=>{});
            return updated;
        });
    };

    const handleTextAnswer = (questionId, text) => {
        setAnswers(prev => {
            const updated = { ...prev, [questionId]: text };
            if (attempt) examAttemptService.saveAnswersDraft(attempt.id, updated).catch(()=>{});
            return updated;
        });
    };

    const handleFillBlankAnswer = (questionId, blankIdx, value) => {
        setAnswers(prev => {
            const currentAns = prev[questionId] || {};
            const updatedAns = { ...currentAns, [blankIdx]: value };
            const updated = { ...prev, [questionId]: updatedAns };
            if (attempt) examAttemptService.saveAnswersDraft(attempt.id, updated).catch(()=>{});
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
            if (q.type === 'true_false') {
                if (ans && Object.keys(ans).length === (q.statements?.length || 0)) answeredQ++;
            } else if (q.type === 'fill_blank') {
                const blanksCount = (q.content?.match(/\[\[.*?\]\]/g) || []).length;
                const ansKeys = ans ? Object.keys(ans).filter(k => ans[k] && ans[k].trim() !== "") : [];
                if (ansKeys.length === blanksCount && blanksCount > 0) answeredQ++;
            } else if (q.type === 'essay') {
                if (ans && ans.trim().length > 0) answeredQ++;
            } else {
                if (ans !== undefined) answeredQ++;
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
            // Chấm điểm cơ bản
            let totalPoints = 0;
            const alphabet = ["A", "B", "C", "D", "E", "F"];
            
            ex.questions?.forEach(q => {
                if (ans[q.id] !== undefined) {
                    const studentLetter = alphabet[ans[q.id]];
                    if (studentLetter === q.correct_answer) {
                        const qPoints = parseFloat(q.points || "1");
                        totalPoints += qPoints;
                    }
                }
            });
            
            const score = totalPoints; // Tính tổng điểm theo từng câu

            // Cập nhật Attempt
            await examAttemptService.submitExam(aId, ans, score);
            
            toast.success("Nộp bài thành công!");
            router.push(`/student/exam/${ex.id}/result${isPracticeMode ? '?mode=practice' : ''}`);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi nộp bài. Vui lòng thử lại!");
            setIsSubmitting(false);
        }
    };

    const handleCheckAnswer = (qId) => {
        const q = exam.questions.find(x => x.id === qId);
        if (!q) return;

        const studentAns = answers[qId];
        let isCorrect = false;

        if (q.type === 'true_false') {
            const stmts = q.statements || [];
            let stmtCorrectCount = 0;
            stmts.forEach((stmt, idx) => {
                if (studentAns && studentAns[idx] === stmt.correct) {
                    stmtCorrectCount++;
                }
            });
            isCorrect = (stmtCorrectCount === stmts.length && stmts.length > 0);
        } else if (q.type === 'fill_blank') {
            const regex = /\[\[(.*?)\]\]/g;
            const correctAnswers = [];
            let match;
            while ((match = regex.exec(q.content || "")) !== null) {
                correctAnswers.push(match[1].trim().toLowerCase());
            }
            let blankCorrectCount = 0;
            correctAnswers.forEach((correct, idx) => {
                const sAns = (studentAns && studentAns[idx] || "").trim().toLowerCase();
                if (sAns && sAns === correct) blankCorrectCount++;
            });
            isCorrect = (blankCorrectCount === correctAnswers.length && correctAnswers.length > 0);
        } else if (q.type === 'essay') {
            const finalAns = (q.final_answer || "").trim().toLowerCase();
            const sAns = (studentAns || "").trim().toLowerCase();
            isCorrect = (finalAns && sAns === finalAns);
        } else {
            const alphabet = ["A", "B", "C", "D", "E", "F"];
            const actualCorrectIndex = alphabet.indexOf(q.correct_answer);
            isCorrect = (studentAns === actualCorrectIndex);
        }

        setPracticeResults(prev => ({
            ...prev,
            [qId]: { checked: true, isCorrect }
        }));
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
            <header className="h-14 sm:h-16 shrink-0 bg-card border-b border-border flex items-center justify-between px-3 sm:px-6 shadow-sm">
                <div className="flex items-center gap-3 w-1/3 truncate">
                    <div className="truncate pl-2">
                        <h1 className="font-bold text-sm sm:text-base text-foreground truncate">{exam.title}</h1>
                        <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block truncate">{exam.subject} • {currentUser?.name}</p>
                    </div>
                </div>

                <div className="flex items-center justify-center w-1/3">
                    <div className={`flex items-center gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full font-black text-sm sm:text-lg tracking-wider border-2 transition-colors ${
                        timeLeft !== null && timeLeft <= 300 
                            ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-950/30' 
                            : 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:border-blue-500'
                    }`}>
                        <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${timeLeft !== null && timeLeft <= 300 ? 'animate-pulse' : ''}`} />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex items-center justify-end w-1/3">
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className={`${isPracticeMode ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white font-bold h-9 sm:h-10 rounded-xl px-4 sm:px-6 text-xs sm:text-sm shadow-sm`}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
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
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className={`h-8 rounded-lg gap-2 font-bold text-xs border-2 transition-colors ${
                                    isMarked 
                                        ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30" 
                                        : "border-border text-muted-foreground hover:bg-muted"
                                }`}
                                onClick={() => handleToggleReview(currentQuestion.id)}
                            >
                                <Flag className={`w-3.5 h-3.5 ${isMarked ? "fill-amber-500" : ""}`} />
                                <span className="hidden sm:inline">{isMarked ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}</span>
                            </Button>
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
                        </div>

                        {/* Options */}
                        {(!currentQuestion?.type || currentQuestion.type === "multiple_choice") && (
                            <div className="space-y-3 sm:space-y-4 mb-8">
                                {currentQuestion?.options?.map((opt, idx) => {
                                    const isSelected = answers[currentQuestion.id] === idx;
                                    const alphabet = ["A", "B", "C", "D", "E", "F"];
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectAnswer(currentQuestion.id, idx)}
                                            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left group ${
                                                isSelected 
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                                    : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700"
                                            }`}
                                        >
                                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${
                                                isSelected 
                                                    ? "bg-blue-500 text-white shadow-sm" 
                                                    : "bg-muted text-muted-foreground group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300"
                                            }`}>
                                                {alphabet[idx]}
                                            </div>
                                            <div className={`mt-1 font-medium ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                                <LatexRenderer content={opt} inline={false} />
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
                                                    className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${
                                                        studentChoice === true 
                                                            ? "bg-emerald-500 border-emerald-600 text-white" 
                                                            : "bg-background border-border text-muted-foreground hover:border-emerald-300"
                                                    }`}
                                                >
                                                    Đúng
                                                </button>
                                                <button
                                                    onClick={() => handleSelectTrueFalse(currentQuestion.id, idx, false)}
                                                    className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${
                                                        studentChoice === false 
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

                        {/* Check Answer Button (Practice Mode) */}
                        {isPracticeMode && (
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
                                                <span className="text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-6 h-6"/> Làm tốt lắm! Trả lời chính xác.</span>
                                            ) : (
                                                <span className="text-red-600 flex items-center gap-2"><XCircle className="w-6 h-6"/> Rất tiếc, câu trả lời chưa đúng hoặc chưa đủ!</span>
                                            )}
                                        </div>
                                        {currentQuestion.explanation && (
                                            <div className="text-sm mt-4 bg-background p-4 rounded-xl border-2 border-border/80 shadow-sm leading-loose">
                                                <p className="font-black text-foreground mb-2 flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-primary" /> Lời giải chi tiết:
                                                </p>
                                                <LatexRenderer content={currentQuestion.explanation} inline={false} />
                                            </div>
                                        )}
                                        {!currentQuestion.explanation && currentQuestion.final_answer && (
                                            <div className="text-sm mt-4 bg-background p-4 rounded-xl border-2 border-border/80 shadow-sm">
                                                <p className="font-black text-foreground mb-1">Đáp án đúng:</p>
                                                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {currentQuestion.final_answer}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-auto pt-6 border-t border-border/40 flex justify-between items-center max-w-3xl mx-auto w-full sticky bottom-0 bg-background pb-2">
                        <Button 
                            variant="outline" 
                            className="h-12 px-4 sm:px-6 rounded-xl font-bold border-2"
                            disabled={currentQuestionIdx === 0}
                            onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                        >
                            <ChevronLeft className="w-5 h-5 sm:mr-2" />
                            <span className="hidden sm:inline">Câu trước</span>
                        </Button>
                        
                        <Button 
                            className="h-12 px-4 sm:px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                            disabled={currentQuestionIdx === (exam.questions?.length || 1) - 1}
                            onClick={() => setCurrentQuestionIdx(prev => Math.min((exam.questions?.length || 1) - 1, prev + 1))}
                        >
                            <span className="hidden sm:inline">Câu tiếp theo</span>
                            <ChevronRight className="w-5 h-5 sm:ml-2" />
                        </Button>
                    </div>
                </div>

                {/* Sidebar: Map of Questions */}
                <div className="w-full md:w-72 lg:w-80 shrink-0 border-l border-border bg-card flex flex-col h-48 md:h-auto">
                    <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2 shrink-0">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-sm">Bản đồ câu hỏi</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {exam.questions?.map((q, idx) => {
                                const ans = answers[q.id];
                                let isAns = false;
                                if (q.type === 'true_false') {
                                    isAns = ans && Object.keys(ans).length === (q.statements?.length || 0);
                                } else if (q.type === 'fill_blank') {
                                    const blanksCount = (q.content?.match(/\[\[.*?\]\]/g) || []).length;
                                    const ansKeys = ans ? Object.keys(ans).filter(k => ans[k] && ans[k].trim() !== "") : [];
                                    isAns = ansKeys.length === blanksCount && blanksCount > 0;
                                } else if (q.type === 'essay') {
                                    isAns = ans && ans.trim().length > 0;
                                } else {
                                    isAns = ans !== undefined;
                                }
                                
                                const isRev = reviewMarks[q.id];
                                const isCur = currentQuestionIdx === idx;
                                
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestionIdx(idx)}
                                        className={`h-10 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-all relative ${
                                            isCur 
                                                ? "ring-2 ring-primary ring-offset-2 ring-offset-card" 
                                                : "hover:scale-105"
                                        } ${
                                            isRev 
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
                            })}
                        </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="p-4 border-t border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground space-y-2 shrink-0">
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
