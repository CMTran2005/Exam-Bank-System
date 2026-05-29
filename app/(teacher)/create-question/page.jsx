"use client";

import { Save, Loader2, Maximize, Minimize, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useCreateExam } from "@/hooks/useCreateExam";
import { ExamInfoCard } from "./_components/ExamInfoCard";
import { AiAssistantCard } from "./_components/AiAssistantCard";
import { QuestionListCard } from "./_components/QuestionListCard";

export default function CreateExamPage() {
    const {
        currentUser, loading,
        examInfo, setExamInfo, handleTitleChange, handleCodeChange, handleGradeChange,
        questionsList, addQuestion, removeQuestion, toggleCollapse, updateQuestionData, duplicateQuestion,
        showPicker, setShowPicker,
        zenMode, toggleZenMode, lastSaved,
        showAIAssistant, setShowAIAssistant, aiPromptText, setAiPromptText, aiGenType, setAiGenType, aiGenerating, handleAIGenerateQuestion, handleAIImageParse,
        handleSaveExam
    } = useCreateExam();

    if (loading || !currentUser) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 transition-all duration-300 ${zenMode ? 'max-w-full px-2 sm:px-4' : ''}`}>

            {/* Top Toolbar (Auto-save & Zen Mode) */}
            <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-sm animate-in slide-in-from-top-3">
                <div className="flex items-center gap-2">
                    {lastSaved ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/50">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã lưu nháp lúc {lastSaved.toLocaleTimeString('vi-VN')}
                        </span>
                    ) : (
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                            <Save className="w-3.5 h-3.5" /> Trạng thái: Chưa có thay đổi
                        </span>
                    )}
                </div>
                <Button 
                    variant={zenMode ? "default" : "outline"}
                    size="sm" 
                    onClick={toggleZenMode} 
                    className={`gap-2 text-xs font-bold rounded-xl h-9 ${zenMode ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"}`}
                >
                    {zenMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    {zenMode ? "Thoát Zen Mode" : "Zen Mode"}
                </Button>
            </div>

            <ExamInfoCard 
                examInfo={examInfo} setExamInfo={setExamInfo} 
                handleTitleChange={handleTitleChange} 
                handleCodeChange={handleCodeChange} 
                handleGradeChange={handleGradeChange} 
                questionsCount={questionsList.length}
            />

            <AiAssistantCard 
                showAIAssistant={showAIAssistant} setShowAIAssistant={setShowAIAssistant}
                aiPromptText={aiPromptText} setAiPromptText={setAiPromptText}
                aiGenType={aiGenType} setAiGenType={setAiGenType}
                aiGenerating={aiGenerating} handleAIGenerateQuestion={handleAIGenerateQuestion}
                handleAIImageParse={handleAIImageParse}
            />

            <QuestionListCard 
                questionsList={questionsList} 
                updateQuestionData={updateQuestionData} 
                duplicateQuestion={duplicateQuestion} 
                toggleCollapse={toggleCollapse} 
                removeQuestion={removeQuestion}
                showPicker={showPicker} setShowPicker={setShowPicker} addQuestion={addQuestion}
            />

            <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                    Tổng cộng <span className="font-semibold text-foreground">{questionsList.length} câu hỏi</span> đã được soạn thảo
                </p>
                <Button
                    onClick={handleSaveExam}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 font-semibold px-10 shadow-md text-white gap-2"
                >
                    <Save className="w-4 h-4" />
                    Lưu đề thi
                </Button>
            </div>
        </div>
    );
}
