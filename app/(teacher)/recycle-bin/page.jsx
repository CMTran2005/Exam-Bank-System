"use client";

import { Trash2, RotateCcw, AlertCircle, Loader2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecycleBin } from "@/hooks/teacher/useRecycleBin";

/**
 * Component RecycleBinPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function RecycleBinPage() {
    const {
        currentUser, loading, mounted,
        trashExams, handleRestore, handlePermanentDelete, handleEmptyTrash
    } = useRecycleBin();

    if (loading || !currentUser) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!mounted) {
        return (
            <div className="p-8 flex justify-center items-center h-96">
                <p className="text-sm text-muted-foreground animate-pulse">Đang tải thùng rác...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-red-50 dark:bg-red-950/20 p-5 rounded-2xl border border-red-200 dark:border-red-900/50">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0 mt-0.5">
                        <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-red-900 dark:text-red-300 tracking-tight">Thùng Rác</h1>
                        <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-1 max-w-xl leading-relaxed">
                            Các đề thi đã xóa sẽ được lưu giữ tại đây trong vòng <strong className="font-bold">30 ngày</strong> trước khi bị xóa vĩnh viễn khỏi hệ thống.
                        </p>
                    </div>
                </div>
                
                {trashExams.length > 0 && (
                    <div className="shrink-0">
                        <Button 
                            variant="destructive" 
                            className="font-bold shadow-md h-10 gap-2 rounded-xl"
                            onClick={handleEmptyTrash}
                        >
                            <AlertCircle className="w-4 h-4" />
                            Dọn sạch thùng rác
                        </Button>
                    </div>
                )}
            </div>

            {trashExams.length > 0 ? (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="hidden lg:flex items-center gap-4 px-6 py-4 border-b border-border/85 bg-slate-50/50 dark:bg-slate-900/35 text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                        <div className="w-32 shrink-0">Mã Đề</div>
                        <div className="flex-1 min-w-[200px]">Tên Đề Thi</div>
                        <div className="w-32 shrink-0">Ngày Xóa</div>
                        <div className="w-40 shrink-0">Thời Gian Tồn Tại</div>
                        <div className="w-32 shrink-0 text-right">Tác vụ</div>
                    </div>

                    <div className="divide-y divide-border/60">
                        {trashExams.map((ex) => {
                            let rawDate = ex.deletedAt || ex.updatedAt;
                            let deletedDate = new Date();
                            if (rawDate && typeof rawDate === 'object' && rawDate.seconds) {
                                deletedDate = new Date(rawDate.seconds * 1000);
                            } else if (rawDate) {
                                deletedDate = new Date(rawDate);
                            }
                            if (isNaN(deletedDate.getTime())) deletedDate = new Date();

                            const diffTime = Math.max(0, new Date() - deletedDate);
                            const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            const daysLeft = Math.max(0, 30 - daysPassed);

                            return (
                                <div
                                    key={ex.id}
                                    className="flex flex-col lg:flex-row lg:items-center gap-4 px-6 py-4 hover:bg-muted/15 dark:hover:bg-muted/5 transition-colors duration-150"
                                >
                                    <div className="w-full lg:w-32 shrink-0 flex justify-between lg:block min-w-0">
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-mono block truncate max-w-full" title={ex.id}>
                                            {ex.id}
                                        </span>
                                        <span className="lg:hidden text-xs text-muted-foreground font-medium flex items-center gap-1">
                                            <CalendarClock className="w-3.5 h-3.5" /> Còn {daysLeft} ngày
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-[200px]">
                                        <h3 className="text-sm font-black text-foreground line-clamp-2 leading-snug opacity-70">
                                            {ex.title}
                                        </h3>
                                        <div className="flex gap-2 mt-1.5 opacity-60">
                                            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-semibold text-muted-foreground">{ex.subject || "Chưa xác định"}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-semibold text-muted-foreground">{ex.total_questions || ex.questions?.length || 0} câu hỏi</span>
                                        </div>
                                    </div>

                                    <div className="hidden lg:block w-32 shrink-0">
                                        <span className="text-xs font-semibold text-foreground block">
                                            {deletedDate.toLocaleDateString("vi-VN")}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {deletedDate.toLocaleTimeString("vi-VN")}
                                        </span>
                                    </div>

                                    <div className="hidden lg:flex w-40 shrink-0 items-center gap-2">
                                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${daysLeft <= 5 ? 'bg-red-500' : daysLeft <= 15 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                                style={{ width: `${(daysLeft / 30) * 100}%` }}
                                            />
                                        </div>
                                        <span className={`text-[11px] font-bold ${daysLeft <= 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            {daysLeft} ngày
                                        </span>
                                    </div>

                                    <div className="w-full lg:w-32 shrink-0 flex items-center justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => handleRestore(ex.id, e)}
                                            className="h-8 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                            title="Khôi phục đề thi"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold">Khôi phục</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handlePermanentDelete(ex.id, e)}
                                            className="w-8 h-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center shrink-0"
                                            title="Xóa vĩnh viễn"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-card border border-dashed border-border p-12 rounded-2xl text-center space-y-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <Trash2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Thùng rác trống</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Không có đề thi nào trong thùng rác. Các đề thi đã xóa sẽ xuất hiện ở đây để bạn có thể khôi phục nếu cần.
                    </p>
                </div>
            )}
        </div>
    );
}
