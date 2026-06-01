import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Copy, Plus } from "lucide-react";

const QuestionForm = dynamic(() => import("@/components/question/QuestionForm"), {
    ssr: false,
    loading: () => (
        <div className="p-12 border-x border-b border-border bg-card rounded-b-lg flex flex-col items-center justify-center space-y-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải bộ công cụ soạn thảo & AI...</p>
        </div>
    )
});
import QuestionTypePicker from "@/components/question/QuestionTypePicker";
import { TYPE_CONFIG } from "@/hooks/teacher/useCreateExam";
import { Lock } from "lucide-react";
import { useExamUIStore } from "@/store/useExamUIStore";
import { useExamDataStore } from "@/store/useExamDataStore";

/**
 * Component QuestionListCard
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any} 
    updateQuestionData - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function QuestionListCard({
    updateQuestionData, duplicateQuestion, toggleCollapse, removeQuestion,
    addQuestion, currentUser
}) {
    const { showPicker, setShowPicker } = useExamUIStore();
    const { questionsList, activeUsers } = useExamDataStore();
    return (
        <div className="space-y-4">
            {questionsList.map((question, index) => (
                <div key={question.id}>
                    <div className="flex justify-between items-center bg-muted px-4 py-2 rounded-t-lg border border-border shadow-sm">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Input
                                value={question.number_label !== undefined ? question.number_label : `CÂU ${index + 1}`}
                                onChange={(e) => updateQuestionData(question.id, { number_label: e.target.value })}
                                className="w-36 h-7 text-xs font-bold text-foreground bg-transparent border-dashed border-muted-foreground/30 focus-visible:ring-1 text-left px-1.5 shadow-none focus-visible:border-primary shrink-0"
                                placeholder="Ký hiệu / Số câu..."
                            />
                            {question.isCollapsed && question.content && (
                                <span className="text-xs text-muted-foreground truncate italic hidden sm:block">
                                    — {question.content}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-4">
                            {(() => {
                                const typeConf = TYPE_CONFIG[question.type] || TYPE_CONFIG["multiple_choice"];
                                return (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border shrink-0 ${typeConf.bg} ${typeConf.text} ${typeConf.border}`}>
                                        {typeConf.label}
                                    </span>
                                );
                            })()}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => duplicateQuestion(question)}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    title="Nhân bản câu hỏi này"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleCollapse(question.id)}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    title={question.isCollapsed ? "Mở rộng" : "Thu gọn"}
                                >
                                    {question.isCollapsed
                                        ? <ChevronDown className="w-4 h-4" />
                                        : <ChevronUp className="w-4 h-4" />
                                    }
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeQuestion(question.id)}
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    title="Xóa câu hỏi này"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {!question.isCollapsed && (
                        <div className="relative">
                            {question.lockedBy && question.lockedBy !== currentUser?.uid && (
                                <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1.5px] flex items-center justify-center rounded-b-lg border-x border-b border-border">
                                    <div className="bg-popover text-popover-foreground px-4 py-2 rounded-xl shadow-md border border-border flex items-center gap-2 animate-in zoom-in duration-200">
                                        <Lock className="w-4 h-4 text-amber-500" />
                                        <span className="text-sm font-semibold">
                                            {activeUsers.find(u => u.uid === question.lockedBy)?.name || "Người khác"} đang sửa...
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className={question.lockedBy && question.lockedBy !== currentUser?.uid ? "opacity-30 pointer-events-none" : ""}>
                                <QuestionForm
                                    question={question}
                                    onChangeData={(updatedData) => updateQuestionData(question.id, updatedData)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}

            <div className="space-y-3 pt-1">
                {showPicker ? (
                    <QuestionTypePicker
                        onSelect={addQuestion}
                        onCancel={() => setShowPicker(false)}
                    />
                ) : (
                    <div className="flex justify-center">
                        <Button
                            onClick={() => setShowPicker(true)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-medium text-xs border border-dashed border-blue-300 dark:border-blue-800 rounded-full px-6 py-2"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            Thêm câu hỏi
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
