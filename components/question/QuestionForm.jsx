/**
 * @file QuestionForm.jsx
 * @description Biểu mẫu (Form) chính để thêm mới hoặc chỉnh sửa câu hỏi đơn lẻ hoặc câu hỏi dạng nhóm.
 * Hỗ trợ tích hợp OCR bằng AI để quét nội dung đề bài nhanh từ ảnh đính kèm.
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextarea from "./RichTextarea";
import RichInput from "./RichInput";
import { Loader2, ImagePlus, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import MultipleChoiceForm from "./MultipleChoiceForm";
import TrueFalseForm from "./TrueFalseForm";
import EssayForm from "./EssayForm";
import GroupQuestionForm from "./GroupQuestionForm";
import LatexRenderer from "@/components/shared/LatexRenderer";

const TYPE_CONFIG = {
    multiple_choice: { label: "Trắc nghiệm Đơn", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
    group_multiple_choice: { label: "Trắc nghiệm Nhóm", bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-300 dark:border-violet-700" },
    true_false: { label: "Đúng / Sai Đơn", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
    group_true_false: { label: "Đúng / Sai Nhóm", bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-300 dark:border-teal-700" },
    essay: { label: "Tự luận Đơn", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
    group_essay: { label: "Tự luận Nhóm", bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
};

export const DIFFICULTY_CONFIG = {
    nhan_biet: { label: "Nhận biết", border: "border-sky-200 dark:border-sky-900/50 hover:border-sky-400 focus:ring-sky-500", text: "text-sky-700 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20" },
    thong_hieu: { label: "Thông hiểu", border: "border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400 focus:ring-emerald-500", text: "text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20" },
    van_dung: { label: "Vận dụng", border: "border-amber-200 dark:border-amber-900/50 hover:border-amber-400 focus:ring-amber-500", text: "text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20" },
    van_dung_cao: { label: "Vận dụng cao", border: "border-rose-200 dark:border-rose-900/50 hover:border-rose-400 focus:ring-rose-500", text: "text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20" },
};

const isGroupType = (type) => type?.startsWith("group_");

export default function QuestionForm({ question, onChangeData }) {
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [aiTaggingLoading, setAiTaggingLoading] = useState(false);

    const handleAITagging = async () => {
        if (!question.content || !question.content.trim()) {
            alert("Vui lòng nhập nội dung đề bài trước khi yêu cầu gợi ý thẻ.");
            return;
        }

        setAiTaggingLoading(true);
        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate_tags",
                    content: question.content,
                    type: question.type
                })
            });

            const data = await response.json();
            if (data.error) {
                alert("Lỗi máy chủ: " + data.error);
                return;
            }

            const updatedQuestion = { ...question };
            if (data.tags && Array.isArray(data.tags)) {
                const currentTags = question.tags || [];
                const merged = Array.from(new Set([...currentTags, ...data.tags]));
                updatedQuestion.tags = merged;
            }
            if (data.difficulty) {
                updatedQuestion.difficulty = data.difficulty;
            }

            onChangeData(updatedQuestion);
        } catch (err) {
            console.error("Lỗi gợi ý thẻ:", err);
            alert("Lỗi kết nối máy chủ: " + err.message);
        } finally {
            setAiTaggingLoading(false);
        }
    };

    const handleAddManualTag = (e) => {
        if (e.key === "Enter" || e.type === "click") {
            e.preventDefault();
            const trimmed = tagInput.trim();
            if (trimmed) {
                const currentTags = question.tags || [];
                if (!currentTags.includes(trimmed)) {
                    onChangeData({ ...question, tags: [...currentTags, trimmed] });
                }
                setTagInput("");
            }
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        const currentTags = question.tags || [];
        onChangeData({ ...question, tags: currentTags.filter(t => t !== tagToRemove) });
    };



    const updateField = (field, value) => {
        onChangeData({ ...question, [field]: value });
    };

    const handleImageChange = (e, targetField) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        files.forEach((file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const currentImages = question[targetField] || [];
                updateField(targetField, [...currentImages, reader.result]);
            };
        });
        e.target.value = "";
    };

    const removeImage = (indexToRemove, targetField) => {
        const currentImages = question[targetField] || [];
        updateField(targetField, currentImages.filter((_, idx) => idx !== indexToRemove));
    };

    const handlePaste = async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault();
                setLoading(true);
                const file = items[i].getAsFile();
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = async () => {
                    const base64Image = reader.result;
                    try {
                        const response = await fetch("/api/ocr", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ image: base64Image }),
                        });
                        const data = await response.json();
                        if (data.error || !data.content || !data.content.trim()) {
                            const currentImages = Array.isArray(question.images) ? question.images : [];
                            onChangeData({
                                ...question,
                                images: [...currentImages, base64Image]
                            });
                        } else {
                            onChangeData({
                                ...question,
                                content: question.content ? `${question.content}\n${data.content}` : data.content,
                                suggested_solution: data.suggested_solution
                                    ? (question.suggested_solution ? `${question.suggested_solution}\n${data.suggested_solution}` : data.suggested_solution)
                                    : question.suggested_solution
                            });
                        }
                    } catch (err) {
                        console.error("Lỗi gọi API dán ảnh, giữ nguyên ảnh gốc:", err);
                        const currentImages = Array.isArray(question.images) ? question.images : [];
                        onChangeData({
                            ...question,
                            images: [...currentImages, base64Image]
                        });
                    } finally {
                        setLoading(false);
                    }
                };
            }
        }
    };

    const typeConf = TYPE_CONFIG[question.type] || TYPE_CONFIG["multiple_choice"];
    const isGroup = isGroupType(question.type);

    return (
        <Card className="w-full rounded-t-none border-t-0 shadow-sm">
            <CardContent className="p-4 sm:p-6 space-y-5">

                <div className="flex justify-between items-center w-full gap-4">
                    {isGroup ? (
                        <>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-muted-foreground shrink-0">Phân loại chung:</label>
                                <Select
                                    value={question.difficulty || "nhan_biet"}
                                    onValueChange={(val) => updateField("difficulty", val)}
                                >
                                    <SelectTrigger className={`h-9 w-36 font-semibold border ${DIFFICULTY_CONFIG[question.difficulty || "nhan_biet"].border} ${DIFFICULTY_CONFIG[question.difficulty || "nhan_biet"].text} rounded-lg transition-all duration-200`}>
                                        <SelectValue placeholder="Phân loại" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nhan_biet">Nhận biết</SelectItem>
                                        <SelectItem value="thong_hieu">Thông hiểu</SelectItem>
                                        <SelectItem value="van_dung">Vận dụng</SelectItem>
                                        <SelectItem value="van_dung_cao">Vận dụng cao</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-muted-foreground shrink-0">Tổng điểm nhóm:</label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={(question.subQuestions || []).reduce((sum, sq) => sum + parseFloat(sq.points || 0), 0).toFixed(2).replace(/\.?0+$/, "")}
                                    className="h-9 w-24 text-center font-bold text-violet-600 dark:text-violet-400 bg-muted/50 cursor-not-allowed"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-muted-foreground shrink-0">Phân loại:</label>
                                <Select
                                    value={question.difficulty || "nhan_biet"}
                                    onValueChange={(val) => updateField("difficulty", val)}
                                >
                                    <SelectTrigger className={`h-9 w-36 font-semibold border ${DIFFICULTY_CONFIG[question.difficulty || "nhan_biet"].border} ${DIFFICULTY_CONFIG[question.difficulty || "nhan_biet"].text} rounded-lg transition-all duration-200`}>
                                        <SelectValue placeholder="Phân loại" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nhan_biet">Nhận biết</SelectItem>
                                        <SelectItem value="thong_hieu">Thông hiểu</SelectItem>
                                        <SelectItem value="van_dung">Vận dụng</SelectItem>
                                        <SelectItem value="van_dung_cao">Vận dụng cao</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-muted-foreground shrink-0">Điểm số:</label>
                                <Input
                                    type="number"
                                    step="0.25"
                                    placeholder="1.0"
                                    value={question.points || ""}
                                    onChange={(e) => updateField("points", e.target.value)}
                                    className="h-9 w-24 text-center font-bold text-blue-600 dark:text-blue-400"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Chủ đề & Thẻ gắn (Tags) */}
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

                    {/* Danh sách thẻ */}
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] p-2 rounded-xl border border-dashed border-border/80 bg-muted/10">
                        {(question.tags && question.tags.length > 0) ? (
                            question.tags.map((tag) => (
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

                    {/* Thêm thẻ thủ công */}
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

                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <label className="text-sm font-semibold text-foreground">
                            {isGroup ? "Nội dung / Đoạn văn chung của nhóm:" : "Nội dung câu hỏi:"}
                        </label>
                        {loading ? (
                            <span className="text-xs text-blue-500 dark:text-blue-400 font-medium flex items-center animate-pulse">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Đang quét ảnh...
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">Dán ảnh vào ô dưới để quét nhập đề nhanh</span>
                        )}
                    </div>
                    <RichTextarea
                        id={`q-content-${question.id}`}
                        placeholder={isGroup ? "Nhập nội dung / đoạn văn chung cho cả nhóm câu hỏi..." : "Nhập nội dung đề bài câu hỏi tại đây..."}
                        value={question.content}
                        onChange={(val) => updateField("content", val)}
                        onPaste={handlePaste}
                        rows={3}
                        disabled={loading}
                    />
                    {question.content && question.content.includes("$") && (
                        <div className="mt-2.5 p-3.5 rounded-xl border border-blue-150 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/15 space-y-1.5 animate-in fade-in duration-250">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block select-none">
                                Xem trước nội dung (Preview content):
                            </span>
                            <div className="text-sm font-medium text-foreground">
                                <LatexRenderer text={question.content} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground block">
                        {isGroup ? "Hình ảnh minh họa chung:" : "Hình ảnh minh họa đề bài:"}
                    </label>
                    <div className="flex flex-wrap gap-3 items-center">
                        <label className="h-20 w-20 flex flex-col items-center justify-center border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors bg-background">
                            <ImagePlus className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground mt-1 font-medium">Thêm ảnh</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "images")} />
                        </label>
                        {(question.images || []).map((img, idx) => (
                            <div key={idx} className="relative h-20 w-20 border border-border rounded-lg overflow-hidden bg-muted group shadow-sm">
                                <img src={img} alt="Minh họa" className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx, "images")}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-dashed border-border pt-4">
                    {question.type === "multiple_choice" && (
                        <MultipleChoiceForm questionData={question} setQuestionData={onChangeData} />
                    )}
                    {question.type === "true_false" && (
                        <TrueFalseForm questionData={question} setQuestionData={onChangeData} />
                    )}
                    {question.type === "essay" && (
                        <EssayForm questionData={question} setQuestionData={onChangeData} />
                    )}

                    {isGroup && (
                        <GroupQuestionForm groupQuestion={question} onChangeData={onChangeData} />
                    )}
                </div>

                <div className="border-t pt-4 mt-2 space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                    {/* Lời giải chi tiết */}
                    <div className="w-full space-y-2">
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm font-bold text-emerald-800 dark:text-emerald-300 block">
                                Lời giải chi tiết (Suggested Solution):
                            </label>
                        </div>
                        <RichTextarea
                            id={`q-suggested-sol-${question.id}`}
                            placeholder="Nhập hướng dẫn giải, phân tích và các bước lập luận chi tiết..."
                            value={question.suggested_solution || ""}
                            onChange={(val) => updateField("suggested_solution", val)}
                            rows={3}
                        />
                        {question.suggested_solution && question.suggested_solution.includes("$") && (
                            <div className="mt-2.5 p-3.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/15 space-y-1.5 animate-in fade-in duration-250">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block select-none">
                                    Xem trước nội dung (Preview content):
                                </span>
                                <div className="text-sm font-medium text-foreground">
                                    <LatexRenderer text={question.suggested_solution} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hình ảnh sơ đồ minh họa cho lời giải */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                            Hình ảnh sơ đồ minh họa kèm theo cho lời giải (nếu có):
                        </label>
                        <div className="flex flex-wrap gap-3 items-center">
                            <label className="h-16 w-16 flex flex-col items-center justify-center border border-dashed border-emerald-300 dark:border-emerald-700 rounded-lg cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors bg-background">
                                <ImagePlus className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Thêm ảnh</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "answer_images")} />
                            </label>
                            {(question.answer_images || []).map((img, idx) => (
                                <div key={idx} className="relative h-16 w-16 border border-emerald-200 dark:border-emerald-800 rounded-lg overflow-hidden bg-muted shadow-sm">
                                    <img src={img} alt="Đáp án minh họa" className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx, "answer_images")}
                                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Kết quả / Đáp số đúng cuối cùng */}
                    <div className="w-full pt-2 border-t border-emerald-200/40 dark:border-emerald-850/30">
                        <label className="text-sm font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                            Kết quả / Đáp số đúng cuối cùng:
                        </label>
                        <RichInput
                            id={`q-final-ans-${question.id}`}
                            placeholder="Nhập đáp số hoặc kết quả ngắn chuẩn xác (Ví dụ: x = 2; C; Đúng;...)"
                            value={question.final_answer || ""}
                            onChange={(val) => updateField("final_answer", val)}
                            className="bg-background border-emerald-200 dark:border-emerald-800 font-semibold text-emerald-900 dark:text-emerald-200 placeholder:text-muted-foreground"
                        />
                        {question.final_answer && question.final_answer.includes("$") && (
                            <div className="mt-2.5 p-3.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/15 space-y-1.5 animate-in fade-in duration-250">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block select-none">
                                    Xem trước công thức (Word Equation View):
                                </span>
                                <div className="text-sm font-medium text-foreground">
                                    <LatexRenderer text={question.final_answer} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
