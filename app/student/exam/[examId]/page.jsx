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
import dynamic from "next/dynamic";
const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});
import { useConfirm } from "@/context/ConfirmContext";
import { getShuffleMap } from "@/lib/shuffleUtils";
import { useAntiCheat } from "@/hooks/student/useAntiCheat";
import { ExamSidebar } from "@/components/student/exam/ExamSidebar";
import { ExamHeader } from "@/components/student/exam/ExamHeader";
import { QuestionRenderer } from "@/components/student/exam/QuestionRenderer";
import { useExamState } from "@/hooks/student/useExamState";

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
    
    const isPracticeMode = searchParams.get("mode") === "practice";

    const {
        exam, attempt, answers, reviewMarks, currentQuestionIdx, currentSubQuestionIdx, pastAttemptsCount,
        practiceResults, isTimerEnabled, isSubmitting, timeLeft, loading, isSpeaking, showQuestionMap, shuffleMap,
        setCurrentQuestionIdx, setCurrentSubQuestionIdx, setIsTimerEnabled, setShowQuestionMap,
        handleSelectAnswer, handleSelectTrueFalse, handleTextAnswer, handleFillBlankAnswer, handleGroupAnswer,
        handleToggleReview, handleSubmit, handleCheckAnswer, handleExitPractice, handleReadAloud
    } = useExamState(examId, classId, isPracticeMode, currentUser, confirmDialog);

    // HỆ THỐNG GIÁM SÁT VÀ CHỐNG GIAN LẬN (Anti-cheat)
    useAntiCheat(isSubmitting, timeLeft, attempt);

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
            <ExamHeader
                exam={exam}
                currentUser={currentUser}
                isPracticeMode={isPracticeMode}
                pastAttemptsCount={pastAttemptsCount}
                isTimerEnabled={isTimerEnabled}
                setIsTimerEnabled={setIsTimerEnabled}
                timeLeft={timeLeft}
                handleExitPractice={handleExitPractice}
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                {/* Body: Question Area */}
                <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-8 flex flex-col relative">
                        <QuestionRenderer
                            exam={exam}
                            currentQuestion={currentQuestion}
                            currentQuestionIdx={currentQuestionIdx}
                            currentSubQuestionIdx={currentSubQuestionIdx}
                            setCurrentQuestionIdx={setCurrentQuestionIdx}
                            setCurrentSubQuestionIdx={setCurrentSubQuestionIdx}
                            answers={answers}
                            reviewMarks={reviewMarks}
                            shuffleMap={shuffleMap}
                            isPracticeMode={isPracticeMode}
                            practiceResults={practiceResults}
                            isSpeaking={isSpeaking}
                            handleReadAloud={handleReadAloud}
                            handleToggleReview={handleToggleReview}
                            handleFillBlankAnswer={handleFillBlankAnswer}
                            handleSelectAnswer={handleSelectAnswer}
                            handleSelectTrueFalse={handleSelectTrueFalse}
                            handleTextAnswer={handleTextAnswer}
                            handleGroupAnswer={handleGroupAnswer}
                            handleCheckAnswer={handleCheckAnswer}
                            setShowQuestionMap={setShowQuestionMap}
                        />
                </div>

                {/* Backdrop overlay for mobile question map drawer */}
                {showQuestionMap && (
                    <div 
                        className="fixed inset-0 bg-black/60 z-[105] md:hidden animate-in fade-in duration-200"
                        onClick={() => setShowQuestionMap(false)}
                    />
                )}

                {/* Sidebar: Map of Questions */}
                <ExamSidebar
                    exam={exam}
                    answers={answers}
                    reviewMarks={reviewMarks}
                    currentQuestionIdx={currentQuestionIdx}
                    currentSubQuestionIdx={currentSubQuestionIdx}
                    setCurrentQuestionIdx={setCurrentQuestionIdx}
                    setCurrentSubQuestionIdx={setCurrentSubQuestionIdx}
                    showQuestionMap={showQuestionMap}
                    setShowQuestionMap={setShowQuestionMap}
                />
            </div>
        </div>
    );
}
