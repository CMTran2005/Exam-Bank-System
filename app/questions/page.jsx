"use client";

import { useState } from "react";
import Link from "next/link";
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
    Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LatexRenderer from "@/components/shared/LatexRenderer";

const PROVINCES = [
    "Toàn quốc", "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng",
    "Cần Thơ", "Nghệ An", "Thừa Thiên Huế", "Quảng Nam", "Bình Dương",
];

const GRADES = ["Lớp 10", "Lớp 11", "Lớp 12", "Đại học"];
const SUBJECTS = ["Toán học", "Vật lý", "Hóa học", "Tiếng Anh", "Sinh học", "Ngữ văn", "Tin học"];

// Prepopulated beautiful mock questions with examTitle, province, and LaTeX formulas
const INITIAL_QUESTIONS = [
    {
        id: "q1",
        type: "multiple_choice",
        typeName: "Trắc nghiệm Đơn",
        typeClass: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
        number_label: "Câu 1. Đạo hàm",
        content: "Cho hàm số $f(x) = x^3 - 3x^2 + 2$. Giá trị cực đại $y_{\\text{CĐ}}$ của hàm số đã cho bằng bao nhiêu?",
        points: "1.0",
        grade: "Lớp 12",
        subject: "Toán học",
        examTitle: "Đề thi thử THPT Quốc Gia môn Toán 2025",
        province: "Hà Nội",
        options: [
            "A. y = 2",
            "B. y = 0",
            "C. y = 4",
            "D. y = -2"
        ],
        correct_answer: "A",
        suggested_solution: "Giải chi tiết:\nTa có $f'(x) = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$.\nBảng biến thiên cho thấy hàm số đạt cực đại tại $x = 0$, giá trị cực đại tương ứng $y_{\\text{CĐ}} = f(0) = 2$. Chọn A.",
        isCollapsed: true
    },
    {
        id: "q2",
        type: "group_multiple_choice",
        typeName: "Trắc nghiệm Nhóm",
        typeClass: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700",
        number_label: "Phần I. Đọc hiểu Tiếng Anh",
        content: "Read the following passage and answer the questions below:\n\nArtificial Intelligence (AI) is transforming every sector, from education to healthcare. The integration of neural networks has allowed computers to perform cognitive functions similar to human brains.",
        points: "2.0",
        grade: "Lớp 11",
        subject: "Tiếng Anh",
        examTitle: "Khảo sát chất lượng Tiếng Anh Học Kỳ I",
        province: "TP. Hồ Chí Minh",
        isCollapsed: true,
        subQuestions: [
            {
                id: "sq2_1",
                number_label: "Câu con 1",
                content: "According to the passage, AI is NOT transforming which sector?",
                points: "1.0",
                options: [
                    "A. Education",
                    "B. Healthcare",
                    "C. Space travel",
                    "D. Not mentioned in the passage"
                ],
                correct_answer: "C",
                suggested_solution: "Passage mentions 'from education to healthcare', space travel is not mentioned as currently transforming. Select C."
            },
            {
                id: "sq2_2",
                number_label: "Câu con 2",
                content: "What technology allows computers to perform cognitive human-like functions?",
                points: "1.0",
                options: [
                    "A. Relational Databases",
                    "B. Neural Networks",
                    "C. Simple Algorithms",
                    "D. Blockchain"
                ],
                correct_answer: "B",
                suggested_solution: "Passage state: 'The integration of neural networks has allowed computers...' Select B."
            }
        ]
    },
    {
        id: "q3",
        type: "true_false",
        typeName: "Đúng / Sai Đơn",
        typeClass: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
        number_label: "Câu 3. Cơ học",
        content: "Xét một vật rơi tự do không vận tốc đầu trong trọng trường gần mặt đất.",
        points: "1.5",
        grade: "Lớp 10",
        subject: "Vật lý",
        examTitle: "Đề cương kiểm tra giữa học kỳ 1 Vật Lý 10",
        province: "Đà Nẵng",
        isCollapsed: true,
        statements: [
            { text: "a) Quãng đường rơi tự do tỉ lệ thuận với thời gian rơi $t$.", result: "S" },
            { text: "b) Vận tốc rơi tỉ lệ thuận với thời gian rơi $t$.", result: "Đ" },
            { text: "c) Gia tốc rơi tăng dần theo thời gian.", result: "S" }
        ],
        suggested_solution: "a) Sai vì quãng đường rơi tự do $S = \\frac{1}{2}gt^2$ (tỉ lệ thuận với bình phương thời gian rơi $t^2$).\nb) Đúng vì vận tốc rơi tự do $v = gt$.\nc) Sai vì trong rơi tự do (bỏ qua sức cản không khí) gia tốc trọng trường $g$ là hằng số không đổi."
    },
    {
        id: "q4",
        type: "essay",
        typeName: "Tự luận Đơn",
        typeClass: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
        number_label: "Câu 4. Điện hóa",
        content: "Viết phương trình hóa học và giải thích hiện tượng khi nhúng thanh kẽm ($\\text{Zn}$) vào dung dịch $\\text{CuSO}_4$ loãng.",
        points: "1.0",
        grade: "Lớp 12",
        subject: "Hóa học",
        examTitle: "Kiểm tra định kỳ Hóa học 12",
        province: "Toàn quốc",
        isCollapsed: true,
        suggested_solution: "Phương trình hóa học phản ứng:\n$$\\text{Zn} + \\text{CuSO}_4 \\rightarrow \\text{ZnSO}_4 + \\text{Cu}$$\n\nHiện tượng xảy ra:\nThanh kẽm bị ăn mòn dần, xuất hiện lớp chất rắn màu đỏ (đồng kim loại $\\text{Cu}$) bám vào bề mặt thanh kẽm, đồng thời màu xanh lam đặc trưng của dung dịch kẽm $\\text{CuSO}_4$ nhạt màu dần."
    }
];

