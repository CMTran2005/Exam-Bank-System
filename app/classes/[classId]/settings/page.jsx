"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, ShieldAlert, Loader2, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomDatePicker, CustomTimePicker } from "@/components/ui/date-time-picker";
import { GRADE_SUBJECTS_MAP } from "@/lib/constants";
import { useClassSettings } from "@/hooks/useClassSettings";

export default function ClassSettingsPage({ params }) {
    const { classId } = use(params);
    const {
        authLoading, loading,
        className, setClassName,
        schoolYear, setSchoolYear,
        grade, setGrade,
        subject, setSubject,
        examDate, setExamDate,
        examTime, setExamTime,
        examDuration, setExamDuration,
        isSaving,
        activeDropdown, toggleDropdown,
        isYearDropdownOpen, setIsYearDropdownOpen,
        yearsList, GRADES,
        handleSave, handleDelete
    } = useClassSettings(classId);

    if (authLoading || loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 border-b border-border/60 pb-6">
                <Link href="/classes">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        Cài đặt lớp thi
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Thay đổi thông tin lớp thi và các tùy chọn liên quan.
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Tên lớp thi</label>
                        <Input 
                            className="h-11 rounded-xl"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                        />
                    </div>
                    
                    <div className="space-y-2 relative">
                        <label className="text-sm font-semibold text-foreground">Năm học</label>
                        <div className="relative">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                            >
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    {schoolYear || "Chọn năm học"}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isYearDropdownOpen ? "rotate-180" : ""}`} />
                            </Button>
                            
                            {isYearDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                                    {yearsList.map((year) => (
                                        <div 
                                            key={year}
                                            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${
                                                schoolYear === year ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"
                                            }`}
                                            onClick={() => {
                                                setSchoolYear(year);
                                                setIsYearDropdownOpen(false);
                                            }}
                                        >
                                            {year}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 relative">
                            <label className="text-sm font-semibold text-foreground">Khối lớp</label>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                                    onClick={() => toggleDropdown('grade')}
                                >
                                    <span className="truncate">{grade}</span>
                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${activeDropdown === 'grade' ? "rotate-180" : ""}`} />
                                </Button>
                                {activeDropdown === 'grade' && (
                                    <div className="absolute top-full left-0 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                        {GRADES.map((g) => (
                                            <div 
                                                key={g}
                                                className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${
                                                    grade === g ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"
                                                }`}
                                                onClick={() => {
                                                    setGrade(g);
                                                    setSubject(GRADE_SUBJECTS_MAP[g][0]);
                                                    toggleDropdown('grade');
                                                }}
                                            >
                                                {g}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2 relative">
                            <label className="text-sm font-semibold text-foreground">Môn thi</label>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                                    onClick={() => toggleDropdown('subject')}
                                >
                                    <span className="truncate">{subject}</span>
                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${activeDropdown === 'subject' ? "rotate-180" : ""}`} />
                                </Button>
                                {activeDropdown === 'subject' && (
                                    <div className="absolute top-full left-0 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                        {grade && GRADE_SUBJECTS_MAP[grade].map((sub) => (
                                            <div 
                                                key={sub}
                                                className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${
                                                    subject === sub ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"
                                                }`}
                                                onClick={() => {
                                                    setSubject(sub);
                                                    toggleDropdown('subject');
                                                }}
                                            >
                                                {sub}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Ngày thi</label>
                            <CustomDatePicker 
                                value={examDate} 
                                onChange={setExamDate} 
                                isOpen={activeDropdown === 'date'} 
                                onToggle={() => toggleDropdown('date')} 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Giờ bắt đầu</label>
                            <CustomTimePicker 
                                value={examTime} 
                                onChange={setExamTime} 
                                isOpen={activeDropdown === 'time'} 
                                onToggle={() => toggleDropdown('time')} 
                            />
                        </div>
                        <div className="space-y-2 relative">
                            <label className="text-sm font-semibold text-foreground">Thời lượng</label>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                                    onClick={() => toggleDropdown('duration')}
                                >
                                    <span className="truncate">{examDuration} phút</span>
                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${activeDropdown === 'duration' ? "rotate-180" : ""}`} />
                                </Button>
                                {activeDropdown === 'duration' && (
                                    <div className="absolute top-full right-0 min-w-[120px] mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                        {[15, 30, 45, 60, 90, 120, 150, 180].map((mins) => (
                                            <div 
                                                key={mins}
                                                className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${
                                                    examDuration === mins ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"
                                                }`}
                                                onClick={() => {
                                                    setExamDuration(mins);
                                                    toggleDropdown('duration');
                                                }}
                                            >
                                                {mins} phút
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border mt-6">
                        <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-2">
                            <ShieldAlert className="w-4 h-4" />
                            Khu vực nguy hiểm
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Hành động này không thể hoàn tác. Nó sẽ xóa vĩnh viễn lớp thi và toàn bộ dữ liệu cấu hình bên trong.
                        </p>
                        <Button onClick={handleDelete} variant="destructive" className="h-10 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa lớp thi này
                        </Button>
                    </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving || !className.trim()} className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-bold px-8">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Lưu Thay Đổi
                    </Button>
                </div>
            </div>
        </div>
    );
}
