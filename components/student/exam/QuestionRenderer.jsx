import { Volume2, VolumeX, Flag, CheckCircle2, XCircle, BookOpen, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});

export function QuestionRenderer({
    exam,
    currentQuestion,
    currentQuestionIdx,
    currentSubQuestionIdx,
    setCurrentQuestionIdx,
    setCurrentSubQuestionIdx,
    answers,
    reviewMarks,
    shuffleMap,
    isPracticeMode,
    practiceResults,
    isSpeaking,
    handleReadAloud,
    handleToggleReview,
    handleFillBlankAnswer,
    handleSelectAnswer,
    handleSelectTrueFalse,
    handleTextAnswer,
    handleGroupAnswer,
    handleCheckAnswer,
    setShowQuestionMap
}) {
    if (!currentQuestion) return null;

    const isAnswered = answers[currentQuestion.id] !== undefined;
    const isMarked = reviewMarks[currentQuestion.id];

    return (
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                    Câu {currentQuestionIdx + 1}
                    <span className="text-sm font-semibold text-muted-foreground ml-2">/ {exam.questions?.length}</span>
                </h2>
                <div className="flex gap-2">
                    {exam?.subject?.toLowerCase().includes("anh") && (
                        <Button
                            variant="outline"
                            size="sm"
                            className={`h-8 rounded-lg gap-2 font-bold text-xs border-2 transition-colors ${isSpeaking
                                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800"
                                    : "border-border text-muted-foreground hover:bg-muted"
                                }`}
                            onClick={() => handleReadAloud(currentQuestion)}
                            title="Đọc câu hỏi và đáp án"
                        >
                            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{isSpeaking ? "Dừng đọc" : "Đọc đề"}</span>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 rounded-lg gap-2 font-bold text-xs border-2 transition-colors ${isMarked
                                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                        onClick={() => handleToggleReview(currentQuestion.id)}
                    >
                        <Flag className={`w-3.5 h-3.5 ${isMarked ? "fill-amber-500" : ""}`} />
                        <span className="hidden sm:inline">{isMarked ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}</span>
                    </Button>
                </div>
            </div>

            {/* Question Content */}
            <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-8 mb-6 text-base sm:text-lg text-foreground font-medium leading-loose">
                {currentQuestion?.type === 'fill_blank' ? (
                    (() => {
                        const content = currentQuestion.content || "";
                        const parts = content.split(/\[\[.*?\]\]/g);
                        const regex = /\[\[(.*?)\]\]/g;
                        const blanks = [];
                        let match;
                        while ((match = regex.exec(content)) !== null) {
                            blanks.push(match[1]);
                        }

                        return (
                            <div className="inline-block leading-loose w-full">
                                {parts.map((part, idx) => (
                                    <span key={idx}>
                                        {part && <span className="inline"><LatexRenderer content={part} inline={true} /></span>}
                                        {idx < blanks.length && (
                                            <input
                                                type="text"
                                                value={answers[currentQuestion.id]?.[idx] || ""}
                                                onChange={(e) => handleFillBlankAnswer(currentQuestion.id, idx, e.target.value)}
                                                className="mx-2 inline-block min-w-[120px] max-w-full border-b-2 border-border focus:border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 px-2 py-1 text-center font-bold text-blue-700 dark:text-blue-300 outline-none transition-colors rounded-sm"
                                                placeholder="..."
                                            />
                                        )}
                                    </span>
                                ))}
                            </div>
                        );
                    })()
                ) : (
                    <LatexRenderer content={currentQuestion?.content || ""} inline={false} />
                )}

                {/* Render question images */}
                {currentQuestion?.images && currentQuestion.images.length > 0 && (
                    <div className="mt-6 space-y-4">
                        {currentQuestion.images.map((img, i) => (
                            img ? <img key={i} src={img} alt={`Hình ảnh minh họa ${i + 1}`} className="max-h-[400px] mx-auto rounded-xl border border-border object-contain shadow-sm" /> : null
                        ))}
                    </div>
                )}
            </div>

            {/* Options */}
            {(!currentQuestion?.type || currentQuestion.type === "multiple_choice") && !currentQuestion?.type?.startsWith('group_') && (
                <div className="space-y-3 sm:space-y-4 mb-8">
                    {(shuffleMap[currentQuestion.id] || currentQuestion?.options?.map((_, i) => i) || []).map((originalIdx, renderIdx) => {
                        const opt = currentQuestion.options[originalIdx];
                        const isSelected = answers[currentQuestion.id] === originalIdx;
                        const alphabet = ["A", "B", "C", "D", "E", "F"];
                        return (
                            <button
                                key={originalIdx}
                                onClick={() => handleSelectAnswer(currentQuestion.id, originalIdx)}
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
                                    {currentQuestion.options_images && currentQuestion.options_images[originalIdx] && (
                                        <div className="mt-3">
                                            <img src={currentQuestion.options_images[originalIdx]} alt={`Minh họa đáp án ${alphabet[renderIdx]}`} className="max-h-32 rounded-lg border border-border object-contain" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {currentQuestion?.type === "true_false" && (
                <div className="space-y-3 sm:space-y-4 mb-8">
                    <p className="text-sm font-bold text-muted-foreground mb-4">Chọn Đúng hoặc Sai cho mỗi mệnh đề sau:</p>
                    {currentQuestion.statements?.map((stmt, idx) => {
                        const studentChoice = answers[currentQuestion.id]?.[idx];
                        return (
                            <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border-2 border-border bg-card">
                                <div className="flex-1">
                                    <span className="font-bold mr-2">{idx + 1}.</span>
                                    <LatexRenderer content={stmt.text} inline={true} />
                                    {stmt.image && (
                                        <div className="mt-3">
                                            <img src={stmt.image} alt="Minh họa" className="max-h-40 rounded-lg border border-border" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleSelectTrueFalse(currentQuestion.id, idx, true)}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${studentChoice === true
                                                ? "bg-emerald-500 border-emerald-600 text-white"
                                                : "bg-background border-border text-muted-foreground hover:border-emerald-300"
                                            }`}
                                    >
                                        Đúng
                                    </button>
                                    <button
                                        onClick={() => handleSelectTrueFalse(currentQuestion.id, idx, false)}
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

            {currentQuestion?.type === "essay" && (
                <div className="space-y-3 sm:space-y-4 mb-8">
                    <p className="text-sm font-bold text-muted-foreground mb-2">Nhập câu trả lời của bạn:</p>
                    <textarea
                        className="w-full min-h-[150px] p-4 rounded-xl border-2 border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-y shadow-sm"
                        placeholder="Gõ câu trả lời tự luận vào đây..."
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                    />
                </div>
            )}

            {currentQuestion?.type?.startsWith("group_") && (
                <div className="space-y-8 mb-8">
                    {(() => {
                        const subQ = currentQuestion.subQuestions?.[currentSubQuestionIdx];
                        if (!subQ) return null;
                        const idx = currentSubQuestionIdx;
                        const subAns = answers[currentQuestion.id] ? answers[currentQuestion.id][subQ.id] : undefined;
                        const shuffleMapSub = shuffleMap[subQ.id] || subQ.options?.map((_, i) => i) || [];
                        
                        return (
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
                        );
                    })()}
                </div>
            )}
            {isPracticeMode && !currentQuestion.type?.startsWith('group_') && (
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
            )}

            {/* Navigation Buttons */}
            {(() => {
                const curQ = exam.questions[currentQuestionIdx];
                const isGroup = curQ?.type?.startsWith('group_');
                const subQsLength = isGroup ? (curQ.subQuestions?.length || 1) : 1;
                
                const isPrevDisabled = currentQuestionIdx === 0 && (!isGroup || currentSubQuestionIdx === 0);
                const isNextDisabled = currentQuestionIdx === (exam.questions?.length || 1) - 1 && (!isGroup || currentSubQuestionIdx === subQsLength - 1);
                
                const handlePrev = () => {
                    if (isGroup && currentSubQuestionIdx > 0) {
                        setCurrentSubQuestionIdx(prev => prev - 1);
                    } else if (currentQuestionIdx > 0) {
                        const prevIdx = currentQuestionIdx - 1;
                        setCurrentQuestionIdx(prevIdx);
                        const prevQ = exam.questions[prevIdx];
                        if (prevQ?.type?.startsWith('group_')) {
                            setCurrentSubQuestionIdx(Math.max(0, (prevQ.subQuestions?.length || 1) - 1));
                        } else {
                            setCurrentSubQuestionIdx(0);
                        }
                    }
                };
                
                const handleNext = () => {
                    if (isGroup && currentSubQuestionIdx < subQsLength - 1) {
                        setCurrentSubQuestionIdx(prev => prev + 1);
                    } else if (currentQuestionIdx < (exam.questions?.length || 1) - 1) {
                        setCurrentQuestionIdx(prev => prev + 1);
                        setCurrentSubQuestionIdx(0);
                    }
                };
                
                return (
                    <div className="mt-auto pt-4 border-t border-border/40 flex justify-between items-center max-w-3xl mx-auto w-full sticky bottom-0 bg-background pb-2 z-10 gap-2">
                        <Button
                            variant="outline"
                            className="h-10 sm:h-12 px-3 sm:px-6 rounded-xl font-bold border-2 text-xs sm:text-sm"
                            disabled={isPrevDisabled}
                            onClick={handlePrev}
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                            <span className="hidden sm:inline">Câu trước</span>
                            <span className="sm:hidden">Trước</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-10 sm:h-12 w-10 sm:w-12 md:hidden rounded-xl font-bold border-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            onClick={() => setShowQuestionMap(prev => !prev)}
                            title="Bản đồ câu hỏi"
                        >
                            <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>

                        <Button
                            className="h-10 sm:h-12 px-3 sm:px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md text-xs sm:text-sm"
                            disabled={isNextDisabled}
                            onClick={handleNext}
                        >
                            <span className="hidden sm:inline">Câu tiếp theo</span>
                            <span className="sm:hidden">Tiếp</span>
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-2" />
                        </Button>
                    </div>
                );
            })()}
        </div>
    );
}
