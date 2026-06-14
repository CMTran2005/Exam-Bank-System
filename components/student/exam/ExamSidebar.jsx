import { Flag, LayoutGrid, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExamSidebar({
    exam,
    answers,
    reviewMarks,
    currentQuestionIdx,
    currentSubQuestionIdx,
    setCurrentQuestionIdx,
    setCurrentSubQuestionIdx,
    showQuestionMap,
    setShowQuestionMap
}) {
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

    return (
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
    );
}
