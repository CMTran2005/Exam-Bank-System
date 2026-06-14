import { Clock, Timer, TimerOff, LogOut, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExamHeader({
    exam,
    currentUser,
    isPracticeMode,
    pastAttemptsCount,
    isTimerEnabled,
    setIsTimerEnabled,
    timeLeft,
    handleExitPractice,
    handleSubmit,
    isSubmitting
}) {
    // Format thời gian
    const formatTime = (seconds) => {
        if (seconds === null) return "--:--";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
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
    );
}
