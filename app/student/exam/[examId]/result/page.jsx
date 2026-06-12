"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Clock, Target, AlertCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classService } from "@/services/classService";
import { examService } from "@/services/examService";
import { examAttemptService } from "@/services/examAttemptService";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import dynamic from "next/dynamic";
const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});
import { studentService } from "@/services/studentService";
import { badgeService } from "@/services/badgeService";
import confetti from "canvas-confetti";
import { getShuffleMap } from "@/lib/shuffleUtils";
import VirtualizedItem from "@/components/shared/VirtualizedItem";

const cleanAndNormalize = (text) => {
    if (text === undefined || text === null) return "";
    return text
        .toString()
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
        .toLowerCase()
        .replace(/,/g, ".");
};

/**
 * Component ExamResultPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  params  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function ExamResultPage({ params }) {
    const { examId } = use(params);
    const { currentUser } = useAuth();
    const router = useRouter();

    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [shuffleMap, setShuffleMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(true);
    const [newBadges, setNewBadges] = useState([]);
    const [showBadgeModal, setShowBadgeModal] = useState(false);

    useEffect(() => {
        if (currentUser && examId) {
            loadResultData().then((success) => {
                if (success) checkNewBadges();
            });
        }
    }, [currentUser, examId]);

    const loadResultData = async () => {
        try {
            // Bước 1: Tải dữ liệu cấu trúc của đề thi
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

            // Bước 2: Tải kết quả bài làm thực tế của học sinh (Attempt)
            const attempts = await examAttemptService.getStudentAttempts(currentUser.uid);
            
            // Sắp xếp các lần làm bài theo thời gian nộp bài mới nhất
            const sortedAttempts = attempts.sort((a, b) => {
                const timeA = new Date(a.submitTime || a.startTime).getTime();
                const timeB = new Date(b.submitTime || b.startTime).getTime();
                return timeB - timeA;
            });
            
            // Lấy kết quả mới nhất của đề thi này
            const currentAttempt = sortedAttempts.find(a => a.examId === examId);
            
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

            if (currentAttempt.classId) {
                const classData = await classService.getClassDetails(currentAttempt.classId);
                if (classData && classData.showResults === false) {
                    setShowDetails(false);
                }
            }

            setAttempt(currentAttempt);
            
            // Bước 3: Phục hồi trạng thái xáo trộn đáp án (Shuffle Map) để hiển thị trùng khớp với lúc làm bài
            setShuffleMap(getShuffleMap(currentAttempt.id, examData.questions));
            
            return true;
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải kết quả");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const checkNewBadges = async () => {
        try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            const oldBadgeIds = userSnap.exists() ? (userSnap.data().badges || []) : [];
            
            const [allBadges, classes, attempts] = await Promise.all([
                badgeService.getBadges(),
                studentService.getJoinedClasses(currentUser.uid),
                examAttemptService.getStudentAttempts(currentUser.uid)
            ]);

            const newlyEarned = [];
            for (const b of allBadges) {
                if (!oldBadgeIds.includes(b.id) && badgeService.evaluateCondition(b, attempts, classes)) {
                    newlyEarned.push(b);
                }
            }

            if (newlyEarned.length > 0) {
                const newIds = newlyEarned.map(b => b.id);
                await updateDoc(userRef, { badges: [...oldBadgeIds, ...newIds], lastBadgeSync: new Date().toISOString() });
                
                setNewBadges(newlyEarned);
                
                setTimeout(() => {
                    setShowBadgeModal(true);
                    // Kích hoạt hiệu ứng pháo hoa chúc mừng thành tích (Confetti)
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: ['#FFD700', '#FFA500', '#FF6347', '#00FA9A', '#00BFFF', '#9370DB']
                    });
                }, 800); // Tạo độ trễ nhỏ để đảm bảo giao diện được kết xuất hoàn toàn trước khi hiển thị hộp thoại huy hiệu
            }
        } catch (error) {
            console.error("Lỗi khi kiểm tra huy hiệu mới:", error);
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
        const studentAns = answers[q.id];
        
        if (q.type?.startsWith('group_')) {
            const subQs = q.subQuestions || [];
            subQs.forEach(sub => {
                totalPossiblePoints += parseFloat(sub.points || "1");
            });
        } else {
            totalPossiblePoints += parseFloat(q.points || "1");
        }
        
        const calcSubScore = (type, sAns, subQ) => {
            let correct = 0;
            let wrong = 0;
            let skipped = 0;
            let pEarned = 0;
            const pPossible = parseFloat(subQ.points || "1");

            if (type === 'true_false') {
                const stmts = subQ.statements || [];
                if (!sAns || Object.keys(sAns).length === 0) {
                    skipped++;
                } else {
                    let stmtCorrectCount = 0;
                    stmts.forEach((stmt, idx) => {
                        if (sAns[idx] === stmt.correct) stmtCorrectCount++;
                    });
                    if (stmtCorrectCount === stmts.length && stmts.length > 0) correct++;
                    else wrong++;
                    
                    if (stmts.length === 4 && pPossible === 1.0) {
                        if (stmtCorrectCount === 1) pEarned = 0.1;
                        else if (stmtCorrectCount === 2) pEarned = 0.25;
                        else if (stmtCorrectCount === 3) pEarned = 0.5;
                        else if (stmtCorrectCount === 4) pEarned = 1.0;
                    } else {
                        pEarned = stmts.length > 0 ? (pPossible / stmts.length) * stmtCorrectCount : 0;
                    }
                }
            } else if (type === 'fill_blank') {
                const regex = /\[\[(.*?)\]\]/g;
                const correctAnswers = [];
                let match;
                while ((match = regex.exec(subQ.content || "")) !== null) {
                    correctAnswers.push(cleanAndNormalize(match[1]));
                }
                
                if (!sAns || Object.keys(sAns).length === 0) {
                    skipped++;
                } else {
                    let blankCorrectCount = 0;
                    correctAnswers.forEach((corr, idx) => {
                        const sAnsVal = cleanAndNormalize(sAns[idx]);
                        if (sAnsVal && sAnsVal === corr) blankCorrectCount++;
                    });
                    if (blankCorrectCount === correctAnswers.length && correctAnswers.length > 0) {
                        correct++;
                        pEarned = pPossible;
                    } else {
                        wrong++;
                    }
                }
            } else if (type === 'essay') {
                if (!sAns || sAns.trim() === '') {
                    skipped++;
                } else {
                    const finalAns = cleanAndNormalize(subQ.final_answer);
                    const sAnsVal = cleanAndNormalize(sAns);
                    if (finalAns && sAnsVal === finalAns) {
                        correct++;
                        pEarned = pPossible;
                    } else {
                        wrong++;
                    }
                }
            } else {
                const actualCorrectIndex = alphabet.indexOf(subQ.correct_answer);
                if (sAns === undefined) {
                    skipped++;
                } else if (sAns === actualCorrectIndex) {
                    correct++;
                    pEarned = pPossible;
                } else {
                    wrong++;
                }
            }
            return { correct, wrong, skipped, pEarned, pPossible };
        };

        if (q.type?.startsWith('group_')) {
            const subQs = q.subQuestions || [];
            if (subQs.length === 0) {
                skippedCount++;
            } else {
                let gCorrect = 0, gWrong = 0, gSkipped = 0;
                let gPEarned = 0, gPPossible = 0;
                
                subQs.forEach(sub => {
                    const sAns = studentAns ? studentAns[sub.id] : undefined;
                    const res = calcSubScore(sub.type, sAns, sub);
                    gCorrect += res.correct;
                    gWrong += res.wrong;
                    gSkipped += res.skipped;
                    gPEarned += res.pEarned;
                    gPPossible += res.pPossible;
                });
                
                // For group questions, correctCount means ALL subquestions are correct
                if (gCorrect === subQs.length) correctCount++;
                else if (gSkipped === subQs.length) skippedCount++;
                else wrongCount++;

                // Đã cộng trực tiếp gPEarned vào totalPointsEarned ở calcSubScore
                totalPointsEarned += gPEarned;
            }
        } else {
            const res = calcSubScore(q.type, studentAns, q);
            correctCount += res.correct;
            wrongCount += res.wrong;
            skippedCount += res.skipped;
            const qPoints = parseFloat(q.points || "1");
            totalPointsEarned += (qPoints / res.pPossible) * res.pEarned;
        }
    });

    const totalQuestions = exam.questions.length;
    // Hiển thị điểm từ server nếu có, ngược lại dùng logic tính toán dự phòng
    const score = attempt.score != null ? Number(attempt.score).toFixed(2) : totalPointsEarned.toFixed(2);
    const maxScore = attempt.maxScore != null ? Number(attempt.maxScore).toFixed(2) : totalPossiblePoints.toFixed(2);
    
    // Tính toán tổng thời lượng học sinh đã sử dụng để hoàn thành bài thi
    const startTime = new Date(attempt.startTime).getTime();
    const submitTime = attempt.submitTime ? new Date(attempt.submitTime).getTime() : new Date().getTime();
    const timeSpentSeconds = Math.floor((submitTime - startTime) / 1000);
    const m = Math.floor(timeSpentSeconds / 60);
    const s = timeSpentSeconds % 60;

    return (
        <div className="space-y-6 max-w-4xl mx-auto relative">
            
            {/* Modal Chúc Mừng Huy Hiệu Mới */}
            {showBadgeModal && newBadges.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-card border border-border shadow-2xl rounded-3xl p-8 max-w-md w-full text-center relative animate-in zoom-in-95 fade-in duration-500">
                        <button 
                            onClick={() => setShowBadgeModal(false)}
                            className="absolute top-4 right-4 p-2 bg-muted/50 hover:bg-muted text-muted-foreground rounded-full transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                        
                        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trophy className="w-10 h-10 animate-bounce" />
                        </div>
                        
                        <h2 className="text-2xl font-black mb-2">Chúc Mừng! 🎉</h2>
                        <p className="text-muted-foreground mb-6 font-medium">Bạn vừa mở khóa được {newBadges.length} huy hiệu mới nhờ thành tích xuất sắc của mình.</p>
                        
                        <div className="flex flex-col gap-4 mb-8 max-h-[40vh] overflow-y-auto p-2">
                            {newBadges.map(b => (
                                <div key={b.id} className={`p-4 rounded-2xl border ${b.tier?.color || "border-border"} flex items-center gap-4 text-left shadow-sm bg-background/50`}>
                                    <div className="p-3 bg-background rounded-xl border border-border/50 shadow-sm">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{b.tier?.label}</p>
                                        <h3 className="font-bold text-sm">{b.name}</h3>
                                        <p className="text-xs opacity-80 mt-0.5">{b.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex gap-3">
                            <Link href="/student/badges" className="flex-1">
                                <Button className="w-full rounded-xl" variant="default">Xem Bộ Sưu Tập</Button>
                            </Link>
                            <Button className="flex-1 rounded-xl" variant="outline" onClick={() => setShowBadgeModal(false)}>Đóng</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 border-b border-border/60 pb-6">
                <Link href={attempt?.classId === "practice" ? "/student/practice" : `/student/class/${attempt?.classId}`}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted" title={attempt?.classId === "practice" ? "Trở về Luyện thi" : "Trở về lớp học"}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Kết quả bài thi</h1>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">{exam.title}</p>
                </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Điểm số</p>
                    <p className="text-3xl font-black text-foreground mt-1">{score} <span className="text-sm text-muted-foreground">/ {maxScore}</span></p>
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
            {showDetails ? (
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
                            const checkSubQ = (subQ, sAns) => {
                                let c = false, s = false;
                                if (subQ.type === 'true_false') {
                                    const stmts = subQ.statements || [];
                                    s = !sAns || Object.keys(sAns).length === 0;
                                    let stmtCorrectCount = 0;
                                    stmts.forEach((stmt, idx) => {
                                        if (sAns && sAns[idx] === stmt.correct) stmtCorrectCount++;
                                    });
                                    c = !s && stmtCorrectCount === stmts.length;
                                } else if (subQ.type === 'fill_blank') {
                                    const regex = /\[\[(.*?)\]\]/g;
                                    const correctAnswers = [];
                                    let match;
                                    while ((match = regex.exec(subQ.content || "")) !== null) {
                                        correctAnswers.push(cleanAndNormalize(match[1]));
                                    }
                                    
                                    s = !sAns || Object.keys(sAns).length === 0;
                                    let blankCorrectCount = 0;
                                    correctAnswers.forEach((correct, idx) => {
                                        const ansVal = cleanAndNormalize(sAns && sAns[idx]);
                                        if (ansVal && ansVal === correct) blankCorrectCount++;
                                    });
                                    c = !s && blankCorrectCount === correctAnswers.length;
                                } else if (subQ.type === 'essay') {
                                    s = !sAns || sAns.trim() === '';
                                    const finalAns = cleanAndNormalize(subQ.final_answer);
                                    const ansVal = cleanAndNormalize(sAns);
                                    c = !s && finalAns && ansVal === finalAns;
                                } else {
                                    const aIdx = alphabet.indexOf(subQ.correct_answer);
                                    s = sAns === undefined;
                                    c = sAns === aIdx;
                                }
                                return { isCorrect: c, isSkipped: s };
                            };

                            let isCorrect = false;
                            let isSkipped = false;
                            
                            if (q.type?.startsWith('group_')) {
                                const subQs = q.subQuestions || [];
                                if (subQs.length === 0) {
                                    isSkipped = true;
                                } else {
                                    let allCorrect = true;
                                    let allSkipped = true;
                                    subQs.forEach(sub => {
                                        const res = checkSubQ(sub, studentAns ? studentAns[sub.id] : undefined);
                                        if (!res.isCorrect) allCorrect = false;
                                        if (!res.isSkipped) allSkipped = false;
                                    });
                                    isCorrect = allCorrect;
                                    isSkipped = allSkipped;
                                }
                            } else {
                                const res = checkSubQ(q, studentAns);
                                isCorrect = res.isCorrect;
                                isSkipped = res.isSkipped;
                            }

                            return (
                                <VirtualizedItem key={q.id} height={200}>
                                    <div className="p-5 sm:p-8 hover:bg-muted/10 transition-colors">
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
                                                {q.images && q.images.length > 0 && (
                                                    <div className="mt-4 space-y-3">
                                                        {q.images.map((img, i) => (
                                                            img ? <img key={i} src={img} alt={`Minh họa câu hỏi ${i+1}`} className="max-h-60 rounded-xl border border-border object-contain shadow-sm" /> : null
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {(!q.type || q.type === 'multiple_choice') && !q.type?.startsWith('group_') && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                                    {(shuffleMap[q.id] || q.options?.map((_, i) => i) || []).map((originalIdx, renderIdx) => {
                                                        const opt = q.options[originalIdx];
                                                        const isStudentChoice = studentAns === originalIdx;
                                                        const isActualCorrect = actualCorrectIndex === originalIdx;
                                                        
                                                        let style = "bg-card border-border text-muted-foreground";
                                                        
                                                        if (isActualCorrect) {
                                                            style = "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500 shadow-sm";
                                                        } else if (isStudentChoice && !isCorrect) {
                                                            style = "bg-red-50 border-red-500 text-red-800 dark:bg-red-950/40 dark:text-red-300 shadow-sm";
                                                        }

                                                        return (
                                                            <div key={originalIdx} className={`p-3 rounded-xl border-2 flex items-start gap-3 transition-colors ${style}`}>
                                                                <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-black ${
                                                                    isActualCorrect ? "bg-emerald-500 text-white" :
                                                                    (isStudentChoice ? "bg-red-500 text-white" : "bg-muted text-muted-foreground")
                                                                }`}>
                                                                    {alphabet[renderIdx]}
                                                                </div>
                                                                <div className={`mt-0.5 font-medium ${isActualCorrect || isStudentChoice ? "text-inherit" : "text-muted-foreground"}`}>
                                                                    <LatexRenderer content={opt} inline={true} />
                                                                    {q.options_images && q.options_images[originalIdx] && (
                                                                        <div className="mt-2">
                                                                            <img src={q.options_images[originalIdx]} alt={`Minh họa đáp án ${alphabet[renderIdx]}`} className="max-h-24 rounded-md border border-border object-contain" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {q.type === 'true_false' && (
                                                <div className="space-y-3 mt-4">
                                                    {q.statements?.map((stmt, sIdx) => {
                                                        const sChoice = studentAns ? studentAns[sIdx] : undefined;
                                                        const sCorrect = stmt.correct;
                                                        const isStmtCorrect = sChoice === sCorrect;
                                                        const isStmtSkipped = sChoice === undefined;

                                                        let borderStyle = "border-border";
                                                        if (!isStmtSkipped) {
                                                            borderStyle = isStmtCorrect ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-500 bg-red-50/50 dark:bg-red-950/20";
                                                        }

                                                        return (
                                                            <div key={sIdx} className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${borderStyle}`}>
                                                                <div className="flex-1 font-medium text-foreground">
                                                                    <span className="font-bold mr-2">{sIdx + 1}.</span>
                                                                    <LatexRenderer content={stmt.text} inline={true} />
                                                                </div>
                                                                <div className="flex items-center gap-4 shrink-0 text-sm">
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-muted-foreground text-xs font-semibold mb-1">Bạn chọn:</span>
                                                                        <span className={`font-bold px-3 py-1 rounded-md ${
                                                                            isStmtSkipped ? "bg-muted text-muted-foreground" : 
                                                                            (sChoice ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300")
                                                                        }`}>
                                                                            {isStmtSkipped ? "Bỏ qua" : (sChoice ? "Đúng" : "Sai")}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-muted-foreground text-xs font-semibold mb-1">Đáp án:</span>
                                                                        <span className={`font-bold px-3 py-1 rounded-md ${
                                                                            sCorrect ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                                                        }`}>
                                                                            {sCorrect ? "Đúng" : "Sai"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {q.type === 'fill_blank' && (
                                                <div className="space-y-3 mt-4">
                                                    {(() => {
                                                        const regex = /\[\[(.*?)\]\]/g;
                                                        const correctAnswers = [];
                                                        let match;
                                                        while ((match = regex.exec(q.content || "")) !== null) {
                                                            correctAnswers.push(match[1]);
                                                        }

                                                        return correctAnswers.map((correct, sIdx) => {
                                                            const sChoice = studentAns ? studentAns[sIdx] : "";
                                                            const isStmtSkipped = !sChoice || sChoice.trim() === "";
                                                            const isStmtCorrect = !isStmtSkipped && sChoice.trim().toLowerCase() === correct.trim().toLowerCase();

                                                            let borderStyle = "border-border";
                                                            if (!isStmtSkipped) {
                                                                borderStyle = isStmtCorrect ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-500 bg-red-50/50 dark:bg-red-950/20";
                                                            }

                                                            return (
                                                                <div key={sIdx} className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${borderStyle}`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="w-8 h-8 rounded-md bg-muted flex items-center justify-center font-black text-muted-foreground shrink-0 text-sm">
                                                                            {sIdx + 1}
                                                                        </span>
                                                                        <div className="font-bold text-foreground">
                                                                            Ô trống {sIdx + 1}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 shrink-0 text-sm">
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-muted-foreground text-xs font-semibold mb-1">Bạn điền:</span>
                                                                            <span className={`font-bold px-3 py-1 rounded-md max-w-[150px] truncate ${
                                                                                isStmtSkipped ? "bg-muted text-muted-foreground" : 
                                                                                (isStmtCorrect ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300")
                                                                            }`}>
                                                                                {isStmtSkipped ? "Bỏ qua" : sChoice}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-muted-foreground text-xs font-semibold mb-1">Đáp án:</span>
                                                                            <span className="font-bold px-3 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 max-w-[150px] truncate">
                                                                                {correct}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            )}

                                            {q.type === 'essay' && (
                                                <div className="space-y-4 mt-4">
                                                    <div className="p-4 rounded-xl border-2 border-border bg-muted/30">
                                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Bài làm của bạn:</span>
                                                        <div className="font-medium text-foreground whitespace-pre-wrap">
                                                            {studentAns || <span className="text-muted-foreground italic">Không có câu trả lời</span>}
                                                        </div>
                                                    </div>
                                                    {q.final_answer && (
                                                        <div className="p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-2">Đáp án tham khảo:</span>
                                                            <div className="font-medium text-emerald-800 dark:text-emerald-200">
                                                                <LatexRenderer content={q.final_answer} inline={true} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {q.type?.startsWith('group_') && (
                                                <div className="mt-6 space-y-6">
                                                    {q.subQuestions?.map((subQ, sIdx) => {
                                                        const sAns = studentAns ? studentAns[subQ.id] : undefined;
                                                        const res = checkSubQ(subQ, sAns);
                                                        const isSubSkipped = res.isSkipped;
                                                        const isSubCorrect = res.isCorrect;
                                                        const actualSubCorrectIndex = alphabet.indexOf(subQ.correct_answer);

                                                        return (
                                                            <div key={subQ.id} className="p-4 rounded-xl border border-border bg-background/50">
                                                                <div className="flex items-start gap-3 mb-4">
                                                                    <div className="shrink-0 mt-0.5">
                                                                        {isSubCorrect ? (
                                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                                        ) : isSubSkipped ? (
                                                                            <AlertCircle className="w-5 h-5 text-slate-400" />
                                                                        ) : (
                                                                            <XCircle className="w-5 h-5 text-red-500" />
                                                                        )}
                                                                    </div>
                                                                    <div className="font-medium">
                                                                        <span className="font-bold mr-2">Câu {sIdx + 1}:</span>
                                                                        <LatexRenderer content={subQ.content} inline={true} />
                                                                    </div>
                                                                </div>

                                                                {(!subQ.type || subQ.type === 'multiple_choice') && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                                        {(shuffleMap[subQ.id] || subQ.options?.map((_, i) => i) || []).map((originalIdx, renderIdx) => {
                                                                            const opt = subQ.options[originalIdx];
                                                                            const isStudentChoice = sAns === originalIdx;
                                                                            const isActualCorrect = actualSubCorrectIndex === originalIdx;
                                                                            
                                                                            let style = "bg-card border-border text-muted-foreground opacity-50";
                                                                            
                                                                            if (isActualCorrect) {
                                                                                style = "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500 shadow-sm opacity-100";
                                                                            } else if (isStudentChoice && !isSubCorrect) {
                                                                                style = "bg-red-50 border-red-500 text-red-800 dark:bg-red-950/40 dark:text-red-300 shadow-sm opacity-100";
                                                                            } else if (isStudentChoice) {
                                                                                style = "opacity-100 border-border";
                                                                            }

                                                                            return (
                                                                                <div key={originalIdx} className={`p-2 rounded-lg border flex items-start gap-2 ${style}`}>
                                                                                    <div className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                                                                                        isActualCorrect ? "bg-emerald-500 text-white" :
                                                                                        (isStudentChoice ? "bg-red-500 text-white" : "bg-muted text-muted-foreground")
                                                                                    }`}>
                                                                                        {alphabet[renderIdx]}
                                                                                    </div>
                                                                                    <div className={`mt-0 text-sm ${isActualCorrect || isStudentChoice ? "text-inherit font-medium" : "text-muted-foreground"}`}>
                                                                                        <LatexRenderer content={opt} inline={true} />
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {subQ.type === 'true_false' && (
                                                                    <div className="space-y-2 mt-3">
                                                                        {subQ.statements?.map((stmt, s2Idx) => {
                                                                            const s2Choice = sAns ? sAns[s2Idx] : undefined;
                                                                            const s2Correct = stmt.correct;
                                                                            const isS2Skipped = s2Choice === undefined;
                                                                            const isS2Correct = s2Choice === s2Correct;

                                                                            return (
                                                                                <div key={s2Idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg border border-border/50 text-sm">
                                                                                    <div className="flex-1">
                                                                                        <span className="font-bold mr-1">{s2Idx + 1}.</span>
                                                                                        <LatexRenderer content={stmt.text} inline={true} />
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                                                            isS2Skipped ? "bg-muted text-muted-foreground" : 
                                                                                            (isS2Correct ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300")
                                                                                        }`}>
                                                                                            {isS2Skipped ? "Bỏ qua" : (s2Choice ? "Đúng" : "Sai")}
                                                                                        </span>
                                                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300`}>
                                                                                            Đáp án: {s2Correct ? "Đúng" : "Sai"}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                                
                                                                {subQ.type === 'fill_blank' && (
                                                                    <div className="space-y-2 mt-3">
                                                                        {(() => {
                                                                            const regex = /\[\[(.*?)\]\]/g;
                                                                            const correctAnswers = [];
                                                                            let match;
                                                                            while ((match = regex.exec(subQ.content || "")) !== null) correctAnswers.push(match[1]);

                                                                            return correctAnswers.map((correct, s2Idx) => {
                                                                                const s2Choice = sAns ? sAns[s2Idx] : "";
                                                                                const isS2Skipped = !s2Choice || s2Choice.trim() === "";
                                                                                const isS2Correct = !isS2Skipped && s2Choice.trim().toLowerCase() === correct.trim().toLowerCase();

                                                                                return (
                                                                                    <div key={s2Idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg border border-border/50 text-sm">
                                                                                        <div className="font-bold">Ô {s2Idx + 1}</div>
                                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold max-w-[100px] truncate ${
                                                                                                isS2Skipped ? "bg-muted text-muted-foreground" : 
                                                                                                (isS2Correct ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300")
                                                                                            }`}>
                                                                                                {isS2Skipped ? "Bỏ qua" : s2Choice}
                                                                                            </span>
                                                                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 max-w-[100px] truncate">
                                                                                                Đáp án: {correct}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            });
                                                                        })()}
                                                                    </div>
                                                                )}

                                                                {subQ.type === 'essay' && (
                                                                    <div className="space-y-2 mt-3 text-sm">
                                                                        <div className="p-3 rounded-lg border border-border bg-muted/30">
                                                                            <span className="font-bold text-muted-foreground mb-1 block text-xs uppercase">Bạn:</span>
                                                                            <div className="whitespace-pre-wrap">{sAns || <span className="italic text-muted-foreground">Không có</span>}</div>
                                                                        </div>
                                                                        {subQ.final_answer && (
                                                                            <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                                                                                <span className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 block text-xs uppercase">Đáp án:</span>
                                                                                <div className="text-emerald-800 dark:text-emerald-200"><LatexRenderer content={subQ.final_answer} inline={true} /></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    </div>
                                </VirtualizedItem>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-8 mt-8 text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-2">Chi tiết đáp án đã bị ẩn</h3>
                    <p className="text-sm text-amber-600/80 dark:text-amber-400/80 max-w-md mx-auto">
                        Giáo viên đã thiết lập không hiển thị chi tiết đáp án cho bài thi này.
                    </p>
                </div>
            )}

            <div className="pt-6 flex justify-center pb-12">
                <Link href={attempt?.classId === "practice" ? "/student/practice" : `/student/class/${attempt?.classId}`}>
                    <Button className="h-11 px-8 rounded-xl font-bold gap-2">
                        <LayoutDashboard className="w-5 h-5" /> {attempt?.classId === "practice" ? "Trở về Luyện thi" : "Trở về lớp học"}
                    </Button>
                </Link>
            </div>
        </div>
    );
}
