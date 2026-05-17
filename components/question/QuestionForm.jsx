"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ImagePlus, X } from "lucide-react";

import MultipleChoiceForm from "./MultipleChoiceForm";
import TrueFalseForm from "./TrueFalseForm";
import EssayForm from "./EssayForm";

export default function QuestionForm({ question, onChangeData }) {
    const [loading, setLoading] = useState(false);

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
    };

    const removeImage = (indexToRemove, targetField) => {
        const currentImages = question[targetField] || [];
        const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
        updateField(targetField, updatedImages);
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
                        if (data.error) {
                            alert(data.error);
                        } else {
                            onChangeData({
                                ...question,
                                content: data.content,
                                suggested_solution: data.suggested_solution || question.suggested_solution
                            });
                        }
                    } catch (err) {
                        console.error("Lỗi gọi API dán ảnh:", err);
                        alert("Không thể kết nối đến máy chủ xử lý AI.");
                    } finally {
                        setLoading(false);
                    }
                };
            }
        }
    };

    return (
        <Card className="w-full rounded-t-none border-t-0 shadow-sm">
            <CardContent className="p-4 sm:p-6 space-y-5">

                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[180px]">
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Dạng câu hỏi</label>
                        <Select value={question.type} onValueChange={(val) => updateField("type", val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
                                <SelectItem value="true_false">Đúng / Sai</SelectItem>
                                <SelectItem value="essay">Tự luận</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-24">
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Điểm số</label>
                        <Input
                            type="number"
                            step="0.25"
                            placeholder="1.0"
                            value={question.points || ""}
                            onChange={(e) => updateField("points", e.target.value)}
                            className="h-10 text-center font-bold text-blue-600 dark:text-blue-400"
                        />
                    </div>

                </div>

                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <label className="text-sm font-semibold text-foreground">Nội dung câu hỏi:</label>
                        {loading ? (
                            <span className="text-xs text-blue-500 dark:text-blue-400 font-medium flex items-center animate-pulse">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> AI đang xử lý ảnh
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">Dán ảnh vào ô dưới để dán đề nhanh bằng AI</span>
                        )}
                    </div>
                    <Textarea
                        placeholder="Nhập nội dung đề bài câu hỏi tại đây..."
                        value={question.content}
                        onChange={(e) => updateField("content", e.target.value)}
                        onPaste={handlePaste}
                        rows={3}
                        disabled={loading}
                        className={`font-medium transition-all ${loading ? "bg-muted opacity-70" : "bg-background border-input"}`}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground block">
                        Hình ảnh minh họa đề bài:
                    </label>
                    <div className="flex flex-wrap gap-3 items-center">
                        <label className="h-20 w-20 flex flex-col items-center justify-center border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors bg-background">
                            <ImagePlus className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground mt-1 font-medium">Thêm ảnh</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "images")} />
                        </label>
                        {(question.images || []).map((img, idx) => (
                            <div key={idx} className="relative h-20 w-20 border border-border rounded-lg overflow-hidden bg-muted group shadow-sm">
                                <img src={img} alt="Đề bài minh họa" className="h-full w-full object-cover" />
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
                </div>

                <div className="border-t pt-4 mt-2 space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                    <div className="w-full">
                        <label className="text-sm font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                            Kết quả / Đáp số đúng cuối cùng:
                        </label>
                        <Input
                            placeholder="Nhập đáp số hoặc kết quả ngắn chuẩn xác (Ví dụ: x = 2; C; Đúng;...)"
                            value={question.final_answer || ""}
                            onChange={(e) => updateField("final_answer", e.target.value)}
                            className="bg-background border-emerald-200 dark:border-emerald-800 font-semibold text-emerald-900 dark:text-emerald-200 placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                            Hình ảnh sơ đồ minh họa kèm theo cho đáp án (nếu có):
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
                </div>
            </CardContent>
        </Card>
    );
}
