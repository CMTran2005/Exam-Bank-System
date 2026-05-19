"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FileText,
    Plus,
    Trash2,
    Edit3,
    SlidersHorizontal,
    Eye,
    EyeOff,
    Check,
    Loader2,
    Folder,
    FolderOpen,
    FolderPlus,
    MoreVertical,
    X,
    ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { doc, deleteDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const runWithTimeout = (promise, ms = 1000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

const SAMPLE_EXAMS = [];

export default function MyExamsPage() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const [exams, setExams] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [displaySettings, setDisplaySettings] = useState({
        id: true,
        year: true,
        grade: true,
        subject: true,
        province: true,
        duration: true,
        total_questions: true,
        updatedAt: true
    });
    const [folders, setFolders] = useState([
        { id: "all", name: "Tất cả đề thi" }
    ]);
    const [activeFolder, setActiveFolder] = useState("all");

    // Modal states
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    
    const [isMoveExamModalOpen, setIsMoveExamModalOpen] = useState(false);
    const [examToMove, setExamToMove] = useState(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    
    // Bulk selection state
    const [selectedExams, setSelectedExams] = useState([]);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    useEffect(() => {
        setMounted(true);
        const fetchExams = async () => {
            if (typeof window !== "undefined") {
                let list = [];
                // Thử load từ Firestore
                try {
                    const q = query(collection(db, "exams"), where("uid", "==", currentUser?.uid || "anonymous"));
                    const querySnapshot = await runWithTimeout(getDocs(q), 1500);
                    querySnapshot.forEach((doc) => {
                        list.push(doc.data());
                    });
                } catch (e) {
                    console.warn("Bỏ qua lỗi Firestore khi tải đề thi, dùng LocalStorage:", e.message);
                }

                // Nếu Firestore không trả về gì hoặc có lỗi, đồng bộ với LocalStorage
                if (list.length === 0) {
                    const savedExams = localStorage.getItem("eb_exams");
                    if (savedExams) {
                        try {
                            list = JSON.parse(savedExams);
                        } catch (err) {
                            list = SAMPLE_EXAMS;
                        }
                    } else {
                        localStorage.setItem("eb_exams", JSON.stringify(SAMPLE_EXAMS));
                        list = SAMPLE_EXAMS;
                    }
                } else {
                    // Cập nhật lại LocalStorage để đồng bộ
                    localStorage.setItem("eb_exams", JSON.stringify(list));
                }

                setExams(list);

                const savedSettings = localStorage.getItem("eb_exam_display_settings");
                if (savedSettings) {
                    try {
                        setDisplaySettings(JSON.parse(savedSettings));
                    } catch (e) {
                        console.error("Lỗi đọc cấu hình hiển thị:", e);
                    }
                }

                // Tải danh sách folders
                let folderList = [{ id: "all", name: "Tất cả đề thi" }];
                try {
                    const fq = query(collection(db, "folders"), where("uid", "==", currentUser?.uid || "anonymous"));
                    const folderSnap = await runWithTimeout(getDocs(fq), 1500);
                    folderSnap.forEach((doc) => {
                        folderList.push({ id: doc.id, ...doc.data() });
                    });
                } catch (e) {
                    console.warn("Lỗi tải folder từ Firebase, dùng LocalStorage");
                }

                if (folderList.length === 1) {
                    const savedFolders = localStorage.getItem("eb_folders");
                    if (savedFolders) {
                        try {
                            folderList = JSON.parse(savedFolders);
                        } catch(e) {}
                    }
                } else {
                    localStorage.setItem("eb_folders", JSON.stringify(folderList));
                }
                setFolders(folderList);
            }
        };

        if (currentUser) {
            fetchExams();
        }
    }, [currentUser]);

    if (loading || !currentUser) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const toggleSetting = (key) => {
        const updated = { ...displaySettings, [key]: !displaySettings[key] };
        setDisplaySettings(updated);
        localStorage.setItem("eb_exam_display_settings", JSON.stringify(updated));
    };

    const handleDeleteExam = async (id, e) => {
        e.preventDefault();
        if (confirm("Bạn có chắc chắn muốn xóa đề thi này không? Đề thi sẽ được chuyển vào Thùng rác và có thể khôi phục trong 30 ngày.")) {
            const examToDelete = exams.find(ex => ex.id === id);
            if (!examToDelete) return;

            // Thêm thông tin xóa
            const trashedExam = {
                ...examToDelete,
                deletedAt: new Date().toISOString()
            };

            const updated = exams.filter((ex) => ex.id !== id);
            setExams(updated);
            localStorage.setItem("eb_exams", JSON.stringify(updated));

            // Lưu vào thùng rác local
            const savedTrash = JSON.parse(localStorage.getItem("eb_trash") || "[]");
            savedTrash.push(trashedExam);
            localStorage.setItem("eb_trash", JSON.stringify(savedTrash));

            // Di chuyển trong Firestore
            try {
                // Thêm vào trash_exams
                const trashDocRef = doc(db, "trash_exams", id);
                await runWithTimeout(setDoc(trashDocRef, trashedExam), 1200);

                // Xóa khỏi exams
                const examDocRef = doc(db, "exams", id);
                await runWithTimeout(deleteDoc(examDocRef), 1200);
            } catch (err) {
                console.warn("Bỏ qua lỗi Firestore khi xóa đề thi:", err.message);
            }
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        setIsCreatingFolder(true);

        const newFolder = {
            id: `f_${Date.now()}`,
            name: newFolderName.trim(),
            uid: currentUser.uid,
            createdAt: new Date().toISOString()
        };

        try {
            const folderRef = doc(db, "folders", newFolder.id);
            await runWithTimeout(setDoc(folderRef, newFolder), 1000);
        } catch (e) {
            console.warn("Chỉ lưu local vì lỗi Firestore", e);
        }

        const updatedFolders = [...folders, newFolder];
        setFolders(updatedFolders);
        localStorage.setItem("eb_folders", JSON.stringify(updatedFolders));
        
        setIsCreateFolderModalOpen(false);
        setNewFolderName("");
        setIsCreatingFolder(false);
        setActiveFolder(newFolder.id);
    };

    const handleBulkDelete = async () => {
        if (!selectedExams.length) return;
        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedExams.length} đề thi đã chọn?`)) {
            const trashedExams = exams.filter(ex => selectedExams.includes(ex.id)).map(ex => ({
                ...ex,
                deletedAt: new Date().toISOString()
            }));

            const updatedExams = exams.filter(ex => !selectedExams.includes(ex.id));
            setExams(updatedExams);
            localStorage.setItem("eb_exams", JSON.stringify(updatedExams));

            const savedTrash = JSON.parse(localStorage.getItem("eb_trash") || "[]");
            localStorage.setItem("eb_trash", JSON.stringify([...savedTrash, ...trashedExams]));

            for (const exam of trashedExams) {
                try {
                    await setDoc(doc(db, "trash_exams", exam.id), exam);
                    await deleteDoc(doc(db, "exams", exam.id));
                } catch(e) {}
            }
            
            setSelectedExams([]);
        }
    };

    const handleMoveToFolder = async (folderId) => {
        if (!examToMove) return;

        let updatedExams = [...exams];
        const isBulk = examToMove === "BULK";
        const targets = isBulk ? selectedExams : [examToMove.id];

        updatedExams = updatedExams.map(ex => 
            targets.includes(ex.id) ? { ...ex, folderId: folderId === "all" ? null : folderId } : ex
        );
        
        setExams(updatedExams);
        localStorage.setItem("eb_exams", JSON.stringify(updatedExams));

        for (const tid of targets) {
            try {
                const examRef = doc(db, "exams", tid);
                await setDoc(examRef, { folderId: folderId === "all" ? null : folderId }, { merge: true });
            } catch (e) {
                console.warn("Lỗi lưu thư mục vào DB", e);
            }
        }

        setIsMoveExamModalOpen(false);
        setExamToMove(null);
        if (isBulk) setSelectedExams([]);
        alert("Chuyển thư mục thành công!");
    };

    const handleDeleteFolder = async (folderId) => {
        if (!confirm("Bạn có chắc chắn muốn xóa thư mục này? Các đề thi bên trong sẽ được chuyển về 'Tất cả đề thi'.")) return;

        const updatedFolders = folders.filter(f => f.id !== folderId);
        setFolders(updatedFolders);
        localStorage.setItem("eb_folders", JSON.stringify(updatedFolders));

        if (activeFolder === folderId) {
            setActiveFolder("all");
        }

        const updatedExams = exams.map(ex => ex.folderId === folderId ? { ...ex, folderId: null } : ex);
        setExams(updatedExams);
        localStorage.setItem("eb_exams", JSON.stringify(updatedExams));

        try {
            await runWithTimeout(deleteDoc(doc(db, "folders", folderId)), 1500);
            const examsToUpdate = exams.filter(ex => ex.folderId === folderId);
            for (const ex of examsToUpdate) {
                await setDoc(doc(db, "exams", ex.id), { folderId: null }, { merge: true });
            }
        } catch (e) {
            console.warn("Lỗi Firestore khi xóa folder", e);
        }
    };

    const displayedExams = exams.filter(ex => activeFolder === "all" || ex.folderId === activeFolder);

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

    if (!mounted) {
        return (
            <div className="p-8 flex justify-center items-center h-96">
                <p className="text-sm text-muted-foreground animate-pulse">Đang tải danh sách đề thi...</p>
            </div>
        );
    }

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

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => setShowSettings(!showSettings)}
                        className={`font-bold rounded-xl h-10 border-border flex items-center gap-2 ${showSettings ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                        title="Tùy chọn cột thông tin muốn hiển thị"
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

            {/* Folders Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {folders.map(folder => (
                    <button
                        key={folder.id}
                        onClick={() => setActiveFolder(folder.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                            activeFolder === folder.id
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                        }`}
                    >
                        {activeFolder === folder.id ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                        {folder.name}
                        {folder.id === "all" && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                                activeFolder === folder.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                                {exams.length}
                            </span>
                        )}
                        {folder.id !== "all" && activeFolder === folder.id && (
                            <div 
                                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id) }} 
                                className="ml-1 text-primary-foreground/70 hover:text-red-300 transition-colors p-0.5 rounded"
                                title="Xóa thư mục này"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </button>
                ))}
                <button 
                    onClick={() => setIsCreateFolderModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all whitespace-nowrap bg-muted/20"
                >
                    <FolderPlus className="w-4 h-4" />
                    Thư mục mới
                </button>
            </div>

            {showSettings && (
                <div className="p-4 bg-muted/40 dark:bg-muted/10 border border-border rounded-2xl animate-in slide-in-from-top-3 duration-250 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            Cấu hình thông tin hiển thị
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-medium">Thay đổi được tự động lưu lại</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                        {[
                            { key: "id", label: "Mã đề thi" },
                            { key: "subject", label: "Môn học" },
                            { key: "grade", label: "Khối lớp" },
                            { key: "province", label: "Tỉnh thành" },
                            { key: "year", label: "Năm học" },
                            { key: "duration", label: "Thời lượng" },
                            { key: "total_questions", label: "Số câu hỏi" },
                            { key: "updatedAt", label: "Cập nhật" },
                        ].map((item) => {
                            const isChecked = displaySettings[item.key];
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => toggleSetting(item.key)}
                                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${isChecked
                                        ? "bg-primary/5 border-primary/30 text-primary font-bold"
                                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted/40"
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${isChecked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 bg-transparent"
                                        }`}>
                                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <span className="text-xs truncate">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bulk Actions Bar */}
            {selectedExams.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                        Đã chọn {selectedExams.length} đề thi
                    </span>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                                setExamToMove("BULK");
                                setIsMoveExamModalOpen(true);
                            }}
                            className="h-8 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800"
                        >
                            <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                            Chuyển
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleBulkDelete}
                            className="h-8 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Xóa
                        </Button>
                    </div>
                </div>
            )}

            {exams.length > 0 ? (
                <div className="space-y-4">

                    <div className="hidden lg:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center gap-4 px-6 py-4 border-b border-border/85 bg-slate-50/50 dark:bg-slate-900/35 text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                            <div className="w-4 shrink-0 flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={selectedExams.length > 0 && selectedExams.length === displayedExams.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                                />
                            </div>
                            {displaySettings.id && <div className="w-32 shrink-0">Mã Đề</div>}
                            <div className="flex-1 min-w-[200px]">Tên Đề Thi</div>
                            {displaySettings.subject && <div className="w-28 shrink-0">Môn Học</div>}
                            {displaySettings.grade && <div className="w-20 shrink-0">Khối Lớp</div>}
                            {displaySettings.province && <div className="w-28 shrink-0">Tỉnh Thành</div>}
                            {displaySettings.year && <div className="w-24 shrink-0">Năm Học</div>}
                            {displaySettings.duration && <div className="w-24 shrink-0">Thời Lượng</div>}
                            {displaySettings.total_questions && <div className="w-24 shrink-0 text-center">Câu Hỏi</div>}
                            {displaySettings.updatedAt && <div className="w-28 shrink-0 text-right">Ngày Cập Nhật</div>}
                            <div className="w-24 shrink-0 text-right">Tác vụ</div>
                        </div>

                        <div className="divide-y divide-border/60">
                            {displayedExams.map((ex) => (
                                <div
                                    key={ex.id}
                                    className={`flex items-center gap-4 px-6 py-4 transition-colors duration-150 ${selectedExams.includes(ex.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-muted/15 dark:hover:bg-muted/5'}`}
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

                                    <div className="flex-1 min-w-[200px]">
                                        <Link
                                            href={`/create-question?editId=${ex.id}`}
                                            className="text-sm font-black text-foreground hover:text-primary transition-colors line-clamp-1 leading-snug"
                                        >
                                            {ex.title}
                                        </Link>
                                    </div>

                                    {displaySettings.subject && (
                                        <div className="w-28 shrink-0">
                                            <span className="text-xs font-semibold text-foreground truncate block" title={ex.subject || "Toán học"}>
                                                {ex.subject || "Toán học"}
                                            </span>
                                        </div>
                                    )}

                                    {displaySettings.grade && (
                                        <div className="w-20 shrink-0">
                                            <span className="text-xs font-semibold text-foreground block">
                                                {ex.grade ? `Lớp ${ex.grade}` : "Cả cấp"}
                                            </span>
                                        </div>
                                    )}

                                    {displaySettings.province && (
                                        <div className="w-28 shrink-0">
                                            <span className="text-xs font-semibold text-foreground truncate block" title={ex.province || "Toàn quốc"}>
                                                {ex.province || "Toàn quốc"}
                                            </span>
                                        </div>
                                    )}

                                    {displaySettings.year && (
                                        <div className="w-24 shrink-0">
                                            <span className="text-xs font-semibold text-foreground block">
                                                {ex.year || "Không có"}
                                            </span>
                                        </div>
                                    )}

                                    {displaySettings.duration && (
                                        <div className="w-24 shrink-0">
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
                                        <div className="w-28 shrink-0 text-right">
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {new Date(ex.updatedAt).toLocaleDateString("vi-VN")}
                                            </span>
                                        </div>
                                    )}

                                    <div className="w-24 shrink-0 flex items-center justify-end gap-2">
                                        <Link href={`/create-question?editId=${ex.id}`}>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="w-8 h-8 rounded-lg border-border hover:bg-muted text-foreground flex items-center justify-center shrink-0"
                                                title="Chỉnh sửa đề thi"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                setExamToMove(ex);
                                                setIsMoveExamModalOpen(true);
                                            }}
                                            className="w-8 h-8 rounded-lg border-border hover:bg-muted text-foreground flex items-center justify-center shrink-0"
                                            title="Chuyển thư mục"
                                        >
                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleDeleteExam(ex.id, e)}
                                            className="w-8 h-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center shrink-0"
                                            title="Xóa đề thi"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
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
                                            <span className="font-medium">
                                                {ex.duration || 90} phút
                                            </span>
                                        )}
                                        {displaySettings.total_questions && (
                                            <span className="font-medium">
                                                {ex.total_questions || ex.questions?.length || 0} câu
                                            </span>
                                        )}
                                        {displaySettings.updatedAt && (
                                            <span className="font-medium">
                                                CN: {new Date(ex.updatedAt).toLocaleDateString("vi-VN")}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                        <Link href={`/create-question?editId=${ex.id}`}>
                                            <Button variant="outline" size="icon" className="w-7 h-7 rounded-lg border-border hover:bg-muted text-foreground flex items-center justify-center">
                                                <Edit3 className="w-3 h-3" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                setExamToMove(ex);
                                                setIsMoveExamModalOpen(true);
                                            }}
                                            className="w-7 h-7 rounded-lg border-border hover:bg-muted text-foreground flex items-center justify-center shrink-0"
                                            title="Chuyển thư mục"
                                        >
                                            <ArrowRightLeft className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleDeleteExam(ex.id, e)}
                                            className="w-7 h-7 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            ) : (
                <div className="bg-card border border-dashed border-border p-12 rounded-2xl text-center space-y-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Bạn chưa có đề thi nào!</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Nhấn nút dưới để bắt đầu soạn thảo đề thi đầu tiên cùng sự trợ giúp đắc lực của Trí tuệ nhân tạo.
                    </p>
                    <Link href="/create-question">
                        <Button className="mt-2 h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4 mr-2" />
                            Soạn thảo đề thi mới
                        </Button>
                    </Link>
                </div>
            )}
        {/* Modal Create Folder */}
        {isCreateFolderModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-4 border-b border-border/60">
                        <h3 className="font-bold text-foreground">Tạo thư mục mới</h3>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full" onClick={() => setIsCreateFolderModalOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <form onSubmit={handleCreateFolder} className="p-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Tên thư mục</label>
                            <Input 
                                autoFocus
                                placeholder="Nhập tên thư mục..." 
                                className="h-11 rounded-xl text-sm"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setIsCreateFolderModalOpen(false)}>
                                Hủy bỏ
                            </Button>
                            <Button type="submit" disabled={isCreatingFolder || !newFolderName.trim()} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold min-w-[100px]">
                                {isCreatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo mới"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Modal Move Exam */}
        {isMoveExamModalOpen && examToMove && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                    <div className="flex items-center justify-between p-4 border-b border-border/60">
                        <h3 className="font-bold text-foreground">Chuyển thư mục</h3>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full" onClick={() => setIsMoveExamModalOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="p-4 flex-1 overflow-hidden flex flex-col">
                        <p className="text-sm text-muted-foreground mb-3 shrink-0">
                            Đang chuyển: <strong className="text-foreground line-clamp-1 mt-1">{examToMove === "BULK" ? `${selectedExams.length} đề thi` : examToMove.title}</strong>
                        </p>
                        <div className="space-y-1.5 overflow-y-auto pr-1">
                            {folders.map(folder => {
                                const isCurrentFolder = examToMove !== "BULK" && ((examToMove.folderId === folder.id) || (folder.id === 'all' && !examToMove.folderId));
                                return (
                                <div 
                                    key={folder.id}
                                    onClick={() => handleMoveToFolder(folder.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        isCurrentFolder
                                            ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 font-bold" 
                                            : "border-border/50 hover:border-primary/40 hover:bg-muted text-foreground"
                                    }`}
                                >
                                    <Folder className="w-4 h-4" />
                                    <span className="text-sm truncate">{folder.name}</span>
                                    {isCurrentFolder && (
                                        <Check className="w-4 h-4 ml-auto shrink-0" />
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}
