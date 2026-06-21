import React from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import VirtualizedItem from "@/components/shared/VirtualizedItem";
import { cleanAndNormalize } from "@/lib/textUtils";

const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});

export const ResultQuestionRenderer = ({ q, idx, studentAns, shuffleMap }) => {
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
        } else if (subQ.type === 'matching') {
            s = !sAns || !Array.isArray(sAns);
            let matchCorrectCount = 0;
            subQ.pairs?.forEach((pair, idx) => {
                if (sAns && sAns[idx] === pair.id) matchCorrectCount++;
            });
            c = !s && matchCorrectCount === subQ.pairs?.length;
        } else if (subQ.type === 'ordering') {
            s = !sAns || !Array.isArray(sAns);
            let orderCorrectCount = 0;
            subQ.items?.forEach((item, idx) => {
                if (sAns && sAns[idx] === item.id) orderCorrectCount++;
            });
            c = !s && orderCorrectCount === subQ.items?.length;
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

                    {q.type === 'matching' && (
                        <div className="space-y-3 mt-4">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Ghép nối của bạn:</div>
                            {q.pairs?.map((pair, pIdx) => {
                                const sChoice = studentAns && Array.isArray(studentAns) ? studentAns[pIdx] : null;
                                const isPairSkipped = !sChoice;
                                const isPairCorrect = sChoice === pair.id;
                                const rightSide = isPairSkipped ? null : q.pairs.find(p => p.id === sChoice);
                                
                                let borderStyle = "border-border bg-muted/30";
                                if (!isPairSkipped) {
                                    borderStyle = isPairCorrect ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-500 bg-red-50/50 dark:bg-red-950/20";
                                }

                                return (
                                    <div key={pIdx} className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row justify-between items-center gap-4 ${borderStyle}`}>
                                        <div className="flex-1 font-medium bg-background p-3 rounded-lg border border-border/60 shadow-sm w-full">
                                            <LatexRenderer content={pair.left} />
                                        </div>
                                        <div className="text-muted-foreground font-bold shrink-0">⟷</div>
                                        <div className="flex-1 font-medium bg-background p-3 rounded-lg border border-border/60 shadow-sm w-full">
                                            {isPairSkipped ? (
                                                <span className="italic text-muted-foreground">Chưa nối</span>
                                            ) : (
                                                <LatexRenderer content={rightSide?.right} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {!isCorrect && (
                                <div className="mt-4 p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-2">Đáp án chuẩn:</span>
                                    <div className="space-y-2">
                                        {q.pairs?.map((pair, pIdx) => (
                                            <div key={pIdx} className="flex justify-between items-center gap-4 p-2 bg-background rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                                                <div className="flex-1 text-sm"><LatexRenderer content={pair.left} /></div>
                                                <div className="text-emerald-500 font-bold text-xs shrink-0">⟷</div>
                                                <div className="flex-1 text-sm text-emerald-700 dark:text-emerald-300 font-medium"><LatexRenderer content={pair.right} /></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {q.type === 'ordering' && (
                        <div className="space-y-3 mt-4">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Thứ tự của bạn:</div>
                            <div className="space-y-2">
                                {studentAns && Array.isArray(studentAns) && studentAns.length > 0 ? (
                                    studentAns.map((itemId, oIdx) => {
                                        const item = q.items?.find(i => i.id === itemId);
                                        const isItemCorrect = q.items?.[oIdx]?.id === itemId;
                                        let style = isItemCorrect ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-500 bg-red-50/50 dark:bg-red-950/20";
                                        return (
                                            <div key={oIdx} className={`p-3 rounded-xl border-2 flex items-center gap-3 ${style}`}>
                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full font-bold shrink-0 text-xs text-white ${isItemCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                                                    {oIdx + 1}
                                                </span>
                                                <span className="font-medium flex-1 bg-background p-2 rounded-md border border-border/50 shadow-sm"><LatexRenderer content={item?.text} /></span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 rounded-xl border-2 border-border bg-muted/30 italic text-muted-foreground text-center">Chưa sắp xếp</div>
                                )}
                            </div>
                            {!isCorrect && (
                                <div className="mt-4 p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-2">Thứ tự đúng:</span>
                                    <div className="space-y-2">
                                        {q.items?.map((item, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-3 p-2 bg-background rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                                                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold shrink-0 text-xs">
                                                    {oIdx + 1}
                                                </span>
                                                <span className="font-medium flex-1 text-sm text-emerald-800 dark:text-emerald-200"><LatexRenderer content={item.text} /></span>
                                            </div>
                                        ))}
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

                                        {subQ.type === 'matching' && (
                                            <div className="space-y-2 mt-3">
                                                {subQ.pairs?.map((pair, pIdx) => {
                                                    const sChoice = sAns && Array.isArray(sAns) ? sAns[pIdx] : null;
                                                    const isPairSkipped = !sChoice;
                                                    const isPairCorrect = sChoice === pair.id;
                                                    const rightSide = isPairSkipped ? null : subQ.pairs.find(p => p.id === sChoice);
                                                    
                                                    let borderStyle = "border-border/50";
                                                    if (!isPairSkipped) {
                                                        borderStyle = isPairCorrect ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-500 bg-red-50/50 dark:bg-red-950/20";
                                                    }

                                                    return (
                                                        <div key={pIdx} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg border text-sm ${borderStyle}`}>
                                                            <div className="flex-1 font-medium"><LatexRenderer content={pair.left} /></div>
                                                            <div className="text-muted-foreground font-bold shrink-0 text-xs">⟷</div>
                                                            <div className="flex-1">
                                                                {isPairSkipped ? (
                                                                    <span className="italic text-muted-foreground text-xs">Chưa nối</span>
                                                                ) : (
                                                                    <LatexRenderer content={rightSide?.right} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {!isSubCorrect && (
                                                    <div className="mt-2 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs">
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Đáp án:</span>
                                                        {subQ.pairs?.map((pair, pIdx) => (
                                                            <div key={pIdx} className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 mb-1 last:mb-0">
                                                                <div className="flex-1"><LatexRenderer content={pair.left} /></div>
                                                                <div className="shrink-0">⟷</div>
                                                                <div className="flex-1 font-medium"><LatexRenderer content={pair.right} /></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {subQ.type === 'ordering' && (
                                            <div className="space-y-2 mt-3">
                                                {sAns && Array.isArray(sAns) && sAns.length > 0 ? (
                                                    sAns.map((itemId, oIdx) => {
                                                        const item = subQ.items?.find(i => i.id === itemId);
                                                        const isItemCorrect = subQ.items?.[oIdx]?.id === itemId;
                                                        let style = isItemCorrect ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-500 bg-red-50/50 dark:bg-red-950/20";
                                                        return (
                                                            <div key={oIdx} className={`p-2 rounded-lg border flex items-center gap-2 text-sm ${style}`}>
                                                                <span className={`w-5 h-5 flex items-center justify-center rounded font-bold shrink-0 text-[10px] text-white ${isItemCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                                                                    {oIdx + 1}
                                                                </span>
                                                                <span className="font-medium flex-1"><LatexRenderer content={item?.text} /></span>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="p-2 rounded-lg border border-border/50 italic text-muted-foreground text-xs text-center">Chưa sắp xếp</div>
                                                )}
                                                {!isSubCorrect && (
                                                    <div className="mt-2 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs">
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Thứ tự đúng:</span>
                                                        {subQ.items?.map((item, oIdx) => (
                                                            <div key={oIdx} className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 mb-1 last:mb-0">
                                                                <span className="w-4 h-4 flex items-center justify-center rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold shrink-0 text-[10px]">
                                                                    {oIdx + 1}
                                                                </span>
                                                                <span className="font-medium flex-1"><LatexRenderer content={item.text} /></span>
                                                            </div>
                                                        ))}
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
};
