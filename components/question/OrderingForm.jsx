/**
 * @file OrderingForm.jsx
 * @description Biểu mẫu nhập liệu dành riêng cho Câu hỏi dạng "Sắp xếp thứ tự".
 * Hỗ trợ giáo viên nhập các dòng văn bản theo đúng thứ tự (Hệ thống sẽ tự trộn khi hiển thị cho học sinh).
 */

"use client";

import RichInput from "./RichInput";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import LatexRenderer from "@/components/shared/LatexRenderer";

export default function OrderingForm({ questionData, setQuestionData }) {

    const handleItemChange = (index, field, value) => {
        const newItems = [...questionData.items];
        newItems[index][field] = value;
        setQuestionData({ ...questionData, items: newItems });
    };

    const addItem = () => {
        setQuestionData({
            ...questionData,
            items: [...questionData.items, { id: Date.now().toString(), text: "", correctIndex: questionData.items.length }]
        });
    };

    const removeItem = (index) => {
        // Remove item and re-calculate correctIndex
        const newItems = questionData.items.filter((_, i) => i !== index).map((item, i) => ({
            ...item,
            correctIndex: i
        }));
        setQuestionData({ ...questionData, items: newItems });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">
                    Danh sách các mục cần sắp xếp (Vui lòng nhập theo thứ tự ĐÚNG)
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Thêm mục
                </Button>
            </div>

            <div className="space-y-2.5">
                {questionData.items.map((item, idx) => (
                    <div
                        key={item.id}
                        className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/10 dark:bg-rose-950/10 transition-all duration-150 overflow-hidden"
                    >
                        <div className="flex items-center gap-2.5 px-3 py-3">
                            <GripVertical className="w-4 h-4 text-rose-300 dark:text-rose-700 shrink-0 cursor-ns-resize" />
                            
                            <span className="font-bold text-sm text-rose-600 dark:text-rose-400 w-5 shrink-0 text-center sm:text-right">
                                {idx + 1}.
                            </span>

                            <div className="flex-1 space-y-2">
                                <RichInput
                                    id={`order-item-${questionData.id}-${idx}`}
                                    placeholder={`Mục thứ ${idx + 1}...`}
                                    value={item.text}
                                    onChange={(val) => handleItemChange(idx, "text", val)}
                                    className="bg-background border-rose-200 focus-visible:ring-rose-500"
                                />
                                
                                {item.text?.includes("$") && (
                                    <div className="px-3 py-2 bg-background border border-dashed border-rose-200/60 rounded text-xs text-muted-foreground flex items-center gap-2 select-none">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/50 shrink-0">
                                            LaTeX
                                        </span>
                                        <div className="flex-1 overflow-x-auto font-medium text-foreground">
                                            <LatexRenderer text={item.text} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {questionData.items.length > 2 && (
                                <button
                                    type="button"
                                    title="Xóa mục này"
                                    onClick={() => removeItem(idx)}
                                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors bg-background"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            <p className="text-xs text-muted-foreground italic">
                * Lưu ý: Khi hiển thị cho học sinh, hệ thống sẽ tự động xáo trộn ngẫu nhiên các mục này.
            </p>
        </div>
    );
}
