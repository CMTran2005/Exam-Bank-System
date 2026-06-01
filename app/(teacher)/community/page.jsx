"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { examService } from "@/services/examService";
import { toast } from "sonner";
import { Loader2, Globe, Search, Copy, BookOpen, Clock, Users, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/context/ConfirmContext";
import useSubjects from "@/hooks/shared/useSubjects";

/**
 * Component CommunityPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function CommunityPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const confirmDialog = useConfirm();
    
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [filterGrade, setFilterGrade] = useState("all");
    const [filterSubject, setFilterSubject] = useState("all");
    const [forkingId, setForkingId] = useState(null);

    const { gradeSubjectsMap } = useSubjects();
    const GRADES = Object.keys(gradeSubjectsMap);

    useEffect(() => {
        if (currentUser) {
            loadCommunityExams();
        }
    }, [currentUser]);

    const loadCommunityExams = async () => {
        setLoading(true);
        try {
            const data = await examService.getSharedExams(currentUser.uid, 50);
            setExams(data);
        } catch (error) {
            console.error("Lỗi tải danh sách cộng đồng:", error);
            toast.error("Không thể tải danh sách đề thi cộng đồng");
        } finally {
            setLoading(false);
        }
    };

    const handleFork = async (exam) => {
        const isConfirmed = await confirmDialog({
            title: "Nhân bản đề thi",
            message: `Bạn có chắc chắn muốn nhân bản đề thi "${exam.title}" về tài khoản của mình không?`,
            confirmText: "Nhân bản",
            cancelText: "Hủy",
            type: "info"
        });

        if (!isConfirmed) return;

        setForkingId(exam.id);
        try {
            const newExamId = await examService.forkExam(exam.id, currentUser.uid, currentUser.name);
            toast.success("Nhân bản thành công!");
            router.push(`/create-question?editId=${newExamId}`);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi nhân bản: " + error.message);
        } finally {
            setForkingId(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    let filteredExams = exams.filter(ex => 
        (ex.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         ex.subject?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filterGrade === "all" || ex.grade === filterGrade) &&
        (filterSubject === "all" || ex.subject === filterSubject)
    );

    // Xử lý Sort
    filteredExams = [...filteredExams].sort((a, b) => {
        if (sortOption === "newest") {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        } else if (sortOption === "oldest") {
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
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

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Globe className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2 tracking-tight mb-2">
                            Thư viện Cộng đồng
                        </h1>
                        <p className="text-muted-foreground font-medium max-w-xl">
                            Khám phá và nhân bản hàng ngàn đề thi chất lượng cao được chia sẻ bởi các giáo viên trên toàn quốc.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search, Filter and Sort */}
            <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="flex items-center bg-card border border-border p-2 rounded-2xl shadow-sm flex-1 w-full lg:max-w-sm">
                    <Search className="w-5 h-5 text-muted-foreground ml-3 mr-2" />
                    <Input 
                        placeholder="Tìm theo tên hoặc môn học..." 
                        className="border-0 focus-visible:ring-0 bg-transparent shadow-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
                    {/* Lọc khối lớp */}
                    <Select value={filterGrade} onValueChange={(val) => { setFilterGrade(val); setFilterSubject("all"); }}>
                        <SelectTrigger className="h-12 sm:h-[52px] rounded-2xl bg-card border-border shadow-sm font-semibold hover:bg-muted/50 transition-colors focus:ring-1 focus:ring-primary px-4 flex-1 sm:w-[140px] [&>svg]:hidden">
                            <span className="text-sm line-clamp-1">
                                {filterGrade === "all" ? "Tất cả khối lớp" : (filterGrade === "Đại học" ? "Đại học" : `Khối ${filterGrade}`)}
                            </span>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-lg border-border font-medium max-h-60">
                            <SelectItem value="all" className="cursor-pointer">Tất cả khối lớp</SelectItem>
                            {GRADES.map(g => (
                                <SelectItem key={g} value={g} className="cursor-pointer">
                                    {g === "Đại học" ? "Đại học" : `Khối ${g}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Lọc môn học */}
                    <Select value={filterSubject} onValueChange={setFilterSubject} disabled={filterGrade === "all"}>
                        <SelectTrigger className="h-12 sm:h-[52px] rounded-2xl bg-card border-border shadow-sm font-semibold hover:bg-muted/50 transition-colors focus:ring-1 focus:ring-primary px-4 flex-1 sm:w-[160px] [&>svg]:hidden">
                            <span className="text-sm line-clamp-1">
                                {filterSubject === "all" ? "Tất cả môn học" : filterSubject}
                            </span>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-lg border-border font-medium max-h-60">
                            <SelectItem value="all" className="cursor-pointer">Tất cả môn học</SelectItem>
                            {(gradeSubjectsMap[filterGrade] || []).map(sub => (
                                <SelectItem key={sub} value={sub} className="cursor-pointer">
                                    {sub}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sắp xếp */}
                    <Select value={sortOption} onValueChange={setSortOption}>
                        <SelectTrigger className="h-12 sm:h-[52px] rounded-2xl bg-card border-border shadow-sm font-semibold hover:bg-muted/50 transition-colors focus:ring-1 focus:ring-primary px-4 flex-1 sm:w-[200px] [&>svg]:hidden">
                            <div className="flex items-center gap-2">
                                <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-sm line-clamp-1"><SelectValue placeholder="Sắp xếp" /></span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-lg border-border font-medium">
                            <SelectItem value="newest" className="cursor-pointer">Mới nhất</SelectItem>
                            <SelectItem value="oldest" className="cursor-pointer">Cũ nhất</SelectItem>
                            <SelectItem value="title_asc" className="cursor-pointer">Tên: A - Z</SelectItem>
                            <SelectItem value="title_desc" className="cursor-pointer">Tên: Z - A</SelectItem>
                            <SelectItem value="questions_desc" className="cursor-pointer">Nhiều câu hỏi nhất</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* List */}
            {filteredExams.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border rounded-3xl border-dashed">
                    <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground">Chưa có đề thi nào</h3>
                    <p className="text-muted-foreground mt-1">Hãy thử tìm kiếm từ khóa khác hoặc quay lại sau.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((ex) => (
                        <div key={ex.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
                            <div className="flex-1">
                                <h3 className="font-bold text-foreground line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors">
                                    {ex.title}
                                </h3>
                                <div className="space-y-2 mt-4 text-sm text-muted-foreground font-medium">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 shrink-0" /> {ex.subject || "Toán học"} - Lớp {ex.grade || "12"}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 shrink-0" /> {ex.duration || 90} phút - {ex.questions?.length || 0} câu hỏi
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 shrink-0" /> Tác giả: <span className="font-semibold text-foreground truncate">{ex.author || "Giáo viên"}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-border/60">
                                <Button 
                                    onClick={() => handleFork(ex)}
                                    disabled={forkingId === ex.id}
                                    className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 font-bold gap-2"
                                >
                                    {forkingId === ex.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                    Nhân bản (Clone)
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
