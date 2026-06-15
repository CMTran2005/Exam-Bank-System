/**
 * @file GroupQuestionForm.jsx
 * @description Biểu mẫu con chuyên biệt dành cho câu hỏi dạng nhóm (Trắc nghiệm nhóm, Đúng/Sai nhóm, Tự luận nhóm).
 * Quản lý danh sách các câu hỏi con, thêm mới/xóa câu con, và tính toán tổng số điểm tự động.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronUp, ImagePlus, X, Loader2, Wand2 } from "lucide-react";

import MultipleChoiceForm from "./MultipleChoiceForm";
import TrueFalseForm from "./TrueFalseForm";
import EssayForm from "./EssayForm";
import FillBlankForm from "./FillBlankForm";
import MatchingForm from "./MatchingForm";
import OrderingForm from "./OrderingForm";
import LatexRenderer from "@/components/shared/LatexRenderer";
import RichTextarea from "./RichTextarea";
import RichInput from "./RichInput";
import { DIFFICULTY_CONFIG } from "./QuestionForm";

const BASE_TYPE_LABELS = {
    multiple_choice: "Trắc nghiệm",
    true_false: "Đúng / Sai",
    essay: "Tự luận",
    fill_blank: "Điền khuyết",
    matching: "Nối từ",
    ordering: "Sắp xếp",
};

export const createDefaultSubQuestion = (baseType) => {
    const defaultSub = {
    id: Date.now() + Math.random(),
    type: baseType,
    content: "",
    options: ["", "", "", ""],
    options_images: ["", "", "", ""],
    correct_answer: "A",
    statements: [{ text: "", correct: true }],
    suggested_solution: "",
    points: "1.0",
    difficulty: "nhan_biet",
    images: [],
    final_answer: "",
    answer_images: [],
    isCollapsed: false,
    };

    if (baseType === "matching") {
        defaultSub.pairs = [
            { id: Date.now().toString(), left: "", right: "" },
            { id: (Date.now() + 1).toString(), left: "", right: "" }
        ];
    } else if (baseType === "ordering") {
        defaultSub.items = [
            { id: Date.now().toString(), text: "", correctIndex: 0 },
            { id: (Date.now() + 1).toString(), text: "", correctIndex: 1 }
        ];
    }

    return defaultSub;
};

/**
 * Component render từng câu hỏi con (Subquestion Item) nằm trong nhóm.
 * Quản lý các trường thông tin cụ thể của câu con: Phân loại, Điểm số, Đề bài con, Phương án lựa chọn và các ảnh đính kèm tương ứng.
 */
