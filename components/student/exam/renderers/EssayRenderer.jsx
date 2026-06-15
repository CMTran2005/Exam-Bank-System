export function EssayRenderer({
    currentQuestion,
    answers,
    handleTextAnswer
}) {
    if (currentQuestion?.type !== "essay") return null;

    return (
        <div className="space-y-3 sm:space-y-4 mb-8">
            <p className="text-sm font-bold text-muted-foreground mb-2">Nhập câu trả lời của bạn:</p>
            <textarea
                className="w-full min-h-[150px] p-4 rounded-xl border-2 border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-y shadow-sm"
                placeholder="Gõ câu trả lời tự luận vào đây..."
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
            />
        </div>
    );
}
