"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CheckCircle2, XCircle, ImagePlus, X } from "lucide-react";

export default function TrueFalseForm({ questionData, setQuestionData }) {

    const handleStatementChange = (index, field, value) => {
        const newStatements = [...questionData.statements];
        newStatements[index][field] = value;
        setQuestionData({ ...questionData, statements: newStatements });
    };

    const handleStatementImageChange = (index, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const newStatements = [...questionData.statements];
            newStatements[index] = { ...newStatements[index], image: reader.result };
            setQuestionData({ ...questionData, statements: newStatements });
        };
    };

    const removeStatementImage = (index) => {
        const newStatements = [...questionData.statements];
        newStatements[index] = { ...newStatements[index], image: "" };
        setQuestionData({ ...questionData, statements: newStatements });
    };

    const addStatement = () => {
        setQuestionData({
            ...questionData,
            statements: [...questionData.statements, { text: "", correct: true, image: "" }]
        });
    };

    const removeStatement = (index) => {
        const newStatements = questionData.statements.filter((_, i) => i !== index);
        setQuestionData({ ...questionData, statements: newStatements });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">
                    Danh sách mệnh đề{" "}
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addStatement}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Thêm mệnh đề
                </Button>
            </div>

            <div className="space-y-2">
                {questionData.statements.map((stmt, idx) => {
                    const hasImage = !!stmt.image;
                    return (
                        <div
                            key={idx}
                            className={`rounded-lg border transition-all duration-150 ${stmt.correct
                                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20"
                                : "border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/15"
                                }`}
                        >
                            <div className="flex items-center gap-2 px-3 py-2.5">
                                <span className="font-bold text-sm text-muted-foreground w-5 shrink-0 text-right">
                                    {idx + 1}.
                                </span>

                                <Input
                                    placeholder={`Mệnh đề ${idx + 1}...`}
                                    value={stmt.text}
                                    onChange={(e) => handleStatementChange(idx, "text", e.target.value)}
                                    className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 px-2 h-9 font-medium placeholder:text-muted-foreground/60"
                                />

                                {!hasImage && (
                                    <label
                                        title={`Thêm ảnh cho mệnh đề ${idx + 1}`}
                                        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-ring cursor-pointer transition-colors"
                                    >
                                        <ImagePlus className="w-3.5 h-3.5" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleStatementImageChange(idx, e.target.files?.[0])}
                                        />
                                    </label>
                                )}

                                <button
                                    type="button"
                                    title={stmt.correct ? "ĐÚNG — bấm để đổi sang SAI" : "SAI — bấm để đổi sang ĐÚNG"}
                                    onClick={() => handleStatementChange(idx, "correct", !stmt.correct)}
                                    className={`shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border-2 transition-all duration-200 ${stmt.correct
                                        ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                                        : "border-red-400 bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                                        }`}
                                >
                                    {stmt.correct
                                        ? <CheckCircle2 className="w-5 h-5" />
                                        : <XCircle className="w-5 h-5" />
                                    }
                                </button>

                                {questionData.statements.length > 1 && (
                                    <button
                                        type="button"
                                        title="Xóa mệnh đề này"
                                        onClick={() => removeStatement(idx)}
                                        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {hasImage && (
                                <div className="px-3 pb-2 flex items-start gap-2">
                                    <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-border bg-muted shrink-0 shadow-sm">
                                        <img
                                            src={stmt.image}
                                            alt={`Mệnh đề ${idx + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeStatementImage(idx)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <label className="h-8 px-2 flex items-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-ring cursor-pointer transition-colors">
                                        <ImagePlus className="w-3 h-3" />
                                        Thay ảnh
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleStatementImageChange(idx, e.target.files?.[0])}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
