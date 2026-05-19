import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Copy, Plus } from "lucide-react";
import QuestionForm from "@/components/question/QuestionForm";
import QuestionTypePicker from "@/components/question/QuestionTypePicker";
import { TYPE_CONFIG } from "@/hooks/useCreateExam";

export function QuestionListCard({
    questionsList, updateQuestionData, duplicateQuestion, toggleCollapse, removeQuestion,
    showPicker, setShowPicker, addQuestion
}) {
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
                        <QuestionForm
                            question={question}
                            onChangeData={(updatedData) => updateQuestionData(question.id, updatedData)}
                        />
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
