/**
 * @file page.jsx
 * @description Trang "Ngân Hàng Câu Hỏi" - Hỗ trợ tra cứu, sắp xếp, lọc theo môn học, lớp học, độ khó
 * và hiển thị chi tiết câu hỏi (đáp án, lời giải mẫu, đáp số đúng cuối cùng).
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Trash2,
    Plus,
    HelpCircle,
    Info,
    MapPin,
    Bookmark,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LatexRenderer from "@/components/shared/LatexRenderer";
import { useAuth } from "@/context/AuthContext";

import { GRADE_SUBJECTS_MAP } from "@/lib/constants";
import useProvinces from "@/hooks/useProvinces";

const GRADES_OPTIONS = Object.keys(GRADE_SUBJECTS_MAP).map(g => ({
    value: g,
    label: g === "Đại học" ? "Đại học" : `Lớp ${g}`
}));
const SUBJECTS = Array.from(new Set(Object.values(GRADE_SUBJECTS_MAP).flat())).sort((a, b) => a.localeCompare(b, "vi"));

/**
 * Lấy cấu hình nhãn (Label) và mã lớp CSS tương ứng với từng mức độ phân loại câu hỏi (độ khó)
 * @param {string} difficulty - Mức độ độ khó (nhan_biet, thong_hieu, van_dung, van_dung_cao)
 * @returns {{label: string, className: string}} Cấu hình huy hiệu
 */
