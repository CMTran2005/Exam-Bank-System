"use client";

import { ImagePlus, X } from "lucide-react";

export default function QuestionMedia({ label, images = [], targetField, handleImageChange, removeImage }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground block">
                {label}
            </label>
            <div className="flex flex-wrap gap-3 items-center">
                <label className="h-20 w-20 flex flex-col items-center justify-center border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors bg-background">
                    <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1 font-medium">Thêm ảnh</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, targetField)} />
                </label>
                {images.map((img, idx) => (
                    <div key={idx} className="relative h-20 w-20 border border-border rounded-lg overflow-hidden bg-muted group shadow-sm">
                        <img src={img} alt="Minh họa" className="h-full w-full object-cover" />
                        <button
                            type="button"
                            onClick={() => removeImage(idx, targetField)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
