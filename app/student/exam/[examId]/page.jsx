"use client";

import { use } from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Flag, LayoutGrid, ChevronLeft, ChevronRight, LogOut, AlertTriangle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    
    // Trạng thái bài làm
    const [answers, setAnswers] = useState({});
    const [reviewMarks, setReviewMarks] = useState({});
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    
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

            // 2. Tải hoặc Khởi tạo Attempt
            const attempts = await examAttemptService.getStudentAttempts(currentUser.uid);
            let currentAttempt = attempts.find(a => a.examId === examId && a.classId === classId);
            
            if (currentAttempt && currentAttempt.status === "completed") {
                toast.info("Bạn đã hoàn thành bài thi này rồi.");
                router.push(`/student/exam/${examId}/result`);
                return;
            }

            if (!currentAttempt) {
                currentAttempt = await examAttemptService.startExam(currentUser.uid, currentUser.name, examId, classId);
            }
            
            setAttempt(currentAttempt);
            if (currentAttempt.answers) setAnswers(currentAttempt.answers);

            // 3. Tính toán thời gian còn lại
            const startTime = new Date(currentAttempt.startTime).getTime();
            const durationMs = (examData.duration || 45) * 60 * 1000;
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
        if (currentUser && examId && classId) {
            loadExamData();
        }
    }, [currentUser, examId, classId, loadExamData]);

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
            // Auto save immediately for good UX, but don't await to avoid blocking UI
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
        const answeredQ = Object.keys(answers).length;
        
        let msg = "Bạn có chắc chắn muốn nộp bài?";
        if (answeredQ < totalQ) {
            msg = `Bạn mới trả lời ${answeredQ}/${totalQ} câu. Các câu chưa trả lời sẽ không có điểm. Xác nhận nộp bài?`;
        }

        if (await confirmDialog(msg, "Xác nhận nộp bài")) {
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
            router.push(`/student/exam/${ex.id}/result`);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi nộp bài. Vui lòng thử lại!");
            setIsSubmitting(false);
        }
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 sm:h-10 rounded-xl px-4 sm:px-6 text-xs sm:text-sm shadow-sm"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        <span className="hidden sm:inline">Nộp bài</span>
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
                        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-8 mb-6 text-base sm:text-lg text-foreground font-medium">
                            <LatexRenderer content={currentQuestion?.content || ""} inline={false} />
                        </div>

                        {/* Options */}
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
                                const isAns = answers[q.id] !== undefined;
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