const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
        case "nhan_biet":
            return { label: "Nhận biết", className: "bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40" };
        case "thong_hieu":
            return { label: "Thông hiểu", className: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40" };
        case "van_dung":
            return { label: "Vận dụng", className: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40" };
        case "van_dung_cao":
            return { label: "Vận dụng cao", className: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40" };
        default:
            return { label: "Nhận biết", className: "bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40" };
    }
};

const INITIAL_QUESTIONS = [];

/**
 * Component chính của Trang Ngân Hàng Câu Hỏi.
 * Quản lý danh sách các câu hỏi, thực hiện bộ lọc nâng cao, thu gọn/mở rộng thẻ câu hỏi và xóa câu hỏi.
 */
export default function QuestionsPage() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const { provinces } = useProvinces();
    const [questions, setQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [examTitleSearch, setExamTitleSearch] = useState("");
    const [selectedGrade, setSelectedGrade] = useState("all");
    const [selectedSubject, setSelectedSubject] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedProvince, setSelectedProvince] = useState("all");
    const [selectedDifficulty, setSelectedDifficulty] = useState("all");

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedExams = localStorage.getItem("eb_exams");
            if (savedExams) {
                try {
                    const parsed = JSON.parse(savedExams);
                    const allQuestions = [];
                    parsed.forEach((exam) => {
                        if (Array.isArray(exam.questions)) {
                            exam.questions.forEach((q) => {
                                allQuestions.push({
                                    ...q,
                                    examTitle: exam.title,
                                    province: exam.province,
                                    grade: exam.grade,
                                    subject: exam.subject,
                                    isCollapsed: true,
                                    typeName: q.type === "multiple_choice" ? "Trắc nghiệm Đơn"
                                        : q.type === "group_multiple_choice" ? "Trắc nghiệm Nhóm"
                                            : q.type === "true_false" ? "Đúng / Sai Đơn"
                                                : q.type === "group_true_false" ? "Đúng / Sai Nhóm"
                                                    : q.type === "essay" ? "Tự luận Đơn" : "Tự luận Nhóm",
                                    typeClass: q.type?.includes("multiple_choice")
                                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                        : q.type?.includes("true_false")
                                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                                });
                            });
                        }
                    });
                    setQuestions(allQuestions);
                } catch (e) {
                    console.error("Lỗi load questions:", e);
                }
            }
        }
    }, []);

    if (loading || !currentUser) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const toggleCollapse = (id) => {
        setQuestions(
            questions.map((q) => (q.id === id ? { ...q, isCollapsed: !q.isCollapsed } : q))
        );
    };

    const handleDelete = (id) => {
        if (confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng câu hỏi và đề thi tương ứng?")) {
            setQuestions(questions.filter((q) => q.id !== id));
            const savedExams = localStorage.getItem("eb_exams");
            if (savedExams) {
                try {
                    const examsList = JSON.parse(savedExams);
                    const updatedExams = examsList.map((exam) => {
                        if (Array.isArray(exam.questions)) {
                            const newQuestions = exam.questions.filter((q) => q.id !== id);
                            return {
                                ...exam,
                                questions: newQuestions,
                                total_questions: newQuestions.length
                            };
                        }
                        return exam;
                    });
                    localStorage.setItem("eb_exams", JSON.stringify(updatedExams));
                } catch (e) {
                    console.error("Lỗi xóa câu hỏi trong localStorage:", e);
                }
            }
        }
    };

    const filteredQuestions = questions.filter((q) => {
        const matchesSearch =
            q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.number_label.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = selectedGrade && selectedGrade !== "all" ? q.grade === selectedGrade : true;
        const matchesSubject = selectedSubject && selectedSubject !== "all" ? q.subject === selectedSubject : true;
        const matchesType = selectedType && selectedType !== "all" ? q.type === selectedType : true;
        const matchesExamTitle = examTitleSearch
            ? (q.examTitle || "").toLowerCase().includes(examTitleSearch.toLowerCase())
            : true;
        const matchesProvince = selectedProvince && selectedProvince !== "all" ? q.province === selectedProvince : true;
        const matchesDifficulty = selectedDifficulty && selectedDifficulty !== "all"
            ? (q.difficulty === selectedDifficulty || (Array.isArray(q.subQuestions) && q.subQuestions.some(sub => sub.difficulty === selectedDifficulty)))
            : true;

        return matchesSearch && matchesGrade && matchesSubject && matchesType && matchesExamTitle && matchesProvince && matchesDifficulty;
    });

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-primary rounded-full animate-pulse" />
                        Ngân Hàng Câu Hỏi
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">Tra cứu, sắp xếp và phân loại ngân hàng câu hỏi đề thi</p>
                </div>
                <Link href="/create-question">
                    <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md shadow-primary/10 rounded-xl flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Soạn câu hỏi mới
                    </Button>
                </Link>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Filter className="w-4 h-4 text-primary" />
                    <span>Bộ lọc nâng cao</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo nội dung..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 border-border bg-background"
                        />
                    </div>

                    <div className="relative">
                        <Bookmark className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo tên đề thi..."
                            value={examTitleSearch}
                            onChange={(e) => setExamTitleSearch(e.target.value)}
                            className="pl-9 h-10 border-border bg-background"
                        />
                    </div>

                    <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <span className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Tất cả tỉnh thành" />
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả tỉnh thành</SelectItem>
                            {provinces.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Tất cả lớp học" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả lớp học</SelectItem>
                            {GRADES_OPTIONS.map((g) => (
                                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Tất cả môn học" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả môn học</SelectItem>
                            {SUBJECTS.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Tất cả dạng câu hỏi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả dạng câu hỏi</SelectItem>
                            <SelectItem value="multiple_choice">Trắc nghiệm Đơn</SelectItem>
                            <SelectItem value="group_multiple_choice">Trắc nghiệm Nhóm</SelectItem>
                            <SelectItem value="true_false">Đúng / Sai Đơn</SelectItem>
                            <SelectItem value="essay">Tự luận Đơn</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Tất cả mức độ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả mức độ</SelectItem>
                            <SelectItem value="nhan_biet">Nhận biết</SelectItem>
                            <SelectItem value="thong_hieu">Thông hiểu</SelectItem>
                            <SelectItem value="van_dung">Vận dụng</SelectItem>
                            <SelectItem value="van_dung_cao">Vận dụng cao</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
                {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q) => {
                        const isGroup = q.type.startsWith("group_");
                        return (
                            <div key={q.id} className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                                <div className="flex justify-between items-center bg-muted/60 px-4 py-3 border-b border-border/60">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${q.typeClass}`}>
                                            {q.typeName}
                                        </span>
                                        {q.difficulty && (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getDifficultyBadge(q.difficulty).className}`}>
                                                {getDifficultyBadge(q.difficulty).label}
                                            </span>
                                        )}
                                        <span className="font-bold text-sm text-foreground truncate">{q.number_label}</span>
                                        <span className="text-[10px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-850/30 shrink-0 font-bold shadow-sm">
                                            {q.subject}
                                        </span>
                                        <span className="text-[10px] text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-0.5 rounded-full border border-violet-200/50 dark:border-violet-850/30 shrink-0 font-medium shadow-sm">
                                            {q.grade === "Đại học" ? "Đại học" : `Lớp ${q.grade}`}
                                        </span>
                                        {q.province && (
                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200/50 shrink-0 font-medium">
                                                {q.province}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-4">
                                        <span className="text-xs font-bold text-primary mr-2">
                                            {q.points} điểm
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleCollapse(q.id)}
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        >
                                            {q.isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(q.id)}
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {!q.isCollapsed && (
                                    <div className="p-4 sm:p-5 space-y-4">
                                        {q.examTitle && (
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 bg-muted/30 p-2 rounded-lg w-fit border border-border/50">
                                                <Bookmark className="w-3 h-3 text-primary" />
                                                Nguồn đề: {q.examTitle}
                                            </div>
                                        )}

                                        <div className="text-sm font-medium text-foreground leading-relaxed">
                                            <LatexRenderer text={q.content} />
                                        </div>

                                        {q.type?.includes("multiple_choice") && q.options && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                {q.options.map((opt, optIndex) => {
                                                    const isCorrect = String.fromCharCode(65 + optIndex) === q.correct_answer;
                                                    return (
                                                        <div
                                                            key={optIndex}
                                                            className={`p-3 rounded-xl border text-xs font-medium ${isCorrect
                                                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold"
                                                                : "border-border bg-background"
                                                                }`}
                                                        >
                                                            <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIndex)}.</span>
                                                            <LatexRenderer text={opt} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {q.type?.includes("true_false") && q.statements && (
                                            <div className="space-y-2 mt-2">
                                                {q.statements.map((st, i) => (
                                                    <div key={i} className="flex justify-between items-center p-2.5 rounded-xl border border-border bg-background text-xs">
                                                        <span className="font-medium">
                                                            <LatexRenderer text={st.text} />
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${st.result === "Đ" || st.correct === true
                                                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                                            : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                                                            }`}>
                                                            {st.result === "Đ" || st.correct === true ? "Đúng" : "Sai"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {isGroup && q.subQuestions && (
                                            <div className="space-y-4 border-l-2 border-primary/20 pl-4 mt-4">
                                                <p className="text-xs font-bold text-primary uppercase tracking-wider select-none">Các câu con của nhóm:</p>
                                                {q.subQuestions.map((subQ) => (
                                                    <div key={subQ.id} className="bg-muted/40 p-3.5 rounded-xl border border-border space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-foreground">{subQ.number_label}</span>
                                                                {subQ.difficulty && (
                                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getDifficultyBadge(subQ.difficulty).className}`}>
                                                                        {getDifficultyBadge(subQ.difficulty).label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-muted-foreground">{subQ.points} điểm</span>
                                                        </div>
                                                        <div className="text-xs font-medium text-foreground">
                                                            <LatexRenderer text={subQ.content} />
                                                        </div>
                                                        {subQ.type?.includes("multiple_choice") && subQ.options && (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                                {subQ.options.map((opt, optIndex) => {
                                                                    const isCorrect = String.fromCharCode(65 + optIndex) === subQ.correct_answer;
                                                                    return (
                                                                        <div key={optIndex} className={`p-2 rounded-lg border text-[11px] ${isCorrect
                                                                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold"
                                                                            : "border-border bg-background"
                                                                            }`}>
                                                                            <span className="font-bold mr-1">{String.fromCharCode(65 + optIndex)}.</span>
                                                                            <LatexRenderer text={opt} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {subQ.type?.includes("true_false") && subQ.statements && (
                                                            <div className="space-y-1.5 mt-1.5">
                                                                {subQ.statements.map((st, i) => (
                                                                    <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-border bg-background text-[11px]">
                                                                        <span className="font-medium">
                                                                            <LatexRenderer text={st.text} />
                                                                        </span>
                                                                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px] ${st.result === "Đ" || st.correct === true
                                                                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                                                            : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                                                                            }`}>
                                                                            {st.result === "Đ" || st.correct === true ? "Đúng" : "Sai"}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {(subQ.final_answer || subQ.suggested_solution || (subQ.solution_images && subQ.solution_images.length > 0)) && (
                                                            <div className="p-3 rounded-xl bg-slate-50/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-800/30 space-y-2.5 mt-2">
                                                                {subQ.final_answer && (
                                                                    <div className="text-[11px]">
                                                                        <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1 select-none">🎯 Kết quả / Đáp số đúng:</span>
                                                                        <div className="p-2 rounded-lg border border-blue-200 bg-blue-50/20 dark:border-blue-900/30 dark:bg-blue-950/5 text-foreground font-semibold">
                                                                            <LatexRenderer text={subQ.final_answer} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {subQ.suggested_solution && (
                                                                    <div className="text-[11px] text-muted-foreground">
                                                                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1 select-none">💡 Lời giải mẫu chi tiết:</span>
                                                                        <div className="leading-relaxed">
                                                                            <LatexRenderer text={subQ.suggested_solution} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {subQ.solution_images && subQ.solution_images.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        <span className="text-[9px] font-bold text-muted-foreground block select-none">Hình ảnh lời giải:</span>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {subQ.solution_images.map((img, idx) => (
                                                                                <img
                                                                                    key={idx}
                                                                                    src={img}
                                                                                    alt={`Ảnh lời giải con ${idx + 1}`}
                                                                                    className="h-16 w-auto rounded border border-border/60 object-contain bg-background"
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {(q.final_answer || q.suggested_solution || (q.solution_images && q.solution_images.length > 0)) && (
                                            <div className="mt-4 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/40 space-y-3">
                                                {q.final_answer && (
                                                    <div className="text-xs">
                                                        <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1 select-none">Kết quả / Đáp số đúng:</span>
                                                        <div className="p-2.5 rounded-xl border border-blue-250 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/10 text-foreground font-semibold">
                                                            <LatexRenderer text={q.final_answer} />
                                                        </div>
                                                    </div>
                                                )}
                                                {q.suggested_solution && (
                                                    <div className="text-xs text-muted-foreground">
                                                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1 select-none">Lời giải mẫu chi tiết:</span>
                                                        <div className="leading-relaxed">
                                                            <LatexRenderer text={q.suggested_solution} />
                                                        </div>
                                                    </div>
                                                )}
                                                {q.solution_images && q.solution_images.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <span className="text-[10px] font-bold text-muted-foreground block select-none">Hình ảnh lời giải:</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {q.solution_images.map((img, idx) => (
                                                                <img
                                                                    key={idx}
                                                                    src={img}
                                                                    alt={`Ảnh lời giải ${idx + 1}`}
                                                                    className="h-20 w-auto rounded-lg border border-border/80 object-contain bg-background"
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-card border border-dashed border-border p-12 rounded-2xl text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-foreground">Không tìm thấy câu hỏi nào phù hợp!</p>
                        <p className="text-xs text-muted-foreground">Vui lòng điều chỉnh lại bộ lọc hoặc nhập nội dung tìm kiếm khác.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
