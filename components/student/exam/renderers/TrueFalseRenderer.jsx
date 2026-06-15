import dynamic from "next/dynamic";

const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});

export function TrueFalseRenderer({
    currentQuestion,
    answers,
    handleSelectTrueFalse
}) {
    if (currentQuestion?.type !== "true_false") return null;

    return (
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
    );
}
