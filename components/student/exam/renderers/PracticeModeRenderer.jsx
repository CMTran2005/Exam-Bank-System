import { CheckCircle2, XCircle, BookOpen } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});

export function PracticeModeRenderer({
    currentQuestion,
    isPracticeMode,
    isAnswered,
    practiceResults,
    handleCheckAnswer
}) {
    if (!isPracticeMode || currentQuestion.type?.startsWith('group_')) return null;

    return (
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
    );
}
