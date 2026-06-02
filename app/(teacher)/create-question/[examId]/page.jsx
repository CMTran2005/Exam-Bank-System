"use client";

import { Save, Loader2, Maximize, Minimize, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useCreateExam } from "@/hooks/teacher/useCreateExam";
import { ExamInfoCard } from "../_components/ExamInfoCard";
import { AiAssistantCard } from "../_components/AiAssistantCard";
import { QuestionListCard } from "../_components/QuestionListCard";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import OnlineUsers from "@/components/Collaboration/OnlineUsers"; // Force recompile
import { useExamUIStore } from "@/store/useExamUIStore";
import { useExamDataStore } from "@/store/useExamDataStore";

/**
 * Component CreateExamSessionPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function CreateExamSessionPage() {
    const params = useParams();
    const examId = params?.examId;

    const {
        currentUser, loading,
        handleExamInfoChange,
        addQuestion, removeQuestion, toggleCollapse, updateQuestionData, duplicateQuestion,
        handleSaveExam
    } = useCreateExam(examId);

    const { zenMode, toggleZenMode } = useExamUIStore();
    const { lastSaved, activeUsers, examInfo, questionsList } = useExamDataStore();

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-sm animate-in slide-in-from-top-3 gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto justify-start">
                    {lastSaved ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/50 shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã lưu nháp lúc {lastSaved.toLocaleTimeString('vi-VN')}
                        </span>
                    ) : (
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50 shrink-0">
                            <Save className="w-3.5 h-3.5" /> Trạng thái: Chưa có thay đổi
                        </span>
                    )}
                </div>
                
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-4 border-t border-border/40 pt-2.5 sm:border-none sm:pt-0">
                    {/* Component hiển thị những người đang cùng soạn đề */}
                    <div className="flex items-center gap-2">
                        <OnlineUsers users={activeUsers} />
                    </div>
                    
                    <div className="h-6 w-px bg-border hidden sm:block"></div>
                    
                    <div className="flex gap-2">
                        <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success("Đã copy link mời đồng nghiệp!");
                            }}
                            className="gap-1.5 text-xs font-bold rounded-xl h-9 hover:bg-primary/10 hover:text-primary transition-colors border-primary/20 whitespace-nowrap"
                        >
                            Mời đồng nghiệp
                        </Button>
                        <Button 
                            variant={zenMode ? "default" : "outline"}
                            size="sm" 
                            onClick={toggleZenMode} 
                            className={`gap-1.5 text-xs font-bold rounded-xl h-9 whitespace-nowrap ${zenMode ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"}`}
                        >
                            {zenMode ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                            {zenMode ? "Thoát Zen Mode" : "Zen Mode"}
                        </Button>
                    </div>
                </div>
            </div>

            <ExamInfoCard handleExamInfoChange={handleExamInfoChange} />

            <AiAssistantCard />

            <QuestionListCard 
                updateQuestionData={updateQuestionData} 
                duplicateQuestion={duplicateQuestion} 
                toggleCollapse={toggleCollapse} 
                removeQuestion={removeQuestion}
                addQuestion={addQuestion}
                currentUser={currentUser}
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
