"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    FileText,
    Plus,
    Trash2,
    Edit3,
    Calendar,
    Clock,
    MapPin,
    GraduationCap,
    BookOpen,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SAMPLE_EXAMS = [
    {
        id: "sample-1",
        title: "Đề thi khảo sát chất lượng giữa Học Kỳ II - Toán học 12",
        year: "2024-2025",
        grade: "12",
        subject: "Toán học",
        province: "Hà Nội",
        duration: 90,
        total_questions: 4,
        updatedAt: new Date().toISOString(),
        questions: [
            {
                id: "q1",
                type: "multiple_choice",
                number_label: "Câu 1",
                content: "Cho hàm số $f(x) = x^3 - 3x^2 + 2$. Giá trị cực đại $y_{\\text{CĐ}}$ của hàm số đã cho bằng bao nhiêu?",
                points: "1.0",
                options: ["A. y = 2", "B. y = 0", "C. y = 4", "D. y = -2"],
                correct_answer: "A",
                suggested_solution: "Ta có $f'(x) = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Cực đại tại $x = 0$ có $y = 2$."
            }
        ]
    }
];

export default function MyExamsPage() {
    const [exams, setExams] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("eb_exams");
            if (saved) {
                setExams(JSON.parse(saved));
            } else {
                // Prepopulate with a beautiful sample so it doesn't look empty
                localStorage.setItem("eb_exams", JSON.stringify(SAMPLE_EXAMS));
                setExams(SAMPLE_EXAMS);
            }
        }
    }, []);

    const handleDeleteExam = (id, e) => {
        e.preventDefault();
        if (confirm("Bạn có chắc chắn muốn xóa đề thi này không? Hành động này không thể hoàn tác.")) {
            const updated = exams.filter((ex) => ex.id !== id);
            setExams(updated);
            localStorage.setItem("eb_exams", JSON.stringify(updated));
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
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-primary rounded-full animate-pulse" />
                        Đề Thi Của Tôi
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Quản lý, chỉnh sửa hoặc xóa các đề thi bạn đã biên soạn ({exams.length} đề thi)
                    </p>
                </div>
                <Link href="/create-question">
                    <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md shadow-primary/10 rounded-xl flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Soạn đề thi mới
                    </Button>
                </Link>
            </div>

            {/* List block */}
            {exams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {exams.map((ex) => (
                        <div
                            key={ex.id}
                            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                {/* Title header */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/40 font-mono">
                                            ID: {ex.id.toString().slice(-6)}
                                        </span>
                                        {ex.year && (
                                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/40">
                                                Năm {ex.year}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-base font-black text-foreground line-clamp-2 leading-snug">
                                        {ex.title}
                                    </h3>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border border-border/40">
                                        <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span className="truncate font-semibold text-foreground">
                                            Môn: {ex.subject || "Toán học"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border border-border/40">
                                        <GraduationCap className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                                        <span className="truncate font-semibold text-foreground">
                                            Khối: {ex.grade ? `Khối ${ex.grade}` : "Cả cấp"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border border-border/40">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span className="truncate font-semibold text-foreground">
                                            Tỉnh: {ex.province || "Toàn quốc"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border border-border/40">
                                        <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                        <span className="truncate font-semibold text-foreground">
                                            Thời gian: {ex.duration || 90} phút
                                        </span>
                                    </div>
                                </div>

                                {/* Summary details */}
                                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                                        Cập nhật: {new Date(ex.updatedAt).toLocaleDateString("vi-VN")}
                                    </span>
                                    <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        {ex.total_questions || ex.questions?.length || 0} câu hỏi
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-5 pt-3 border-t border-border flex items-center justify-end gap-2.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleDeleteExam(ex.id, e)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl h-9 text-xs font-semibold px-3"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    Xóa đề
                                </Button>
                                <Link href={`/create-question?editId=${ex.id}`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-border hover:bg-muted text-foreground rounded-xl h-9 text-xs font-bold px-4"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                                        Chỉnh sửa đề
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
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
