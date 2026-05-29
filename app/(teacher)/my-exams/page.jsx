"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, SlidersHorizontal, FileText, Loader2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useExams } from "@/hooks/teacher/useExams";

import { FolderTabs } from "./_components/FolderTabs";
import { DisplaySettings } from "./_components/DisplaySettings";
import { BulkActionBar } from "./_components/BulkActionBar";
import { ExamList } from "./_components/ExamList";
import { ExamModals } from "./_components/ExamModals";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MyExamsPage() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const [showSettings, setShowSettings] = useState(false);
    const [sortOption, setSortOption] = useState("newest");

    // Modal states
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [isMoveExamModalOpen, setIsMoveExamModalOpen] = useState(false);
    const [examToMove, setExamToMove] = useState(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    const {
        exams, folders, activeFolder, setActiveFolder,
        selectedExams, setSelectedExams,
        displaySettings, toggleSetting, mounted,
        handleDeleteExam, handleBulkDelete, handleMoveToFolder,
        handleCreateFolder, handleDeleteFolder, handleTogglePublic
    } = useExams(currentUser);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

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
                <p className="text-sm text-muted-foreground animate-pulse">Đang tải danh sách đề thi...</p>
            </div>
        );
    }

    let displayedExams = exams.filter(ex => activeFolder === "all" || ex.folderId === activeFolder);

    // Xử lý Sort
    displayedExams = [...displayedExams].sort((a, b) => {
        if (sortOption === "newest") {
            return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        } else if (sortOption === "oldest") {
            return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
        } else if (sortOption === "title_asc") {
            return (a.title || "").localeCompare(b.title || "");
        } else if (sortOption === "title_desc") {
            return (b.title || "").localeCompare(a.title || "");
        } else if (sortOption === "questions_desc") {
            const lenA = a.questions?.length || a.total_questions || 0;
            const lenB = b.questions?.length || b.total_questions || 0;
            return lenB - lenA;
        }
        return 0;
    });

    const toggleSelectAll = () => {
        if (selectedExams.length === displayedExams.length) {
            setSelectedExams([]);
        } else {
            setSelectedExams(displayedExams.map(e => e.id));
        }
    };

    const toggleSelectExam = (id) => {
        setSelectedExams(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleCreateFolderWrapper = async (name) => {
        setIsCreatingFolder(true);
        await handleCreateFolder(name);
        setIsCreatingFolder(false);
        setIsCreateFolderModalOpen(false);
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-primary rounded-full animate-pulse" />
                        Đề Thi Của Tôi
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Danh sách các đề thi bạn đã soạn thảo ({exams.length} đề thi).
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    <div className="w-[180px]">
                        <Select value={sortOption} onValueChange={setSortOption}>
                            <SelectTrigger className="h-10 rounded-xl bg-background border-border shadow-sm font-semibold hover:bg-muted/50 transition-colors focus:ring-1 focus:ring-primary [&>svg]:hidden">
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm line-clamp-1"><SelectValue placeholder="Sắp xếp" /></span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-lg border-border font-medium">
                                <SelectItem value="newest" className="cursor-pointer">Ngày sửa: Gần nhất</SelectItem>
                                <SelectItem value="oldest" className="cursor-pointer">Ngày sửa: Cũ nhất</SelectItem>
                                <SelectItem value="title_asc" className="cursor-pointer">Tên: A - Z</SelectItem>
                                <SelectItem value="title_desc" className="cursor-pointer">Tên: Z - A</SelectItem>
                                <SelectItem value="questions_desc" className="cursor-pointer">Số câu hỏi: Giảm dần</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowSettings(!showSettings)}
                        className={`font-bold rounded-xl h-10 border-border flex items-center gap-2 ${showSettings ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        title="Tùy chọn hiển thị"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="text-xs">Tùy chọn hiển thị</span>
                    </Button>
                    <Link href="/create-question">
                        <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md shadow-primary/10 rounded-xl h-10 flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            <span className="text-xs sm:inline hidden">Soạn đề thi mới</span>
                            <span className="text-xs sm:hidden">Soạn mới</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <FolderTabs
                folders={folders}
                activeFolder={activeFolder}
                setActiveFolder={setActiveFolder}
                handleDeleteFolder={handleDeleteFolder}
                setIsCreateFolderModalOpen={setIsCreateFolderModalOpen}
                examsLength={exams.length}
            />

            {showSettings && (
                <DisplaySettings displaySettings={displaySettings} toggleSetting={toggleSetting} />
            )}

            <BulkActionBar
                selectedExams={selectedExams}
                handleBulkDelete={handleBulkDelete}
                onMove={() => { setExamToMove("BULK"); setIsMoveExamModalOpen(true); }}
            />

            {exams.length > 0 ? (
                <ExamList
                    displayedExams={displayedExams}
                    selectedExams={selectedExams}
                    displaySettings={displaySettings}
                    toggleSelectAll={toggleSelectAll}
                    toggleSelectExam={toggleSelectExam}
                    setExamToMove={setExamToMove}
                    setIsMoveExamModalOpen={setIsMoveExamModalOpen}
                    handleDeleteExam={handleDeleteExam}
                    handleTogglePublic={handleTogglePublic}
                />
            ) : (
                <div className="bg-card border border-dashed border-border p-12 rounded-2xl text-center space-y-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Bạn chưa có đề thi nào!</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Nhấn nút dưới để bắt đầu soạn thảo đề thi đầu tiên.
                    </p>
                    <Link href="/create-question">
                        <Button className="mt-2 h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground">
                            <Plus className="w-4 h-4 mr-2" /> Soạn thảo đề thi mới
                        </Button>
                    </Link>
                </div>
            )}

            <ExamModals
                isCreateFolderModalOpen={isCreateFolderModalOpen}
                setIsCreateFolderModalOpen={setIsCreateFolderModalOpen}
                newFolderName={newFolderName}
                setNewFolderName={setNewFolderName}
                handleCreateFolder={handleCreateFolderWrapper}
                isCreatingFolder={isCreatingFolder}
                isMoveExamModalOpen={isMoveExamModalOpen}
                setIsMoveExamModalOpen={setIsMoveExamModalOpen}
                examToMove={examToMove}
                folders={folders}
                handleMoveToFolder={handleMoveToFolder}
                selectedExams={selectedExams}
            />
        </div>
    );
}