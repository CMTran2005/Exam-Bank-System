"use client";

import { Music, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Component QuestionAudio
 * Quản lý việc upload và cấu hình file âm thanh cho bài thi nghe (Listening)
 */
export default function QuestionAudio({ audios = [], maxPlaybacks = null, handleAudioChange, removeAudio, uploadingMedia = false, updateField }) {
    return (
        <div className="space-y-3 border-t border-dashed border-border pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                    Bài nghe (Listening Audio):
                </label>
                {audios.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground">Giới hạn số lần nghe:</span>
                        <Select 
                            value={maxPlaybacks === null ? "unlimited" : maxPlaybacks.toString()} 
                            onValueChange={(val) => updateField("maxPlaybacks", val === "unlimited" ? null : parseInt(val, 10))}
                        >
                            <SelectTrigger className="h-7 text-xs w-[120px]">
                                <SelectValue placeholder="Không giới hạn" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unlimited">Không giới hạn</SelectItem>
                                <SelectItem value="1">1 lần</SelectItem>
                                <SelectItem value="2">2 lần</SelectItem>
                                <SelectItem value="3">3 lần</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
                <label className={`h-20 w-20 flex flex-col items-center justify-center border border-dashed border-border rounded-lg transition-colors bg-background ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent'}`}>
                    <Music className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1 font-medium text-center px-1">
                        {uploadingMedia ? "Đang tải..." : "Thêm Audio"}
                    </span>
                    <input type="file" multiple accept="audio/mp3, audio/wav, audio/mpeg" className="hidden" disabled={uploadingMedia} onChange={handleAudioChange} />
                </label>

                {audios.map((url, idx) => (
                    <div key={idx} className="relative h-20 flex flex-col items-center justify-center min-w-[120px] px-3 border border-border rounded-lg bg-muted shadow-sm group">
                        <Music className="w-6 h-6 text-blue-500 mb-1" />
                        <span className="text-[10px] font-medium text-muted-foreground max-w-[100px] truncate">
                            Audio {idx + 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => removeAudio(idx)}
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
