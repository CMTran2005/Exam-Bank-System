"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, FileText, Play, ArrowRight, BookOpen, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useExams } from "@/hooks/teacher/useExams";

export default function LiveQuizSelectionPage() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const { exams, mounted } = useExams(currentUser);

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

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-6 rounded-3xl shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <Gamepad2 className="w-8 h-8 text-primary" />
                        Đấu Trường Live Quiz
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Chọn một đề thi từ thư viện của bạn dưới đây để bắt đầu tạo phòng đấu trực tiếp cho cả lớp.
                    </p>
                </div>
            </div>

            {/* Exam Grid */}
            {exams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map((ex) => (
                        <Card 
                            key={ex.id}
                            className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between space-y-4 relative group"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/40 font-mono">
                                        ID: {ex.id.substring(0, 8)}
                                    </span>
                                    {ex.subject && (
                                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200/40">
                                            {ex.subject}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-base font-black text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                    {ex.title}
                                </h3>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium pt-1">
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5" />
                                        {ex.total_questions || ex.questions?.length || 0} câu hỏi
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        {ex.duration || 45} phút
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">
                                    Sửa: {new Date(ex.updatedAt).toLocaleDateString("vi-VN")}
                                </span>

                                <Link href={`/my-exams/live/${ex.id}`}>
                                    <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md shadow-primary/10 rounded-xl h-10 px-4 flex items-center gap-2 text-xs">
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        Tổ chức Live
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="bg-card border border-dashed border-border p-12 rounded-2xl text-center space-y-4 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <Gamepad2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Bạn chưa có đề thi nào!</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Bạn cần có ít nhất một đề thi có câu hỏi trong thư viện để tổ chức đấu trường Live Quiz.
                    </p>
                    <Link href="/create-question">
                        <Button className="mt-2 h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground">
                            <Plus className="w-4 h-4 mr-2" /> Soạn thảo đề thi mới
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
