/**
 * @file QuestionForm.jsx
 * @description Biểu mẫu (Form) chính để thêm mới hoặc chỉnh sửa câu hỏi đơn lẻ hoặc câu hỏi dạng nhóm.
 * Hỗ trợ tích hợp OCR bằng AI để quét nội dung đề bài nhanh từ ảnh đính kèm.
 */

"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import RichTextarea from "./RichTextarea";
import RichInput from "./RichInput";
import { Loader2, Wand2 } from "lucide-react";

import MultipleChoiceForm from "./MultipleChoiceForm";
import TrueFalseForm from "./TrueFalseForm";
import EssayForm from "./EssayForm";
import FillBlankForm from "./FillBlankForm";
import GroupQuestionForm from "./GroupQuestionForm";
import LatexRenderer from "@/components/shared/LatexRenderer";
import QuestionTags from "./QuestionTags";
import QuestionMedia from "./QuestionMedia";
import { useQuestionForm } from "@/hooks/shared/useQuestionForm";

const TYPE_CONFIG = {
    multiple_choice: { label: "Trắc nghiệm Đơn", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
    group_multiple_choice: { label: "Trắc nghiệm Nhóm", bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-300 dark:border-violet-700" },
    true_false: { label: "Đúng / Sai Đơn", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
    group_true_false: { label: "Đúng / Sai Nhóm", bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-300 dark:border-teal-700" },
    fill_blank: { label: "Điền khuyết Đơn", bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-700 dark:text-pink-300", border: "border-pink-300 dark:border-pink-700" },
    group_fill_blank: { label: "Điền khuyết Nhóm", bg: "bg-fuchsia-100 dark:bg-fuchsia-900/40", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-300 dark:border-fuchsia-700" },
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

/**
 * Component QuestionForm
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  question - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function QuestionForm({ question, onChangeData }) {
    const {
        loading, tagInput, setTagInput, aiTaggingLoading, aiGeneratingSolution,
        updateField, handleAITagging, handleAddManualTag, handleRemoveTag,
        handleImageChange, removeImage, createPasteHandler, handleGenerateSolution
    } = useQuestionForm(question, onChangeData);

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

                <QuestionTags 
                    tags={question.tags} 
                    tagInput={tagInput} 
                    setTagInput={setTagInput} 
                    aiTaggingLoading={aiTaggingLoading}
                    handleAITagging={handleAITagging} 
                    handleAddManualTag={handleAddManualTag} 
                    handleRemoveTag={handleRemoveTag} 
                />

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
                        onPaste={createPasteHandler("content")}
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

                <QuestionMedia 
                    label={isGroup ? "Hình ảnh minh họa chung:" : "Hình ảnh minh họa đề bài:"}
                    images={question.images}
                    targetField="images"
                    handleImageChange={handleImageChange}
                    removeImage={removeImage}
                />

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
                    {question.type === "fill_blank" && (
                        <FillBlankForm questionData={question} setQuestionData={onChangeData} />
                    )}

                    {isGroup && (
                        <GroupQuestionForm 
                            groupQuestion={question} 
                            onChangeData={onChangeData} 
                            createPasteHandler={createPasteHandler}
                            handleGenerateSolution={handleGenerateSolution}
                            aiGeneratingSolution={aiGeneratingSolution}
                        />
                    )}
                </div>

                {!isGroup && (
                    <div className="border-t pt-4 mt-2 space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                        <div className="w-full space-y-2">
                            <div className="flex items-center justify-between gap-4">
                                <label className="text-sm font-bold text-emerald-800 dark:text-emerald-300 block">
                                    Lời giải chi tiết (Suggested Solution):
                                </label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900"
                                    onClick={() => handleGenerateSolution()}
                                    disabled={aiGeneratingSolution}
                                >
                                    {aiGeneratingSolution ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                    {aiGeneratingSolution ? "Đang giải..." : "Tự động giải"}
                                </Button>
                            </div>
                            <RichTextarea
                                id={`q-suggested-sol-${question.id}`}
                                placeholder="Nhập hướng dẫn giải, phân tích và các bước lập luận chi tiết..."
                                value={question.suggested_solution || ""}
                                onChange={(val) => updateField("suggested_solution", val)}
                                onPaste={createPasteHandler("suggested_solution")}
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

                        <QuestionMedia 
                            label="Hình ảnh sơ đồ minh họa kèm theo cho lời giải (nếu có):"
                            images={question.answer_images}
                            targetField="answer_images"
                            handleImageChange={handleImageChange}
                            removeImage={removeImage}
                        />

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
                )}
            </CardContent>
        </Card>
    );
}
