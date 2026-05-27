import Link from "next/link";
import { Edit3, ArrowRightLeft, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExamList({ 
    displayedExams, selectedExams, displaySettings, 
    toggleSelectAll, toggleSelectExam, 
    setExamToMove, setIsMoveExamModalOpen, handleDeleteExam, handleTogglePublic
}) {
    return (
        <div className="space-y-4">
            <div className="hidden lg:block bg-card border border-border rounded-2xl overflow-x-auto shadow-sm">
                <div className="min-w-max">
                    <div className="flex items-center gap-6 px-8 py-4 border-b border-border/85 bg-slate-50/50 dark:bg-slate-900/35 text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                    <div className="w-4 shrink-0 flex items-center">
                        <input 
                            type="checkbox" 
                            checked={selectedExams.length > 0 && selectedExams.length === displayedExams.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                    </div>
                    {displaySettings.id && <div className="w-32 shrink-0">Mã Đề</div>}
                    <div className="flex-1 min-w-[250px]">Tên Đề Thi</div>
                    {displaySettings.subject && <div className="w-32 shrink-0">Môn Học</div>}
                    {displaySettings.grade && <div className="w-24 shrink-0">Khối Lớp</div>}
                    {displaySettings.province && <div className="w-36 shrink-0">Tỉnh Thành</div>}
                    {displaySettings.year && <div className="w-28 shrink-0">Năm Học</div>}
                    {displaySettings.duration && <div className="w-28 shrink-0">Thời Lượng</div>}
                    {displaySettings.total_questions && <div className="w-24 shrink-0 text-center">Câu Hỏi</div>}
                    {displaySettings.updatedAt && <div className="w-32 shrink-0 text-right">Ngày Cập Nhật</div>}
                    <div className="w-40 shrink-0 text-right">Tác vụ</div>
                </div>

                <div className="divide-y divide-border/60">
                    {displayedExams.map((ex) => (
                        <div
                            key={ex.id}
                            className={`flex items-center gap-6 px-8 py-4 transition-colors duration-150 ${selectedExams.includes(ex.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-muted/15 dark:hover:bg-muted/5'}`}
                        >
                            <div className="w-4 shrink-0 flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={selectedExams.includes(ex.id)}
                                    onChange={() => toggleSelectExam(ex.id)}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                                />
                            </div>
                            {displaySettings.id && (
                                <div className="w-32 shrink-0 min-w-0">
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/40 font-mono block truncate max-w-full" title={ex.id}>
                                        {ex.id}
                                    </span>
                                </div>
                            )}

                            <div className="flex-1 min-w-[250px]">
                                <Link
                                    href={`/create-question?editId=${ex.id}`}
                                    className="text-sm font-black text-foreground hover:text-primary transition-colors line-clamp-1 leading-snug"
                                >
                                    {ex.title}
                                </Link>
                            </div>

                            {displaySettings.subject && (
                                <div className="w-32 shrink-0">
                                    <span className="text-xs font-semibold text-foreground truncate block" title={ex.subject || "Toán học"}>
                                        {ex.subject || "Toán học"}
                                    </span>
                                </div>
                            )}

                            {displaySettings.grade && (
                                <div className="w-24 shrink-0">
                                    <span className="text-xs font-semibold text-foreground block">
                                        {ex.grade ? `Lớp ${ex.grade}` : "Cả cấp"}
                                    </span>
                                </div>
                            )}

                            {displaySettings.province && (
                                <div className="w-36 shrink-0">
                                    <span className="text-xs font-semibold text-foreground truncate block" title={ex.province || "Toàn quốc"}>
                                        {ex.province || "Toàn quốc"}
                                    </span>
                                </div>
                            )}

                            {displaySettings.year && (
                                <div className="w-28 shrink-0">
                                    <span className="text-xs font-semibold text-foreground block">
                                        {ex.year || "Không có"}
                                    </span>
                                </div>
                            )}

                            {displaySettings.duration && (
                                <div className="w-28 shrink-0">
                                    <span className="text-xs font-semibold text-foreground block">
                                        {ex.duration || 90} phút
                                    </span>
                                </div>
                            )}

                            {displaySettings.total_questions && (
                                <div className="w-24 shrink-0 text-center">
                                    <span className="font-bold text-[11px] text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mx-auto block w-fit">
                                        {ex.total_questions || ex.questions?.length || 0} câu
                                    </span>
                                </div>
                            )}

                            {displaySettings.updatedAt && (
                                <div className="w-32 shrink-0 text-right">
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {new Date(ex.updatedAt).toLocaleDateString("vi-VN")}
                                    </span>
                                </div>
                            )}

                            <div className="w-40 shrink-0 flex items-center justify-end gap-1.5">
                                <Button
                                    variant="outline" size="icon"
                                    onClick={() => handleTogglePublic(ex.id, ex.isPublic)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                        ex.isPublic 
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50" 
                                            : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                                    title={ex.isPublic ? "Đang hiển thị trên Luyện thi" : "Đã ẩn khỏi Luyện thi"}
                                >
                                    {ex.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </Button>
                                <Link href={`/create-question?editId=${ex.id}`}>
                                    <Button
                                        variant="outline" size="icon"
                                        className="w-8 h-8 rounded-lg border-border hover:bg-muted text-foreground flex items-center justify-center shrink-0"
                                        title="Chỉnh sửa đề thi"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline" size="icon"
                                    onClick={() => { setExamToMove(ex); setIsMoveExamModalOpen(true); }}
                                    className="w-8 h-8 rounded-lg border-border hover:bg-muted text-foreground flex items-center justify-center shrink-0"
                                    title="Chuyển thư mục"
                                >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="outline" size="icon"
                                    onClick={(e) => handleDeleteExam(ex.id, e)}
                                    className="w-8 h-8 rounded-lg border-red-200 bg-red-50 text-red-500 hover:text-red-600 hover:bg-red-100 hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/30 flex items-center justify-center shrink-0 transition-colors"
                                    title="Xóa đề thi"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            </div>

            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayedExams.map((ex) => (
                    <div
                        key={ex.id}
                        className={`bg-card border rounded-2xl p-4.5 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-3.5 relative ${selectedExams.includes(ex.id) ? 'border-primary bg-primary/5' : 'border-border hover:shadow hover:border-primary/30'}`}
                    >
                        <div className="absolute top-4 right-4 z-10">
                            <input 
                                type="checkbox" 
                                checked={selectedExams.includes(ex.id)}
                                onChange={() => toggleSelectExam(ex.id)}
                                className="w-5 h-5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                        </div>
                        <div className="space-y-2.5 pr-8">
                            <div className="flex flex-wrap items-center gap-1.5">
                                {displaySettings.id && (
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/40 font-mono block max-w-[150px] truncate" title={ex.id}>
                                        ID: {ex.id}
                                    </span>
                                )}
                                {displaySettings.year && ex.year && (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/40">
                                        Năm {ex.year}
                                    </span>
                                )}
                            </div>
                            <div>
                                <Link
                                    href={`/create-question?editId=${ex.id}`}
                                    className="text-sm font-black text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                                >
                                    {ex.title}
                                </Link>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {displaySettings.subject && (
                                    <div className="flex items-center bg-muted/50 dark:bg-muted/15 px-2 py-0.75 rounded-lg border border-border/30 text-[10.5px] font-semibold text-foreground">
                                        <span>{ex.subject || "Toán học"}</span>
                                    </div>
                                )}
                                {displaySettings.grade && (
                                    <div className="flex items-center bg-muted/50 dark:bg-muted/15 px-2 py-0.75 rounded-lg border border-border/30 text-[10.5px] font-semibold text-foreground">
                                        <span>{ex.grade ? `Lớp ${ex.grade}` : "Cả cấp"}</span>
                                    </div>
                                )}
                                {displaySettings.province && (
                                    <div className="flex items-center bg-muted/50 dark:bg-muted/15 px-2 py-0.75 rounded-lg border border-border/30 text-[10.5px] font-semibold text-foreground">
                                        <span>{ex.province || "Toàn quốc"}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground gap-2">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                {displaySettings.duration && (
                                    <span className="font-medium">{ex.duration || 90} phút</span>
                                )}
                                {displaySettings.total_questions && (
                                    <span className="font-medium">{ex.total_questions || ex.questions?.length || 0} câu</span>
                                )}
                                {displaySettings.updatedAt && (
                                    <span className="font-medium">CN: {new Date(ex.updatedAt).toLocaleDateString("vi-VN")}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                <Button
                                    variant="outline" size="icon"
                                    onClick={() => handleTogglePublic(ex.id, ex.isPublic)}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                        ex.isPublic 
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50" 
                                            : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                                >
                                    {ex.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </Button>
                                <Link href={`/create-question?editId=${ex.id}`}>
                                    <Button variant="outline" size="icon" className="w-7 h-7 rounded-lg border-border hover:bg-muted text-foreground flex items-center justify-center">
                                        <Edit3 className="w-3 h-3" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline" size="icon"
                                    onClick={() => { setExamToMove(ex); setIsMoveExamModalOpen(true); }}
                                    className="w-7 h-7 rounded-lg border-border hover:bg-muted text-foreground flex items-center justify-center shrink-0"
                                >
                                    <ArrowRightLeft className="w-3 h-3" />
                                </Button>
                                <Button
                                    variant="outline" size="icon"
                                    onClick={(e) => handleDeleteExam(ex.id, e)}
                                    className="w-7 h-7 rounded-lg border-red-200 bg-red-50 text-red-500 hover:text-red-600 hover:bg-red-100 hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/30 flex items-center justify-center shrink-0 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
