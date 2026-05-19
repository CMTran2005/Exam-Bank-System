"use client";

import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Plus, Search, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClasses } from "@/hooks/useClasses";

import { ClassGrid } from "./_components/ClassGrid";
import { ClassModals } from "./_components/ClassModals";

export default function ClassesPage() {
    const { currentUser } = useAuth();
    
    const {
        GRADES, searchQuery, setSearchQuery, loading,
        activeDropdown, setActiveDropdown, toggleDropdown,
        isCreateModalOpen, setIsCreateModalOpen,
        newClassName, setNewClassName, newSchoolYear, setNewSchoolYear,
        newGrade, setNewGrade, newSubject, setNewSubject,
        examDate, setExamDate, examTime, setExamTime, examDuration, setExamDuration,
        isCreating, qrModalCode, setQrModalCode,
        handleCreateClass, handleDeleteClass, handleRefreshCode, filteredClasses
    } = useClasses(currentUser);

    const currentYear = new Date().getFullYear();
    const yearsList = Array.from({ length: 21 }, (_, i) => {
        const startYear = currentYear - 10 + i;
        return `${startYear}-${startYear + 1}`;
    });

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
                <ClassGrid 
                    filteredClasses={filteredClasses} 
                    handleDeleteClass={handleDeleteClass} 
                    setQrModalCode={setQrModalCode} 
                    handleRefreshCode={handleRefreshCode} 
                />
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

            <ClassModals 
                isCreateModalOpen={isCreateModalOpen} setIsCreateModalOpen={setIsCreateModalOpen}
                handleCreateClass={handleCreateClass} isCreating={isCreating}
                newClassName={newClassName} setNewClassName={setNewClassName}
                newSchoolYear={newSchoolYear} setNewSchoolYear={setNewSchoolYear} yearsList={yearsList}
                newGrade={newGrade} setNewGrade={setNewGrade} GRADES={GRADES}
                newSubject={newSubject} setNewSubject={setNewSubject}
                examDate={examDate} setExamDate={setExamDate}
                examTime={examTime} setExamTime={setExamTime}
                examDuration={examDuration} setExamDuration={setExamDuration}
                activeDropdown={activeDropdown} toggleDropdown={toggleDropdown} setActiveDropdown={setActiveDropdown}
                qrModalCode={qrModalCode} setQrModalCode={setQrModalCode}
            />
        </div>
    );
}
