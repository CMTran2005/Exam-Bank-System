"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Loader2, BookOpen, Clock, Search, FileText, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

export default function PracticePage() {
    const { currentUser, loading: authLoading } = useAuth();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!authLoading && currentUser) {
            fetchPublicExams();
        }
    }, [currentUser, authLoading]);

    const fetchPublicExams = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "exams"), where("isPublic", "==", true));
            const querySnapshot = await getDocs(q);
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            // Sort client-side by date if no index
            list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
            setExams(list);
        } catch (error) {
            console.error("Lỗi khi tải đề luyện thi:", error);
            toast.error("Không thể tải danh sách đề thi.");
        } finally {
            setLoading(false);
        }
    };

    const filteredExams = exams.filter(ex => 
        ex.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ex.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading || (!currentUser && loading)) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <BookOpen className="w-7 h-7 text-primary" /> Luyện Thi
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Kho đề thi mở giúp bạn tự luyện tập và đánh giá năng lực của bản thân.
                    </p>
                </div>

                <div className="w-full md:w-auto flex items-center">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm đề thi, môn học..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-11 rounded-xl bg-background/50 focus-visible:ring-primary border-border"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-44 bg-card rounded-2xl animate-pulse border border-border"></div>
                        ))}
                    </div>
                ) : filteredExams.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Chưa có đề thi nào</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Hiện tại chưa có đề thi nào được chia sẻ công khai hoặc không có kết quả phù hợp với tìm kiếm của bạn.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredExams.map((ex) => (
                            <div key={ex.id} className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden">
                                <div className="p-5 flex-1 flex flex-col relative z-0">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-1 rounded-md shadow-sm">
                                            {ex.subject || "Toán học"}
                                        </span>
                                        {ex.grade && (
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-1 rounded-md shadow-sm">
                                                Lớp {ex.grade}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-3 pr-4">
                                        {ex.title}
                                    </h3>
                                    
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-auto text-xs text-muted-foreground font-medium">
                                        <div className="flex items-center">
                                            <Clock className="w-3.5 h-3.5 mr-1" />
                                            {ex.duration || 90} phút
                                        </div>
                                        <div className="flex items-center">
                                            <FileText className="w-3.5 h-3.5 mr-1" />
                                            {ex.total_questions || ex.questions?.length || 0} câu
                                        </div>
                                    </div>
                                    
                                    <div className="mt-5 pt-4 border-t border-border/50">
                                        <Link href={`/student/exam/${ex.id}`}>
                                            <Button className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold rounded-xl transition-colors">
                                                <Play className="w-4 h-4 mr-2" /> Bắt đầu làm bài
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
