import { ChevronDown, ChevronUp, Trash2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});
const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
        case "nhan_biet": return { label: "Nhận biết", className: "bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40" };
        case "thong_hieu": return { label: "Thông hiểu", className: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40" };
        case "van_dung": return { label: "Vận dụng", className: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40" };
        case "van_dung_cao": return { label: "Vận dụng cao", className: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40" };
        default: return { label: "Nhận biết", className: "bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40" };
    }
};

/**
 * Component QuestionCard
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  q - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function QuestionCard({ q, toggleCollapse, handleDelete }) {
    const isGroup = q.type?.startsWith("group_");
    const displayPoints = isGroup
        ? (q.subQuestions || []).reduce((sum, sq) => sum + parseFloat(sq.points || 0), 0).toFixed(2).replace(/\.?0+$/, "")
        : q.points;
    return (
        <div className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/60 p-3 sm:px-4 sm:py-3 border-b border-border/60 gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold border uppercase tracking-wider ${q.typeClass}`}>
                        {q.typeName}
                    </span>
                    {q.difficulty && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold border uppercase tracking-wider ${getDifficultyBadge(q.difficulty).className}`}>
                            {getDifficultyBadge(q.difficulty).label}
                        </span>
                    )}
                    <span className="font-bold text-xs sm:text-sm text-foreground">{q.number_label}</span>
                    <span className="text-[9px] sm:text-[10px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-850/30 font-bold shadow-sm">
                        {q.subject}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full border border-violet-200/50 dark:border-violet-850/30 font-medium shadow-sm">
                        {q.grade === "Đại học" ? "Đại học" : `Lớp ${q.grade}`}
                    </span>
                    {q.province && (
                        <span className="text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200/50 font-medium">
                            {q.province}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-1.5 border-t border-border/40 pt-2 sm:border-none sm:pt-0 shrink-0">
                    <span className="text-xs font-bold text-primary sm:mr-2">
                        {displayPoints} điểm
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost" size="icon"
                            onClick={() => toggleCollapse(q.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            {q.isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant="ghost" size="icon"
                            onClick={() => handleDelete(q.id, q.examId)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {!q.isCollapsed && (
                <div className="p-4 sm:p-5 space-y-4">
                    {q.examTitle && (
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 bg-muted/30 p-2 rounded-lg w-fit border border-border/50">
                            <Bookmark className="w-3 h-3 text-primary" /> Nguồn đề: {q.examTitle}
                        </div>
                    )}

                    <div className="text-sm font-medium text-foreground leading-relaxed">
                        <LatexRenderer text={q.content} />
                    </div>

                    {q.type?.includes("multiple_choice") && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {q.options.map((opt, optIndex) => {
                                const isCorrect = String.fromCharCode(65 + optIndex) === q.correct_answer;
                                return (
                                    <div
                                        key={optIndex}
                                        className={`p-3 rounded-xl border text-xs font-medium ${isCorrect
                                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold"
                                            : "border-border bg-background"
                                            }`}
                                    >
                                        <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIndex)}.</span>
                                        <LatexRenderer text={opt} />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {q.type?.includes("true_false") && q.statements && (
                        <div className="space-y-2 mt-2">
                            {q.statements.map((st, i) => (
                                <div key={i} className="flex justify-between items-center p-2.5 rounded-xl border border-border bg-background text-xs">
                                    <span className="font-medium"><LatexRenderer text={st.text} /></span>
                                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${st.result === "Đ" || st.correct === true ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"}`}>
                                        {st.result === "Đ" || st.correct === true ? "Đúng" : "Sai"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {q.type?.includes("matching") && q.pairs && (
                        <div className="space-y-2 mt-2">
                            {q.pairs.map((pair, i) => (
                                <div key={i} className="flex justify-between items-center p-2.5 rounded-xl border border-border bg-background text-xs gap-4">
                                    <div className="flex-1 font-medium bg-cyan-50/50 dark:bg-cyan-950/20 p-2 rounded-lg border border-cyan-100 dark:border-cyan-900/50">
                                        <LatexRenderer text={pair.left} />
                                    </div>
                                    <div className="text-cyan-600 dark:text-cyan-400 font-bold shrink-0">⟷</div>
                                    <div className="flex-1 font-medium bg-cyan-50/50 dark:bg-cyan-950/20 p-2 rounded-lg border border-cyan-100 dark:border-cyan-900/50">
                                        <LatexRenderer text={pair.right} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {q.type?.includes("ordering") && q.items && (
                        <div className="space-y-2 mt-2">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Thứ tự đúng:</div>
                            {q.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-background text-xs">
                                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 font-bold shrink-0">{i + 1}</span>
                                    <span className="font-medium flex-1"><LatexRenderer text={item.text} /></span>
                                </div>
                            ))}
                        </div>
                    )}

                    {isGroup && q.subQuestions && (
                        <div className="space-y-4 border-l-2 border-primary/20 pl-4 mt-4">
                            <p className="text-xs font-bold text-primary uppercase tracking-wider select-none">Các câu con của nhóm:</p>
                            {q.subQuestions.map((subQ) => (
                                <div key={subQ.id} className="bg-muted/40 p-3.5 rounded-xl border border-border space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-foreground">{subQ.number_label}</span>
                                            {subQ.difficulty && (
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getDifficultyBadge(subQ.difficulty).className}`}>
                                                    {getDifficultyBadge(subQ.difficulty).label}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground">{subQ.points} điểm</span>
                                    </div>
                                    <div className="text-xs font-medium text-foreground"><LatexRenderer text={subQ.content} /></div>
                                    
                                    {subQ.type?.includes("multiple_choice") && subQ.options && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                            {subQ.options.map((opt, optIndex) => {
                                                const isCorrect = String.fromCharCode(65 + optIndex) === subQ.correct_answer;
                                                return (
                                                    <div key={optIndex} className={`p-2 rounded-lg border text-[11px] ${isCorrect ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold" : "border-border bg-background"}`}>
                                                        <span className="font-bold mr-1">{String.fromCharCode(65 + optIndex)}.</span>
                                                        <LatexRenderer text={opt} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {subQ.type?.includes("true_false") && subQ.statements && (
                                        <div className="space-y-1.5 mt-1.5">
                                            {subQ.statements.map((st, i) => (
                                                <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-border bg-background text-[11px]">
                                                    <span className="font-medium"><LatexRenderer text={st.text} /></span>
                                                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px] ${st.result === "Đ" || st.correct === true ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"}`}>
                                                        {st.result === "Đ" || st.correct === true ? "Đúng" : "Sai"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {subQ.type?.includes("matching") && subQ.pairs && (
                                        <div className="space-y-1.5 mt-1.5">
                                            {subQ.pairs.map((pair, i) => (
                                                <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-border bg-background text-[11px] gap-2">
                                                    <div className="flex-1 font-medium bg-cyan-50/50 dark:bg-cyan-950/20 p-1.5 rounded border border-cyan-100 dark:border-cyan-900/50">
                                                        <LatexRenderer text={pair.left} />
                                                    </div>
                                                    <div className="text-cyan-600 dark:text-cyan-400 font-bold shrink-0 text-[10px]">⟷</div>
                                                    <div className="flex-1 font-medium bg-cyan-50/50 dark:bg-cyan-950/20 p-1.5 rounded border border-cyan-100 dark:border-cyan-900/50">
                                                        <LatexRenderer text={pair.right} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {subQ.type?.includes("ordering") && subQ.items && (
                                        <div className="space-y-1.5 mt-1.5">
                                            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Thứ tự đúng:</div>
                                            {subQ.items.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background text-[11px]">
                                                    <span className="w-4 h-4 flex items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 font-bold shrink-0 text-[9px]">{i + 1}</span>
                                                    <span className="font-medium flex-1"><LatexRenderer text={item.text} /></span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(subQ.final_answer || subQ.suggested_solution || (subQ.solution_images && subQ.solution_images.length > 0)) && (
                                        <div className="p-3 rounded-xl bg-slate-50/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-800/30 space-y-2.5 mt-2">
                                            {subQ.final_answer && (
                                                <div className="text-[11px]">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1 select-none">🎯 Kết quả / Đáp số đúng:</span>
                                                    <div className="p-2 rounded-lg border border-blue-200 bg-blue-50/20 dark:border-blue-900/30 dark:bg-blue-950/5 text-foreground font-semibold">
                                                        <LatexRenderer text={subQ.final_answer} />
                                                    </div>
                                                </div>
                                            )}
                                            {subQ.suggested_solution && (
                                                <div className="text-[11px] text-muted-foreground">
                                                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1 select-none">💡 Lời giải mẫu chi tiết:</span>
                                                    <div className="leading-relaxed"><LatexRenderer text={subQ.suggested_solution} /></div>
                                                </div>
                                            )}
                                            {subQ.solution_images && subQ.solution_images.length > 0 && (
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-muted-foreground block select-none">Hình ảnh lời giải:</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {subQ.solution_images.map((img, idx) => (
                                                            <img key={idx} src={img} alt={`Ảnh lời giải con ${idx + 1}`} className="h-16 w-auto rounded border border-border/60 object-contain bg-background" />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {(q.final_answer || q.suggested_solution || (q.solution_images && q.solution_images.length > 0)) && (
                        <div className="mt-4 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/40 space-y-3">
                            {q.final_answer && (
                                <div className="text-xs">
                                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1 select-none">Kết quả / Đáp số đúng:</span>
                                    <div className="p-2.5 rounded-xl border border-blue-250 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/10 text-foreground font-semibold">
                                        <LatexRenderer text={q.final_answer} />
                                    </div>
                                </div>
                            )}
                            {q.suggested_solution && (
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1 select-none">Lời giải mẫu chi tiết:</span>
                                    <div className="leading-relaxed"><LatexRenderer text={q.suggested_solution} /></div>
                                </div>
                            )}
                            {q.solution_images && q.solution_images.length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-muted-foreground block select-none">Hình ảnh lời giải:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {q.solution_images.map((img, idx) => (
                                            <img key={idx} src={img} alt={`Ảnh lời giải ${idx + 1}`} className="h-20 w-auto rounded-lg border border-border/80 object-contain bg-background" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
