"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, X, Save, Trash2, CheckCircle, Loader2, Folder, FolderOpen, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useSubjects from "@/hooks/shared/useSubjects";
import { useConfirm } from "@/context/ConfirmContext";
import { toast } from "sonner";

/**
 * Component SubjectsPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function SubjectsPage() {
    const confirmDialog = useConfirm();
    const { gradeSubjectsMap, updateSubjects, loading } = useSubjects();
    const [localMap, setLocalMap] = useState(null);
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState("");

    // Modal states
    const [isCreateGradeModalOpen, setIsCreateGradeModalOpen] = useState(false);
    const [newGradeName, setNewGradeName] = useState("");

    // Initialize localMap when gradeSubjectsMap is loaded
    useEffect(() => {
        if (!loading && !localMap && gradeSubjectsMap) {
            setLocalMap(JSON.parse(JSON.stringify(gradeSubjectsMap)));
            const keys = Object.keys(gradeSubjectsMap);
            if (keys.length > 0 && !selectedGrade) {
                setSelectedGrade(keys[0]);
            }
        }
    }, [loading, localMap, gradeSubjectsMap, selectedGrade]);

    const handleAddSubject = (grade) => {
        setLocalMap(prev => {
            const newMap = { ...prev };
            if (!newMap[grade]) {
                newMap[grade] = ["Môn học mới"];
            } else {
                newMap[grade] = [...newMap[grade], "Môn học mới"];
            }
            return newMap;
        });
    };

    const handleRemoveSubject = (grade, index) => {
        setLocalMap(prev => {
            const newMap = { ...prev };
            newMap[grade] = [...newMap[grade]];
            newMap[grade].splice(index, 1);
            return newMap;
        });
    };

    const handleChangeSubject = (grade, index, value) => {
        setLocalMap(prev => {
            const newMap = { ...prev };
            newMap[grade] = [...newMap[grade]];
            newMap[grade][index] = value;
            return newMap;
        });
    };

    const handleRemoveGrade = async (grade) => {
        if (await confirmDialog(`Bạn có chắc chắn muốn xóa khối lớp "${grade}" cùng tất cả môn học bên trong?`, "Xóa khối lớp")) {
            setLocalMap(prev => {
                const newMap = { ...prev };
                delete newMap[grade];
                return newMap;
            });
            const keys = Object.keys(localMap).filter(k => k !== grade);
            setSelectedGrade(keys.length > 0 ? keys[0] : "");
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setSavedSuccess(false);

            // Clean empty strings
            const cleanedMap = {};
            for (const [grade, subjects] of Object.entries(localMap)) {
                cleanedMap[grade] = subjects.map(s => s.trim()).filter(s => s !== "");
                // remove duplicates
                cleanedMap[grade] = Array.from(new Set(cleanedMap[grade]));
            }

            await updateSubjects(cleanedMap);
            setLocalMap(cleanedMap);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
            toast.success("Lưu môn học thành công!");
        } catch (error) {
            toast.error("Lỗi khi lưu: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !localMap) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
                        Quản lý Môn học
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Cấu hình danh sách môn học theo từng khối lớp</p>
                </div>
                <div className="flex items-center gap-3">
                    {savedSuccess && (
                        <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Đã lưu!
                        </div>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md shadow-blue-500/20 rounded-xl"
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Lưu thay đổi
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Grades Tabs */}
                <div className="flex flex-wrap items-center gap-2 pb-2">
                    {Object.keys(localMap).map(grade => (
                        <button
                            key={grade}
                            onClick={() => setSelectedGrade(grade)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${selectedGrade === grade
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                    : "bg-card text-muted-foreground border-border hover:border-blue-500/40 hover:text-foreground"
                                }`}
                        >
                            {selectedGrade === grade ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                            {grade === "Đại học" ? "Đại học" : `Khối ${grade}`}
                        </button>
                    ))}
                    <button
                        onClick={() => setIsCreateGradeModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-dashed border-border text-muted-foreground hover:border-blue-500/40 hover:text-blue-600 transition-all whitespace-nowrap bg-muted/20"
                    >
                        <FolderPlus className="w-4 h-4" />
                        Thêm khối lớp
                    </button>
                </div>

                {selectedGrade && localMap[selectedGrade] ? (
                    <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden animate-in fade-in duration-300">
                        <div className="bg-slate-50 dark:bg-slate-900/80 p-4 border-b border-border flex items-center justify-between">
                            <div className="font-bold text-base flex items-center gap-2 text-foreground">
                                <BookOpen className="w-5 h-5 text-blue-500" />
                                {selectedGrade === "Đại học" ? "Đại học" : `Khối ${selectedGrade}`}
                            </div>
                            <button
                                onClick={() => handleRemoveGrade(selectedGrade)}
                                className="text-muted-foreground hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 font-medium text-sm flex items-center gap-1.5"
                                title="Xóa khối lớp này"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Xóa</span>
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-background">
                            {localMap[selectedGrade].map((sub, idx) => (
                                <div key={idx} className="relative group">
                                    <Input
                                        value={sub}
                                        onChange={(e) => handleChangeSubject(selectedGrade, idx, e.target.value)}
                                        className="h-11 text-sm pl-4 pr-10 text-foreground dark:text-slate-100 font-medium rounded-xl shadow-sm border-slate-200 dark:border-slate-800 w-full focus-visible:ring-blue-500/30"
                                        placeholder="Nhập tên môn học..."
                                    />
                                    <button
                                        onClick={() => handleRemoveSubject(selectedGrade, idx)}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Xóa môn học này"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                className="h-11 text-sm border-dashed border-2 border-border w-full justify-center text-muted-foreground hover:text-foreground rounded-xl"
                                onClick={() => handleAddSubject(selectedGrade)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm môn học
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-card border border-border rounded-2xl text-muted-foreground">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Chưa chọn khối lớp nào hoặc khối lớp không tồn tại.</p>
                    </div>
                )}
            </div>

            {/* Create Grade Modal */}
            {isCreateGradeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border/60">
                            <h3 className="font-bold text-foreground">Thêm khối lớp mới</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full" onClick={() => setIsCreateGradeModalOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (newGradeName.trim()) {
                                const trimmedName = newGradeName.trim();
                                setLocalMap(prev => ({
                                    ...prev,
                                    [trimmedName]: prev[trimmedName] || []
                                }));
                                setSelectedGrade(trimmedName);
                                setNewGradeName("");
                                setIsCreateGradeModalOpen(false);
                            }
                        }} className="p-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Tên khối lớp</label>
                                <Input
                                    autoFocus
                                    placeholder="Ví dụ: 13, Thạc sĩ..."
                                    className="h-11 rounded-xl text-sm"
                                    value={newGradeName}
                                    onChange={(e) => setNewGradeName(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                                <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setIsCreateGradeModalOpen(false)}>
                                    Hủy bỏ
                                </Button>
                                <Button type="submit" disabled={!newGradeName.trim()} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold min-w-[100px]">
                                    Tạo mới
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
