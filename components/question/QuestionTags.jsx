"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, X } from "lucide-react";

export default function QuestionTags({ 
    tags = [], 
    tagInput, 
    setTagInput, 
    aiTaggingLoading, 
    handleAITagging, 
    handleAddManualTag, 
    handleRemoveTag 
}) {
    return (
        <div className="pt-3 border-t border-border/60 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider block">
                    Thẻ phân loại (Tags):
                </label>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={aiTaggingLoading}
                    onClick={handleAITagging}
                    className="h-7 text-[10px] sm:text-xs font-bold text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700/80 bg-violet-50/20 hover:bg-violet-50 dark:hover:bg-violet-950/40 gap-1.5 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] select-none"
                >
                    {aiTaggingLoading ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang phân tích...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3.5 h-3.5 text-violet-500 fill-violet-500/20" /> Tự động gắn thẻ & đánh giá độ khó
                        </>
                    )}
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] p-2 rounded-xl border border-dashed border-border/80 bg-muted/10">
                {(tags && tags.length > 0) ? (
                    tags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100/70 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/60 dark:border-violet-900/50 shadow-sm animate-in fade-in zoom-in duration-200"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-200 transition-colors p-0.5 rounded-full hover:bg-violet-200/50 dark:hover:bg-violet-900/50"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-muted-foreground italic px-1 select-none">
                        Chưa có thẻ nào. Click nút ở trên để tự động phân tích và gắn thẻ nhanh...
                    </span>
                )}
            </div>

            <div className="flex gap-2">
                <Input
                    type="text"
                    placeholder="Nhập tên thẻ mới và nhấn Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddManualTag}
                    className="h-8 text-xs border-violet-200/60 dark:border-violet-900/60 focus-visible:ring-violet-500"
                />
                <Button
                    type="button"
                    onClick={handleAddManualTag}
                    size="sm"
                    className="h-8 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-4 shrink-0"
                >
                    Thêm thẻ
                </Button>
            </div>
        </div>
    );
}