export default function QuestionsPage() {
    const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
    const [searchTerm, setSearchTerm] = useState("");
    const [examTitleSearch, setExamTitleSearch] = useState("");
    const [selectedGrade, setSelectedGrade] = useState("all");
    const [selectedSubject, setSelectedSubject] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedProvince, setSelectedProvince] = useState("all");

    const toggleCollapse = (id) => {
        setQuestions(
            questions.map((q) => (q.id === id ? { ...q, isCollapsed: !q.isCollapsed } : q))
        );
    };

    const handleDelete = (id) => {
        if (confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?")) {
            setQuestions(questions.filter((q) => q.id !== id));
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

        return matchesSearch && matchesGrade && matchesSubject && matchesType && matchesExamTitle && matchesProvince;
    });

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header section */}
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

            {/* Premium Filter Panel */}
            <div className="bg-card border border-border shadow-sm rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Filter className="w-4 h-4 text-primary" />
                    <span>Bộ lọc nâng cao</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Content search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo nội dung..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 border-border bg-background"
                        />
                    </div>

                    {/* Exam Title search */}
                    <div className="relative">
                        <Bookmark className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo tên đề thi..."
                            value={examTitleSearch}
                            onChange={(e) => setExamTitleSearch(e.target.value)}
                            className="pl-9 h-10 border-border bg-background"
                        />
                    </div>

                    {/* Province Filter */}
                    <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <span className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Tất cả tỉnh thành" />
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả tỉnh thành</SelectItem>
                            {PROVINCES.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Grade Filter */}
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger className="h-10 border-border bg-background">
                            <SelectValue placeholder="Tất cả lớp học" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả lớp học</SelectItem>
                            {GRADES.map((g) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Subject Filter */}
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

                    {/* Type Filter */}
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
                </div>
            </div>

            {/* Questions list */}
            <div className="space-y-4">
                {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q) => {
                        const isGroup = q.type.startsWith("group_");
                        return (
                            <div key={q.id} className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                                {/* Question card header */}
                                <div className="flex justify-between items-center bg-muted/60 px-4 py-3 border-b border-border/60">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${q.typeClass}`}>
                                            {q.typeName}
                                        </span>
                                        <span className="font-bold text-sm text-foreground truncate">{q.number_label}</span>
                                        <span className="text-[10px] text-muted-foreground shrink-0 bg-background px-2 py-0.5 rounded-full border border-border">
                                            {q.subject} • {q.grade}
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

                                {/* Question body */}
                                {!q.isCollapsed && (
                                    <div className="p-4 sm:p-5 space-y-4">
                                        {/* Exam Title context */}
                                        {q.examTitle && (
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 bg-muted/30 p-2 rounded-lg w-fit border border-border/50">
                                                <Bookmark className="w-3 h-3 text-primary" />
                                                Nguồn đề: {q.examTitle}
                                            </div>
                                        )}

                                        {/* Question text formatted with KaTeX renderer */}
                                        <div className="text-sm font-medium text-foreground leading-relaxed">
                                            <LatexRenderer text={q.content} />
                                        </div>

                                        {/* Option lists or statement checks */}
                                        {q.options && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                {q.options.map((opt) => (
                                                    <div
                                                        key={opt}
                                                        className={`p-3 rounded-xl border text-xs font-medium ${
                                                            opt.startsWith(q.correct_answer)
                                                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold"
                                                                : "border-border bg-background"
                                                        }`}
                                                    >
                                                        <LatexRenderer text={opt} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {q.statements && (
                                            <div className="space-y-2 mt-2">
                                                {q.statements.map((st, i) => (
                                                    <div key={i} className="flex justify-between items-center p-2.5 rounded-xl border border-border bg-background text-xs">
                                                        <span className="font-medium">
                                                            <LatexRenderer text={st.text} />
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${
                                                            st.result === "Đ"
                                                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                                                : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                                                        }`}>
                                                            {st.result === "Đ" ? "Đúng" : "Sai"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Sub questions if group */}
                                        {isGroup && q.subQuestions && (
                                            <div className="space-y-4 border-l-2 border-primary/20 pl-4 mt-4">
                                                <p className="text-xs font-bold text-primary uppercase tracking-wider select-none">Các câu con của nhóm:</p>
                                                {q.subQuestions.map((subQ) => (
                                                    <div key={subQ.id} className="bg-muted/40 p-3.5 rounded-xl border border-border space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-foreground">{subQ.number_label}</span>
                                                            <span className="text-[10px] font-bold text-muted-foreground">{subQ.points} điểm</span>
                                                        </div>
                                                        <div className="text-xs font-medium text-foreground">
                                                            <LatexRenderer text={subQ.content} />
                                                        </div>
                                                        {subQ.options && (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                                {subQ.options.map((opt) => (
                                                                    <div key={opt} className={`p-2 rounded-lg border text-[11px] ${
                                                                        opt.startsWith(subQ.correct_answer)
                                                                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold"
                                                                            : "border-border bg-background"
                                                                    }`}>
                                                                        <LatexRenderer text={opt} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {subQ.suggested_solution && (
                                                            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-2.5 rounded-lg border border-emerald-500/10 text-[10px] text-muted-foreground">
                                                                <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5 select-none">Lời giải mẫu:</span>
                                                                <LatexRenderer text={subQ.suggested_solution} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Suggested solution */}
                                        {q.suggested_solution && (
                                            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-500/10 text-xs text-muted-foreground mt-2">
                                                <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1 select-none">💡 Lời giải mẫu chi tiết:</span>
                                                <LatexRenderer text={q.suggested_solution} />
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
