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
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Hàm tiện ích giới hạn thời gian chờ của một tác vụ Promise (tránh bị treo do mạng/DB chưa cấu hình)
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
        if (confirm("Bạn có chắc chắn muốn xóa đề thi này không? Hành động này không thể hoàn tác.")) {
            const updated = exams.filter((ex) => ex.id !== id);
            setExams(updated);
            localStorage.setItem("eb_exams", JSON.stringify(updated));

            // Xóa khỏi Firestore
            try {
                const examDocRef = doc(db, "exams", id);
                await runWithTimeout(deleteDoc(examDocRef), 1200);
            } catch (err) {
                console.warn("Bỏ qua lỗi Firestore khi xóa đề thi:", err.message);
            }
        }
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

            {exams.length > 0 ? (
                <div className="space-y-4">

                    <div className="hidden lg:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center gap-4 px-6 py-4 border-b border-border/85 bg-slate-50/50 dark:bg-slate-900/35 text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                            {displaySettings.id && <div className="w-24 shrink-0">Mã Đề</div>}
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
                            {exams.map((ex) => (
                                <div
                                    key={ex.id}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/15 dark:hover:bg-muted/5 transition-colors duration-150"
                                >
                                    {displaySettings.id && (
                                        <div className="w-24 shrink-0">
                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/40 font-mono block truncate" title={ex.id}>
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
                        {exams.map((ex) => (
                            <div
                                key={ex.id}
                                className="bg-card border border-border rounded-2xl p-4.5 shadow-sm hover:shadow hover:border-primary/30 transition-all duration-200 flex flex-col justify-between space-y-3.5"
                            >
                                <div className="space-y-2.5">
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
                    <Link href="/create-question" className="inline-block pt-2">
                        <Button size="sm" className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl px-5 h-9">
                            Soạn đề thi ngay
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
