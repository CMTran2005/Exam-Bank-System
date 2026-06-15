import dynamic from "next/dynamic";

const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});

export function MultipleChoiceRenderer({
    currentQuestion,
    answers,
    shuffleMap,
    handleSelectAnswer
}) {
    if (currentQuestion?.type && currentQuestion.type !== "multiple_choice") return null;
    if (currentQuestion?.type?.startsWith('group_')) return null;

    const mapList = shuffleMap[currentQuestion.id] || currentQuestion?.options?.map((_, i) => i) || [];
    const alphabet = ["A", "B", "C", "D", "E", "F"];

    return (
        <div className="space-y-3 sm:space-y-4 mb-8">
            {mapList.map((originalIdx, renderIdx) => {
                const opt = currentQuestion.options[originalIdx];
                const isSelected = answers[currentQuestion.id] === originalIdx;
                
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
    );
}
