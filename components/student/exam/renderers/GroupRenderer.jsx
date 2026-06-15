import { CheckCircle2, XCircle, BookOpen } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});

export function GroupRenderer({
    currentQuestion,
    currentSubQuestionIdx,
    answers,
    shuffleMap,
    isPracticeMode,
    practiceResults,
    handleGroupAnswer,
    handleCheckAnswer
}) {
    if (!currentQuestion?.type?.startsWith("group_")) return null;

    const subQ = currentQuestion.subQuestions?.[currentSubQuestionIdx];
    if (!subQ) return null;

    const idx = currentSubQuestionIdx;
    const subAns = answers[currentQuestion.id] ? answers[currentQuestion.id][subQ.id] : undefined;
    const shuffleMapSub = shuffleMap[subQ.id] || subQ.options?.map((_, i) => i) || [];

    return (
        <div className="space-y-8 mb-8">
            <div key={subQ.id} className="border-t-2 border-dashed border-border pt-6 mt-6 first:border-0 first:pt-0 first:mt-0">
                <div className="font-bold text-lg mb-4 text-foreground">
                    Câu {idx + 1}. <LatexRenderer content={subQ.content || ""} inline={true} />
                </div>
                {subQ.images && subQ.images.length > 0 && (
                    <div className="mt-4 mb-4 space-y-4">
                        {subQ.images.map((img, i) => (
                            img ? <img key={i} src={img} alt="Hình ảnh minh họa" className="max-h-[300px] rounded-xl border border-border object-contain shadow-sm" /> : null
                        ))}
                    </div>
                )}

                {(!subQ.type || subQ.type === "multiple_choice") && (
                    <div className="space-y-3 sm:space-y-4">
                        {shuffleMapSub.map((originalIdx, renderIdx) => {
                            const opt = subQ.options[originalIdx];
                            const isSelected = subAns === originalIdx;
                            const alphabet = ["A", "B", "C", "D", "E", "F"];
                            return (
                                <button
                                    key={originalIdx}
                                    onClick={() => handleGroupAnswer(currentQuestion.id, subQ.id, "multiple_choice", originalIdx)}
                                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left group ${isSelected
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700"
                                        }`}
                                >
                                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${isSelected
                                            ? "bg-blue-500 text-white shadow-sm"
                                            : "bg-muted text-muted-foreground group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300"
                                        }`}>
                                        {alphabet[renderIdx]}
                                    </div>
                                    <div className={`mt-1 font-medium ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                        <LatexRenderer content={opt} inline={false} />
                                        {subQ.options_images && subQ.options_images[originalIdx] && (
                                            <div className="mt-3">
                                                <img src={subQ.options_images[originalIdx]} alt="Minh họa đáp án" className="max-h-32 rounded-lg border border-border object-contain" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {subQ.type === "true_false" && (
                    <div className="space-y-3 sm:space-y-4">
                        <p className="text-sm font-bold text-muted-foreground mb-4">Chọn Đúng hoặc Sai cho mỗi mệnh đề sau:</p>
                        {subQ.statements?.map((stmt, sIdx) => {
                            const studentChoice = subAns?.[sIdx];
                            return (
                                <div key={sIdx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border-2 border-border bg-card">
                                    <div className="flex-1">
                                        <span className="font-bold mr-2">{sIdx + 1}.</span>
                                        <LatexRenderer content={stmt.text} inline={true} />
                                        {stmt.image && (
                                            <div className="mt-3">
                                                <img src={stmt.image} alt="Minh họa" className="max-h-40 rounded-lg border border-border" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleGroupAnswer(currentQuestion.id, subQ.id, "true_false", true, sIdx)}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${studentChoice === true
                                                    ? "bg-emerald-500 border-emerald-600 text-white"
                                                    : "bg-background border-border text-muted-foreground hover:border-emerald-300"
                                                }`}
                                        >
                                            Đúng
                                        </button>
                                        <button
                                            onClick={() => handleGroupAnswer(currentQuestion.id, subQ.id, "true_false", false, sIdx)}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${studentChoice === false
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

                {subQ.type === "essay" && (
                    <div className="space-y-3 sm:space-y-4">
                        <p className="text-sm font-bold text-muted-foreground mb-2">Nhập câu trả lời của bạn:</p>
                        <textarea
                            className="w-full min-h-[100px] p-4 rounded-xl border-2 border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-y shadow-sm"
                            placeholder="Gõ câu trả lời tự luận vào đây..."
                            value={subAns || ""}
                            onChange={(e) => handleGroupAnswer(currentQuestion.id, subQ.id, "essay", e.target.value)}
                        />
                    </div>
                )}

                {subQ.type === "fill_blank" && (
                    <div className="mt-4 p-4 rounded-xl border-2 border-border bg-card">
                        <p className="text-sm font-bold text-muted-foreground mb-4">Điền vào các chỗ trống:</p>
                        {(() => {
                            const content = subQ.content || "";
                            const parts = content.split(/\[\[.*?\]\]/g);
                            const regex = /\[\[(.*?)\]\]/g;
                            const blanks = [];
                            let match;
                            while ((match = regex.exec(content)) !== null) blanks.push(match[1]);

                            return (
                                <div className="inline-block leading-loose w-full">
                                    {parts.map((part, pIdx) => (
                                        <span key={pIdx}>
                                            {part && <span className="inline"><LatexRenderer content={part} inline={true} /></span>}
                                            {pIdx < blanks.length && (
                                                <input
                                                    type="text"
                                                    value={subAns?.[pIdx] || ""}
                                                    onChange={(e) => handleGroupAnswer(currentQuestion.id, subQ.id, "fill_blank", e.target.value, pIdx)}
                                                    className="mx-2 inline-block min-w-[120px] max-w-full border-b-2 border-border focus:border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 px-2 py-1 text-center font-bold text-blue-700 dark:text-blue-300 outline-none transition-colors rounded-sm"
                                                    placeholder="..."
                                                />
                                            )}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Phần Luyện Tập cho Từng Câu Hỏi Con */}
                {isPracticeMode && (
                    <div className="mt-6 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                                💡 Chế độ Luyện Tập: Bạn có thể kiểm tra đáp án ngay!
                            </span>
                            <Button
                                onClick={() => handleCheckAnswer(currentQuestion.id, subQ.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shrink-0 h-9 px-4 text-xs"
                                disabled={subAns === undefined || practiceResults[`${currentQuestion.id}_${subQ.id}`]?.checked}
                            >
                                Kiểm tra đáp án
                            </Button>
                        </div>

                        {practiceResults[`${currentQuestion.id}_${subQ.id}`]?.checked && (
                            <div className="mt-4 pt-4 border-t-2 border-indigo-200/60 dark:border-indigo-900/60 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="font-black text-base mb-3">
                                    {practiceResults[`${currentQuestion.id}_${subQ.id}`].isCorrect ? (
                                        <span className="text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Trả lời chính xác!</span>
                                    ) : (
                                        <span className="text-red-600 flex items-center gap-2"><XCircle className="w-5 h-5" /> Chưa chính xác hoặc chưa đủ ý!</span>
                                    )}
                                </div>

                                {subQ.suggested_solution && (
                                    <div className="text-sm mt-3 bg-background p-3 rounded-lg border border-border shadow-sm">
                                        <p className="font-black text-foreground mb-1 flex items-center gap-2">
                                            <BookOpen className="w-3.5 h-3.5 text-primary" /> Lời giải chi tiết:
                                        </p>
                                        <LatexRenderer content={subQ.suggested_solution} inline={false} />
                                    </div>
                                )}
                                {!subQ.suggested_solution && (subQ.final_answer || subQ.correct_answer) && (
                                    <div className="text-sm mt-3 bg-background p-3 rounded-lg border border-border shadow-sm">
                                        <p className="font-black text-foreground mb-1">Đáp án đúng:</p>
                                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {(!subQ.type || subQ.type === 'multiple_choice') ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-0.5 rounded font-black text-xs">
                                                        {subQ.correct_answer}
                                                    </span>
                                                    <LatexRenderer
                                                        content={subQ.options[Math.max(0, ["A", "B", "C", "D", "E", "F"].indexOf(subQ.correct_answer))]}
                                                        inline={true}
                                                    />
                                                </div>
                                            ) : (
                                                <LatexRenderer content={subQ.final_answer || ""} inline={true} />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
