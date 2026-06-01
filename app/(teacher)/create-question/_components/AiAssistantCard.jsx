import { Sparkles, ChevronDown, ChevronUp, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRef } from "react";

import { useExamUIStore } from "@/store/useExamUIStore";
import { useExamDataStore } from "@/store/useExamDataStore";
import { useAIBuilder } from "@/hooks/teacher/create-exam/useAIBuilder";

/**
 * Component AiAssistantCard
 * Xử lý logic và chức năng liên quan.
 *
 * @returns {JSX.Element}
 */
export function AiAssistantCard() {
    const { showAIAssistant, setShowAIAssistant, aiPromptText, setAiPromptText, aiGenType, setAiGenType } = useExamUIStore();
    const { setQuestionsList } = useExamDataStore();
    
    const { aiGenerating, handleAIGenerateQuestion, handleAIImageParse } = useAIBuilder({ 
        setQuestionsList, 
        setShowAIAssistant 
    });
    const fileInputRef = useRef(null);

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleAIImageParse(file);
        }
        e.target.value = ''; // Reset
    };
    return (
        <Card className="border-violet-200 bg-violet-50/10 dark:border-violet-900/40 dark:bg-violet-950/10 shadow-sm overflow-hidden transition-all duration-300">
            <div 
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-violet-50/30 dark:hover:bg-violet-950/25 transition-colors select-none"
            >
                <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 fill-violet-600/10 animate-pulse" />
                    <div>
                        <h3 className="text-sm font-bold text-violet-800 dark:text-violet-300">Trợ lý Soạn Câu Hỏi (Generative Assistant)</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Tự động soạn câu hỏi toán lý hóa chuẩn cấu trúc kiến thức</p>
                    </div>
                </div>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900/50 shrink-0"
                >
                    {showAIAssistant ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
            </div>

            {showAIAssistant && (
                <CardContent className="p-4 sm:p-5 border-t border-violet-100 dark:border-violet-900/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-violet-700 dark:text-violet-400 block mb-1.5">
                                Mô tả yêu cầu / Chủ đề kiến thức:
                            </label>
                            <Input
                                value={aiPromptText}
                                onChange={(e) => setAiPromptText(e.target.value)}
                                placeholder="Ví dụ: Tạo 1 câu trắc nghiệm Toán 12 về thể tích khối chóp tam giác đều cạnh đáy bằng a..."
                                className="border-violet-200/80 dark:border-violet-800 focus-visible:ring-violet-500"
                                disabled={aiGenerating}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-violet-700 dark:text-violet-400 block mb-1.5">
                                Loại câu hỏi cần tạo:
                            </label>
                            <Select 
                                value={aiGenType} 
                                onValueChange={setAiGenType}
                                disabled={aiGenerating}
                            >
                                <SelectTrigger className="border-violet-200/80 dark:border-violet-800 focus:ring-violet-500">
                                    <SelectValue placeholder="Chọn loại câu hỏi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="multiple_choice">Trắc nghiệm Đơn</SelectItem>
                                    <SelectItem value="true_false">Đúng / Sai Đơn</SelectItem>
                                    <SelectItem value="essay">Tự luận Đơn</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-1 mt-2 border-t border-violet-100 dark:border-violet-900/30">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={onFileChange} 
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={aiGenerating}
                                className="w-full sm:w-auto border-violet-200 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/50"
                            >
                                <ImagePlus className="w-4 h-4 mr-2" /> 
                                {aiGenerating ? "Đang xử lý ảnh..." : "Bóc tách từ Ảnh"}
                            </Button>
                        </div>
                        
                        <Button
                            onClick={handleAIGenerateQuestion}
                            disabled={aiGenerating}
                            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold px-6 shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] gap-1.5"
                        >
                            {aiGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Đang soạn đề...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 fill-white/10" /> Soạn Câu Hỏi (Text)
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
