import dynamic from "next/dynamic";

const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});

export function QuestionContentRenderer({ currentQuestion, answers, handleFillBlankAnswer }) {
    if (!currentQuestion) return null;

    return (
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
    );
}