function SubQuestionItem({ subQ, subIndex, totalSubs, onChangeData, onRemove, createPasteHandler, handleGenerateSolution, aiGeneratingSolution }) {
    const toggleCollapse = () => onChangeData({ ...subQ, isCollapsed: !subQ.isCollapsed });
    const updateField = (field, value) => onChangeData({ ...subQ, [field]: value });

    const handleImageChange = (e, targetField) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const cur = subQ[targetField] || [];
                updateField(targetField, [...cur, reader.result]);
            };
        });
    };

    const removeImage = (idx, targetField) => {
        const cur = subQ[targetField] || [];
        updateField(targetField, cur.filter((_, i) => i !== idx));
    };

    const handleSubPaste = (targetField) => {
        if (!createPasteHandler) return undefined;
        return createPasteHandler(targetField, (textToInsert, imageToInsert) => {
            if (textToInsert) {
                const currentText = subQ[targetField] || "";
                updateField(targetField, currentText ? `${currentText}\n${textToInsert}` : textToInsert);
            }
            if (imageToInsert) {
                // If OCR fails or returns no text, fallback to inserting image into images array
                const targetImageArray = targetField === "suggested_solution" || targetField === "final_answer" ? "answer_images" : "images";
                const currentImages = subQ[targetImageArray] || [];
                updateField(targetImageArray, [...currentImages, imageToInsert]);
            }
        });
    };

    return (
        <div className="border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="flex justify-between items-center bg-muted/60 px-3 py-1.5 border-b border-border">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Input
                        value={subQ.number_label !== undefined ? subQ.number_label : `Câu con ${subIndex + 1}`}
                        onChange={(e) => updateField("number_label", e.target.value)}
                        className="w-36 h-7 text-xs font-bold text-muted-foreground bg-transparent border-dashed border-muted-foreground/30 focus-visible:ring-1 text-left px-1.5 shadow-none focus-visible:border-primary shrink-0"
                        placeholder="Số câu con..."
                    />
                    {subQ.isCollapsed && subQ.content && (
                        <span className="text-xs text-muted-foreground italic truncate hidden sm:block">
                            — {subQ.content}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                    <button
                        type="button"
                        onClick={toggleCollapse}
                        className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        {subQ.isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    {totalSubs > 1 && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="h-7 w-7 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Xóa câu con này"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {!subQ.isCollapsed && (
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center w-full gap-4">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-muted-foreground shrink-0">Phân loại:</label>
                            <Select
                                value={subQ.difficulty || "nhan_biet"}
                                onValueChange={(val) => updateField("difficulty", val)}
                            >
                                <SelectTrigger className={`h-9 w-36 font-semibold border ${DIFFICULTY_CONFIG[subQ.difficulty || "nhan_biet"].border} ${DIFFICULTY_CONFIG[subQ.difficulty || "nhan_biet"].text} rounded-lg transition-all duration-200`}>
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
                                value={subQ.points || ""}
                                onChange={(e) => updateField("points", e.target.value)}
                                className="h-9 w-24 text-center font-bold text-blue-600 dark:text-blue-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Nội dung câu hỏi con:</label>
                        <RichTextarea
                            id={`subq-content-${subQ.id}`}
                            placeholder="Nhập nội dung câu hỏi con..."
                            value={subQ.content}
                            onChange={(val) => updateField("content", val)}
                            onPaste={handleSubPaste("content")}
                            rows={2}
                        />
                        {subQ.content && subQ.content.includes("$") && (
                            <div className="mt-2 p-3.5 rounded-xl border border-blue-150 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/15 space-y-1.5 animate-in fade-in duration-200">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block select-none">
                                    Xem trước công thức con (Word Equation View):
                                </span>
                                <div className="text-sm font-medium text-foreground">
                                    <LatexRenderer text={subQ.content} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground block">Hình ảnh minh họa:</label>
                        <div className="flex flex-wrap gap-2 items-center">
                            <label className="h-16 w-16 flex flex-col items-center justify-center border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors bg-background">
                                <ImagePlus className="w-4 h-4 text-muted-foreground" />
                                <span className="text-[9px] text-muted-foreground mt-1 font-medium">Thêm ảnh</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "images")} />
                            </label>
                            {(subQ.images || []).map((img, idx) => (
                                <div key={idx} className="relative h-16 w-16 border border-border rounded-lg overflow-hidden bg-muted group shadow-sm">
                                    <img src={img} alt="" className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx, "images")}
                                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-dashed border-border pt-4">
                        {subQ.type === "multiple_choice" && (
                            <MultipleChoiceForm questionData={subQ} setQuestionData={onChangeData} />
                        )}
                        {subQ.type === "true_false" && (
                            <TrueFalseForm questionData={subQ} setQuestionData={onChangeData} />
                        )}
                        {subQ.type === "essay" && (
                            <EssayForm questionData={subQ} setQuestionData={onChangeData} />
                        )}
                        {subQ.type === "fill_blank" && (
                            <FillBlankForm questionData={subQ} setQuestionData={onChangeData} />
                        )}
                        {subQ.type === "matching" && (
                            <MatchingForm questionData={subQ} setQuestionData={onChangeData} />
                        )}
                        {subQ.type === "ordering" && (
                            <OrderingForm questionData={subQ} setQuestionData={onChangeData} />
                        )}


                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50 space-y-4">
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-1">
                                <label className="text-sm font-bold text-emerald-800 dark:text-emerald-300 block">
                                    Lời giải chi tiết:
                                </label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900"
                                    onClick={() => handleGenerateSolution(subQ, (data) => {
                                        const updates = { suggested_solution: data.suggested_solution || "" };
                                        if (subQ.type === "multiple_choice" && data.correct_choice_index !== undefined && data.correct_choice_index !== null) {
                                            const letters = ["A", "B", "C", "D"];
                                            if (data.correct_choice_index >= 0 && data.correct_choice_index < 4) {
                                                updates.correct_answer = letters[data.correct_choice_index];
                                            }
                                        } else if (subQ.type === "essay" && data.final_answer) {
                                            updates.final_answer = data.final_answer;
                                        }
                                        onChangeData({ ...subQ, ...updates });
                                    })}
                                    disabled={aiGeneratingSolution}
                                >
                                    {aiGeneratingSolution ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                    {aiGeneratingSolution ? "Đang giải..." : "Tự động giải"}
                                </Button>
                            </div>
                            <RichTextarea
                                id={`subq-suggested-sol-${subQ.id}`}
                                placeholder="Nhập hướng dẫn giải, phân tích..."
                                value={subQ.suggested_solution || ""}
                                onChange={(val) => updateField("suggested_solution", val)}
                                onPaste={handleSubPaste("suggested_solution")}
                                rows={2}
                            />
                            {subQ.suggested_solution && subQ.suggested_solution.includes("$") && (
                                <div className="mt-2 p-2 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-background/50 text-xs text-muted-foreground flex items-center gap-1.5 select-none">
                                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/30">
                                        Xem trước LaTeX:
                                    </span>
                                    <LatexRenderer text={subQ.suggested_solution} />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                                Đáp án cuối cùng:
                            </label>
                            <RichInput
                                id={`subq-final-ans-${subQ.id}`}
                                placeholder="Nhập đáp số hoặc kết quả ngắn..."
                                value={subQ.final_answer || ""}
                                onChange={(val) => updateField("final_answer", val)}
                                className="bg-background border-emerald-200 dark:border-emerald-800 font-semibold text-emerald-900 dark:text-emerald-200"
                            />
                            {subQ.final_answer && subQ.final_answer.includes("$") && (
                                <div className="mt-2 p-2 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-background/50 text-xs text-muted-foreground flex items-center gap-1.5 select-none">
                                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/30">
                                        Xem trước LaTeX:
                                    </span>
                                    <LatexRenderer text={subQ.final_answer} />
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                                Hình ảnh sơ đồ minh họa kèm theo cho đáp án (nếu có):
                            </label>
                            <div className="flex flex-wrap gap-2 items-center">
                                <label className="h-14 w-14 flex flex-col items-center justify-center border border-dashed border-emerald-300 dark:border-emerald-700 rounded-lg cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors bg-background">
                                    <ImagePlus className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                    <span className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Thêm ảnh</span>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "answer_images")} />
                                </label>
                                {(subQ.answer_images || []).map((img, idx) => (
                                    <div key={idx} className="relative h-14 w-14 border border-emerald-200 dark:border-emerald-800 rounded-lg overflow-hidden bg-muted shadow-sm">
                                        <img src={img} alt="Đáp án minh họa" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx, "answer_images")}
                                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                                        >
                                            <X className="w-2 h-2" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Component GroupQuestionForm
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  groupQuestion - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function GroupQuestionForm({ groupQuestion, onChangeData, createPasteHandler, handleGenerateSolution, aiGeneratingSolution }) {
    const baseType = groupQuestion.type.replace("group_", "");
    const typeLabel = BASE_TYPE_LABELS[baseType] || baseType;
    const subQuestions = groupQuestion.subQuestions || [];

    const addSubQuestion = () => {
        onChangeData({
            ...groupQuestion,
            subQuestions: [...subQuestions, createDefaultSubQuestion(baseType)],
        });
    };

    const removeSubQuestion = (subId) => {
        onChangeData({
            ...groupQuestion,
            subQuestions: subQuestions.filter((sq) => sq.id !== subId),
        });
    };

    const updateSubQuestion = (subId, updatedSubQ) => {
        onChangeData({
            ...groupQuestion,
            subQuestions: subQuestions.map((sq) => sq.id === subId ? updatedSubQ : sq),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">
                    Các câu hỏi con ({typeLabel}) — <span className="text-blue-600 dark:text-blue-400">{subQuestions.length} câu</span>
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addSubQuestion}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Thêm câu con
                </Button>
            </div>

            <div className="space-y-3 pl-3 border-l-2 border-dashed border-blue-200 dark:border-blue-800">
                {subQuestions.map((subQ, idx) => (
                    <SubQuestionItem
                        key={subQ.id}
                        subQ={subQ}
                        subIndex={idx}
                        totalSubs={subQuestions.length}
                        onChangeData={(updated) => updateSubQuestion(subQ.id, updated)}
                        onRemove={() => removeSubQuestion(subQ.id)}
                        createPasteHandler={createPasteHandler}
                        handleGenerateSolution={handleGenerateSolution}
                        aiGeneratingSolution={aiGeneratingSolution}
                    />
                ))}
            </div>
        </div>
    );
}
