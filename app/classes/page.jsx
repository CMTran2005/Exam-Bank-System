"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { classService } from "@/services/classService";
import {
    GraduationCap,
    Plus,
    Search,
    Users,
    FileSpreadsheet,
    Copy,
    Settings,
    MoreHorizontal,
    QrCode,
    Loader2,
    X,
    ChevronDown,
    Calendar,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GRADE_SUBJECTS_MAP } from "@/lib/constants";
import { CustomDatePicker, CustomTimePicker } from "@/components/ui/date-time-picker";

export default function ClassesPage() {
    const GRADES = Object.keys(GRADE_SUBJECTS_MAP);
    const { currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Create Class Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [newSchoolYear, setNewSchoolYear] = useState("2025-2026");
    const [newGrade, setNewGrade] = useState(GRADES[11]); // Default grade 12
    const [newSubject, setNewSubject] = useState(GRADE_SUBJECTS_MAP[GRADES[11]][0]); // Default subject Toán học
    const [examDate, setExamDate] = useState("");
    const [examTime, setExamTime] = useState("");
    const [examDuration, setExamDuration] = useState(45);
    
    // Manage all dropdowns with a single state to ensure only one is open
    const [activeDropdown, setActiveDropdown] = useState(null);
    
    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    const [isCreating, setIsCreating] = useState(false);
    
    // Generate dynamic years
    const currentYear = new Date().getFullYear();
    const yearsList = Array.from({ length: 21 }, (_, i) => {
        const startYear = currentYear - 10 + i;
        return `${startYear}-${startYear + 1}`;
    });
    
    // QR Code Modal State
    const [qrModalCode, setQrModalCode] = useState(null);

    // Xử lý đóng modal khi ấn phím ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                if (isCreateModalOpen) {
                    setIsCreateModalOpen(false);
                    setActiveDropdown(null);
                }
                if (qrModalCode) {
                    setQrModalCode(null);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isCreateModalOpen, qrModalCode]);

    useEffect(() => {
        const fetchClasses = async () => {
            if (currentUser) {
                setLoading(true);
                try {
                    const data = await classService.getTeacherClasses(currentUser.uid);
                    setClasses(data);
                } catch (error) {
                    console.error("Lỗi tải lớp học:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchClasses();
    }, [currentUser]);

    const handleCreateClass = async (e) => {
        e.preventDefault();
        if (!newClassName.trim() || !currentUser) return;
        
        setIsCreating(true);
        try {
            let computedStartTime = null;
            let computedEndTime = null;
            
            if (examDate && examTime) {
                computedStartTime = new Date(`${examDate}T${examTime}`).toISOString();
                const end = new Date(new Date(computedStartTime).getTime() + examDuration * 60000);
                computedEndTime = end.toISOString();
            }

            const classData = {
                name: newClassName,
                schoolYear: newSchoolYear,
                grade: newGrade,
                subject: newSubject,
                startTime: computedStartTime,
                endTime: computedEndTime,
                duration: examDuration,
                teacherId: currentUser.uid,
                classCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                status: "active",
                color: ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"][Math.floor(Math.random() * 5)]
            };
            
            const newClass = await classService.createClass(classData);
            setClasses([...classes, newClass]);
            setIsCreateModalOpen(false);
            setNewClassName("");
        } catch (error) {
            alert("Lỗi khi tạo lớp thi!");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClass = async (classId) => {
        if (confirm("Bạn có chắc chắn muốn xóa lớp thi này không? Toàn bộ dữ liệu sẽ bị xóa!")) {
            try {
                await classService.deleteClass(classId);
                setClasses(classes.filter(c => c.id !== classId));
            } catch (error) {
                alert("Lỗi xóa lớp thi!");
            }
        }
    };

    const handleRefreshCode = async (classId) => {
        if (confirm("Làm mới mã lớp sẽ khiến các thí sinh dùng mã cũ không thể truy cập. Bạn có chắc chắn không?")) {
            try {
                const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                await classService.updateClass(classId, { classCode: newCode });
                setClasses(classes.map(c => c.id === classId ? { ...c, classCode: newCode } : c));
                if (qrModalCode) setQrModalCode(newCode); // Update QR modal if open
                alert("Đã làm mới mã lớp thành công!");
            } catch (error) {
                alert("Lỗi làm mới mã lớp!");
            }
        }
    };

    const filteredClasses = classes.filter(cls => 
        cls.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-border/60 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-blue-500" />
                        Quản lý Lớp thi
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
                        Tạo lớp thi trực tuyến, chia sẻ Mã lớp hoặc QR code để thí sinh tự tham gia.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" className="font-semibold rounded-xl h-10 border-border gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        Nhập từ Excel
                    </Button>
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 rounded-xl h-10 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo lớp thi
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Tìm kiếm lớp thi..." 
                        className="pl-9 h-10 rounded-xl border-border bg-background focus-visible:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="text-sm font-semibold text-muted-foreground">
                    {filteredClasses.length} lớp thi
                </div>
            </div>

            {/* Classes Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : filteredClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredClasses.map((cls) => (
                        <div 
                            key={cls.id} 
                            className="group flex flex-col bg-card rounded-2xl border border-border hover:border-blue-500/40 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                        >
                            {/* Card Header */}
                            <div className={`h-2 w-full ${cls.color}`}></div>
                            <div className="px-5 py-4 border-b border-border/40 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/20">
                                <div>
                                    <h3 className="font-bold text-foreground text-lg leading-tight truncate">{cls.name}</h3>
                                    <p className="text-xs font-semibold text-muted-foreground mt-1">{cls.grade} • {cls.subject}</p>
                                    {cls.startTime && cls.endTime && (
                                        <p className="text-[11px] font-medium text-slate-500 mt-1">
                                            {new Date(cls.startTime).toLocaleDateString('vi-VN')} {new Date(cls.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(cls.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({cls.duration || 0} phút)
                                        </p>
                                    )}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground -mr-2 hover:bg-red-50 hover:text-red-500"
                                    onClick={() => handleDeleteClass(cls.id)}
                                    title="Xóa lớp thi"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-4 bg-muted/40 p-3 rounded-xl border border-border/50 relative group">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Mã Lớp Thi</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-lg font-black tracking-widest text-foreground">{cls.classCode}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
                                            onClick={() => {
                                                navigator.clipboard.writeText(cls.classCode);
                                                alert("Đã sao chép mã lớp!");
                                            }}
                                            title="Sao chép"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
                                            onClick={() => setQrModalCode(cls.classCode)}
                                            title="Mã QR"
                                        >
                                            <QrCode className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
                                            onClick={() => handleRefreshCode(cls.id)}
                                            title="Làm mới mã"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-4 mt-auto">
                                    <div className="flex -space-x-2">
                                        {Array.from({ length: Math.min(cls.studentCount || 0, 3) }).map((_, i) => (
                                            <div key={i} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-card flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                HS
                                            </div>
                                        ))}
                                        {(cls.studentCount || 0) > 3 && (
                                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-card flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                +{(cls.studentCount || 0) - 3}
                                            </div>
                                        )}
                                        {(cls.studentCount || 0) === 0 && (
                                            <span className="text-xs text-muted-foreground italic ml-1">Chưa có học sinh</span>
                                        )}
                                    </div>
                                    {(cls.studentCount || 0) > 0 && (
                                        <span className="text-xs font-semibold text-muted-foreground ml-2">
                                            {cls.studentCount} Học sinh
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/60">
                                    <Link href={`/classes/${cls.id}`} className="w-full">
                                        <Button variant="outline" className="w-full text-xs font-semibold h-9 rounded-xl border-border hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/30 transition-all gap-1.5">
                                            <Users className="w-3.5 h-3.5" /> Danh sách
                                        </Button>
                                    </Link>
                                    <Link href={`/classes/${cls.id}/settings`} className="w-full">
                                        <Button className="w-full text-xs font-semibold h-9 rounded-xl gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-sm">
                                            <Settings className="w-3.5 h-3.5" /> Cài đặt
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-16 text-center bg-card border border-dashed border-border rounded-2xl">
                    <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-foreground">Bạn chưa có lớp thi nào</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Nhấn "Tạo lớp thi" để bắt đầu quản lý thí sinh và tổ chức thi trực tuyến.</p>
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md rounded-xl h-10 gap-2 mx-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo lớp thi
                    </Button>
                </div>
            )}

            {/* Create Class Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-lg font-bold text-foreground">Tạo Lớp Thi Mới</h2>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={() => setIsCreateModalOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <form onSubmit={handleCreateClass} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Tên lớp thi</label>
                                <Input 
                                    autoFocus
                                    placeholder="Ví dụ: Thi Cuối Kỳ - Toán" 
                                    className="h-11 rounded-xl"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    maxLength={50}
                                    required
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-sm font-semibold text-foreground">Năm học</label>
                                <div className="relative">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-11 rounded-xl justify-between px-3 font-normal"
                                        onClick={() => toggleDropdown('year')}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            {newSchoolYear}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${activeDropdown === 'year' ? "rotate-180" : ""}`} />
                                    </Button>
                                    
                                    {activeDropdown === 'year' && (
                                        <div className="absolute top-full left-0 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                                            {yearsList.map((year) => (
                                                <div 
                                                    key={year}
                                                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${
                                                        newSchoolYear === year ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"
                                                    }`}
                                                    onClick={() => {
                                                        setNewSchoolYear(year);
                                                        setActiveDropdown(null);
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
                                            <span className="truncate">{newGrade}</span>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${activeDropdown === 'grade' ? "rotate-180" : ""}`} />
                                        </Button>
                                        {activeDropdown === 'grade' && (
                                            <div className="absolute top-full left-0 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                                {GRADES.map((grade) => (
                                                    <div 
                                                        key={grade}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${
                                                            newGrade === grade ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"
                                                        }`}
                                                        onClick={() => {
                                                            setNewGrade(grade);
                                                            setNewSubject(GRADE_SUBJECTS_MAP[grade][0]);
                                                            setActiveDropdown(null);
                                                        }}
                                                    >
                                                        {grade}
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
                                            <span className="truncate">{newSubject}</span>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${activeDropdown === 'subject' ? "rotate-180" : ""}`} />
                                        </Button>
                                        {activeDropdown === 'subject' && (
                                            <div className="absolute top-full left-0 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                                {GRADE_SUBJECTS_MAP[newGrade].map((sub) => (
                                                    <div 
                                                        key={sub}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors ${
                                                            newSubject === sub ? "bg-blue-50/50 text-blue-600 font-bold dark:bg-blue-900/20" : "text-foreground font-medium"
                                                        }`}
                                                        onClick={() => {
                                                            setNewSubject(sub);
                                                            setActiveDropdown(null);
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
                                                            setActiveDropdown(null);
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
                            
                            <div className="pt-4 flex items-center justify-end gap-3">
                                <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setIsCreateModalOpen(false)}>
                                    Hủy bỏ
                                </Button>
                                <Button type="submit" disabled={isCreating || !newClassName.trim()} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold w-32">
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo Lớp"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrModalCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-center">
                        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-blue-500" />
                                Mã QR Lớp Thi
                            </h2>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={() => setQrModalCode(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-8 flex flex-col items-center justify-center">
                            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 mb-6">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrModalCode}`} 
                                    alt="Class QR Code" 
                                    className="w-48 h-48"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">Thí sinh quét mã để tham gia thi</p>
                            <span className="font-mono text-3xl font-black tracking-widest text-foreground bg-muted px-4 py-2 rounded-xl mt-2">
                                {qrModalCode}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
