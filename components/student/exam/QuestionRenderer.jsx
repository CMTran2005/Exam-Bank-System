import { Volume2, VolumeX, Flag, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultipleChoiceRenderer } from "./renderers/MultipleChoiceRenderer";
import { TrueFalseRenderer } from "./renderers/TrueFalseRenderer";
import { EssayRenderer } from "./renderers/EssayRenderer";
import { GroupRenderer } from "./renderers/GroupRenderer";
import { QuestionContentRenderer } from "./renderers/QuestionContentRenderer";
import { PracticeModeRenderer } from "./renderers/PracticeModeRenderer";

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
            <QuestionContentRenderer
                currentQuestion={currentQuestion}
                answers={answers}
                handleFillBlankAnswer={handleFillBlankAnswer}
            />

            {/* Options */}
            <MultipleChoiceRenderer
                currentQuestion={currentQuestion}
                answers={answers}
                shuffleMap={shuffleMap}
                handleSelectAnswer={handleSelectAnswer}
            />

            <TrueFalseRenderer
                currentQuestion={currentQuestion}
                answers={answers}
                handleSelectTrueFalse={handleSelectTrueFalse}
            />

            <EssayRenderer
                currentQuestion={currentQuestion}
                answers={answers}
                handleTextAnswer={handleTextAnswer}
            />

            <GroupRenderer
                currentQuestion={currentQuestion}
                currentSubQuestionIdx={currentSubQuestionIdx}
                answers={answers}
                shuffleMap={shuffleMap}
                isPracticeMode={isPracticeMode}
                practiceResults={practiceResults}
                handleGroupAnswer={handleGroupAnswer}
                handleCheckAnswer={handleCheckAnswer}
            />

            <PracticeModeRenderer
                currentQuestion={currentQuestion}
                isPracticeMode={isPracticeMode}
                isAnswered={isAnswered}
                practiceResults={practiceResults}
                handleCheckAnswer={handleCheckAnswer}
            />

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
