"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Clock, Target, AlertCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/examService";
import { examAttemptService } from "@/services/examAttemptService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import LatexRenderer from "@/components/shared/LatexRenderer";

export default function ExamResultPage({ params }) {
    const { examId } = use(params);
    const { currentUser } = useAuth();
    const router = useRouter();

    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser && examId) {
            loadResultData();
        }
    }, [currentUser, examId]);

    const loadResultData = async () => {
        try {
            // 1. Lấy thông tin bài thi
            const examData = await examService.getExamDetails(examId);
            if (!examData) {
                toast.error("Không tìm thấy đề thi!");
                router.push("/student");
                return;
            }
            if (examData.questions && Array.isArray(examData.questions)) {
                 examData.questions = examData.questions.sort((a,b) => (a.order || 0) - (b.order || 0));
            }
            setExam(examData);

            // 2. Lấy kết quả làm bài
            const attempts = await examAttemptService.getStudentAttempts(currentUser.uid);
            const currentAttempt = attempts.find(a => a.examId === examId);
            
            if (!currentAttempt) {
                toast.error("Không tìm thấy kết quả làm bài của bạn.");
                router.push("/student");
                return;
            }
            if (currentAttempt.status !== "completed") {
                toast.info("Bạn chưa nộp bài thi này.");
                router.push(`/student/exam/${examId}?classId=${currentAttempt.classId}`);
                return;
            }

            setAttempt(currentAttempt);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải kết quả");
        } finally {
            setLoading(false);
        }
    };

    if (loading || !exam || !attempt) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground font-semibold">Đang tổng hợp kết quả...</p>
                </div>
            </div>
        );
    }

    const answers = attempt.answers || {};
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    let totalPointsEarned = 0;
    let totalPossiblePoints = 0;
    
    const alphabet = ["A", "B", "C", "D", "E", "F"];
    
    exam.questions.forEach(q => {
        const studentAns = answers[q.id]; // Là index: 0, 1, 2, 3
        const actualCorrectIndex = alphabet.indexOf(q.correct_answer);
        const qPoints = parseFloat(q.points || "1");
        
        totalPossiblePoints += qPoints;
        
        if (studentAns === undefined) {
            skippedCount++;
        } else if (studentAns === actualCorrectIndex) {
            correctCount++;
            totalPointsEarned += qPoints;
        } else {
            wrongCount++;
        }
    });

    const totalQuestions = exam.questions.length;
    // Điểm số bằng tổng điểm đã kiếm được
    const score = totalPointsEarned.toFixed(2);
    
    // Tính thời gian làm bài
    const startTime = new Date(attempt.startTime).getTime();
    const submitTime = attempt.submitTime ? new Date(attempt.submitTime).getTime() : new Date().getTime();
    const timeSpentSeconds = Math.floor((submitTime - startTime) / 1000);
    const m = Math.floor(timeSpentSeconds / 60);
    const s = timeSpentSeconds % 60;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 border-b border-border/60 pb-6">
                <Link href={`/student/class/${attempt.classId}`}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Kết quả bài thi</h1>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">{exam.title}</p>
                </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Điểm số</p>
                    <p className="text-3xl font-black text-foreground mt-1">{score}</p>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full flex items-center justify-center mb-3">
                        <Target className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Đúng</p>
                    <p className="text-3xl font-black text-blue-600 mt-1">{correctCount} <span className="text-sm text-muted-foreground">/ {totalQuestions}</span></p>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-full flex items-center justify-center mb-3">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Sai / Bỏ qua</p>
                    <p className="text-3xl font-black text-red-600 mt-1">{wrongCount + skippedCount}</p>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-full flex items-center justify-center mb-3">
                        <Clock className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Thời gian</p>
                    <p className="text-3xl font-black text-foreground mt-1">{m}p {s}s</p>
                </div>
            </div>

            {/* Chi tiết đáp án */}
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden mt-8">
                <div className="bg-muted/40 p-5 sm:p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-black text-foreground">Chi tiết đáp án</h2>
                    <div className="flex gap-4 text-xs font-bold text-muted-foreground">
                        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đúng</div>
                        <div className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-red-500" /> Sai</div>
                        <div className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-slate-400" /> Bỏ qua</div>
                    </div>
                </div>

                <div className="divide-y divide-border/60">
                    {exam.questions.map((q, idx) => {
                        const studentAns = answers[q.id];
                        const alphabet = ["A", "B", "C", "D", "E", "F"];
                        const actualCorrectIndex = alphabet.indexOf(q.correct_answer);
                        const isCorrect = studentAns === actualCorrectIndex;
                        const isSkipped = studentAns === undefined;

                        return (
                            <div key={q.id} className="p-5 sm:p-8 hover:bg-muted/10 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 mt-1">
                                        {isCorrect ? (
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                        ) : isSkipped ? (
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shadow-sm">
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
                                                <XCircle className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <span className="font-black text-foreground mr-2">Câu {idx + 1}:</span>
                                            <span className="text-foreground font-medium">
                                                <LatexRenderer content={q.content} inline={true} />
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                            {q.options.map((opt, oIdx) => {
                                                const isStudentChoice = studentAns === oIdx;
                                                const isActualCorrect = actualCorrectIndex === oIdx;
                                                
                                                let style = "bg-card border-border text-muted-foreground"; // Mặc định
                                                
                                                if (isActualCorrect) {
                                                    style = "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500 shadow-sm";
                                                } else if (isStudentChoice && !isCorrect) {
                                                    style = "bg-red-50 border-red-500 text-red-800 dark:bg-red-950/40 dark:text-red-300 shadow-sm";
                                                }

                                                return (
                                                    <div key={oIdx} className={`p-3 rounded-xl border-2 flex items-start gap-3 transition-colors ${style}`}>
                                                        <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-black ${
                                                            isActualCorrect ? "bg-emerald-500 text-white" :
                                                            (isStudentChoice ? "bg-red-500 text-white" : "bg-muted text-muted-foreground")
                                                        }`}>
                                                            {alphabet[oIdx]}
                                                        </div>
                                                        <div className={`mt-0.5 font-medium ${isActualCorrect || isStudentChoice ? "text-inherit" : "text-muted-foreground"}`}>
                                                            <LatexRenderer content={opt} inline={true} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-6 flex justify-center pb-12">
                <Link href={`/student/class/${attempt.classId}`}>
                    <Button className="h-11 px-8 rounded-xl font-bold gap-2">
                        <LayoutDashboard className="w-5 h-5" /> Trở về lớp học
                    </Button>
                </Link>
            </div>
        </div>
    );
}
