"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuestionForm from "@/components/question/QuestionForm";
import QuestionTypePicker from "@/components/question/QuestionTypePicker";
import { createDefaultSubQuestion } from "@/components/question/GroupQuestionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Trash2, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

const PROVINCES = [
    "Toàn quốc", "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng",
    "Cần Thơ", "Nghệ An", "Thừa Thiên Huế", "Quảng Nam", "Bình Dương",
];

const ACADEMIC_YEARS = ["2024-2025", "2025-2026", "2026-2027", "2027-2028"];

const GRADE_SUBJECTS_MAP = {
    "10": ["Toán học", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", "Tiếng Anh", "Tin học"],
    "11": ["Toán học", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", "Tiếng Anh", "Tin học"],
    "12": ["Toán học", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", "Tiếng Anh", "Tin học"],
    "Đại học": [
        "Đồ họa máy tính (Computer Graphics)",
        "Học máy (Machine Learning)",
        "Trí tuệ nhân tạo (AI)",
        "Mạng máy tính",
        "Cấu trúc dữ liệu và Giải thuật",
        "Lập trình Web (Node.js/ReactJS)",
        "Hệ điều hành (Unix/FreeBSD)",
        "Kiến trúc máy tính",
    ],
};

const GRADES = Object.keys(GRADE_SUBJECTS_MAP);

const TYPE_CONFIG = {
    multiple_choice: { label: "Trắc nghiệm Đơn", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
    group_multiple_choice: { label: "Trắc nghiệm Nhóm", bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-300 dark:border-violet-700" },
    true_false: { label: "Đúng / Sai Đơn", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
    group_true_false: { label: "Đúng / Sai Nhóm", bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-300 dark:border-teal-700" },
    essay: { label: "Tự luận Đơn", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
    group_essay: { label: "Tự luận Nhóm", bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
};

const createDefaultQuestion = (type = "multiple_choice") => {
    const isGroup = type.startsWith("group_");
    const baseType = isGroup ? type.replace("group_", "") : type;

    const base = {
        id: Date.now() + Math.random(),
        type,
        content: "",
        images: [],
        isCollapsed: false,
    };

    if (isGroup) {
        return {
            ...base,
            subQuestions: [createDefaultSubQuestion(baseType)],
        };
    }

    return {
        ...base,
        options: ["", "", "", ""],
        options_images: ["", "", "", ""],
        correct_answer: "A",
        statements: [{ text: "", correct: true }],
        suggested_solution: "",
        points: "1.0",
        final_answer: "",
        answer_images: [],
    };
};

export default function CreateExamPage() {
    const router = useRouter();
    const [editId, setEditId] = useState(null);

    const [examInfo, setExamInfo] = useState({
        title: "",
        year: "",
        grade: "",
        subject: "",
        province: "",
        duration: "",
    });

    const [questionsList, setQuestionsList] = useState([]);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const id = params.get("editId");
            if (id) {
                setEditId(id);
                const savedExams = JSON.parse(localStorage.getItem("eb_exams") || "[]");
                const examToEdit = savedExams.find((e) => String(e.id) === String(id));
                if (examToEdit) {
                    setExamInfo({
                        title: examToEdit.title || "",
                        year: examToEdit.year || "",
                        grade: examToEdit.grade || "",
                        subject: examToEdit.subject || "",
                        province: examToEdit.province || "",
                        duration: examToEdit.duration !== undefined ? String(examToEdit.duration) : "",
                    });
                    setQuestionsList(examToEdit.questions || []);
                }
            }
        }
    }, []);

    const handleGradeChange = (selectedGrade) => {
        setExamInfo({ ...examInfo, grade: selectedGrade, subject: "" });
    };

    const addQuestion = (type) => {
        setQuestionsList((prev) => [...prev, createDefaultQuestion(type)]);
        setShowPicker(false);
    };

    const removeQuestion = (id) => {
        setQuestionsList(questionsList.filter((q) => q.id !== id));
    };

    const toggleCollapse = (id) => {
        setQuestionsList(questionsList.map((q) =>
            q.id === id ? { ...q, isCollapsed: !q.isCollapsed } : q
        ));
    };

    const updateQuestionData = (id, updatedData) => {
        setQuestionsList(questionsList.map((q) =>
            q.id === id ? { ...q, ...updatedData } : q
        ));
    };

    const handleSaveExam = () => {
        if (!examInfo.title.trim()) {
            alert("Vui lòng nhập Tiêu đề đề thi.");
            return;
        }
        if (questionsList.length === 0) {
            alert("Vui lòng thêm ít nhất một câu hỏi.");
            return;
        }

        const savedExams = JSON.parse(localStorage.getItem("eb_exams") || "[]");

        const finalExamPayload = {
            id: editId || String(Date.now()),
            title: examInfo.title,
            year: examInfo.year,
            grade: examInfo.grade,
            subject: examInfo.subject,
            province: examInfo.province,
            duration: Number(examInfo.duration) || 90,
            total_questions: questionsList.length,
            questions: questionsList.map(({ isCollapsed, ...rest }) => rest),
            updatedAt: new Date().toISOString(),
        };

        if (editId) {
            const index = savedExams.findIndex((e) => String(e.id) === String(editId));
            if (index !== -1) {
                savedExams[index] = finalExamPayload;
            } else {
                savedExams.push(finalExamPayload);
            }
        } else {
            savedExams.push(finalExamPayload);
        }

        localStorage.setItem("eb_exams", JSON.stringify(savedExams));
        alert(editId ? "Cập nhật đề thi thành công!" : "Lưu đề thi mới thành công!");
        router.push("/my-exams");
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 transition-colors duration-300">

            <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg sm:text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 shrink-0" />
                        Cấu Hình Thông Tin Đề Thi
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        <div className="sm:col-span-2 lg:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tiêu đề đề thi</label>
                            <Input
                                placeholder="Ví dụ: Đề thi thử THPT Quốc Gia môn Toán..."
                                value={examInfo.title}
                                onChange={(e) => setExamInfo({ ...examInfo, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Năm học</label>
                            <Select value={examInfo.year} onValueChange={(val) => setExamInfo({ ...examInfo, year: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn năm học" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACADEMIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Cấp học / Lớp</label>
                            <Select value={examInfo.grade} onValueChange={handleGradeChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn cấp học" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GRADES.map((g) => (
                                        <SelectItem key={g} value={g}>
                                            {g === "Đại học" ? "Đại học" : `Khối ${g}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-blue-700 dark:text-blue-400 block mb-1.5">Môn học</label>
                            <Select
                                value={examInfo.subject}
                                onValueChange={(val) => setExamInfo({ ...examInfo, subject: val })}
                                disabled={!examInfo.grade}
                            >
                                <SelectTrigger className={!examInfo.grade ? "text-muted-foreground" : "border-blue-300 text-blue-900 dark:border-blue-700 dark:text-blue-300 font-medium"}>
                                    <SelectValue placeholder={examInfo.grade ? "Chọn môn học" : "Chọn lớp trước"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(GRADE_SUBJECTS_MAP[examInfo.grade] || []).map((sub) => (
                                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tỉnh thành</label>
                            <Select value={examInfo.province} onValueChange={(val) => setExamInfo({ ...examInfo, province: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tỉnh thành" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Thời gian (phút)</label>
                            <Input
                                type="number"
                                placeholder="Ví dụ: 90"
                                value={examInfo.duration}
                                onChange={(e) => setExamInfo({ ...examInfo, duration: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-blue-600 dark:text-blue-400 block mb-1.5">Số câu hỏi</label>
                            <div className="h-10 flex items-center px-3 bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 font-bold text-sm rounded-lg border border-blue-200 dark:border-blue-900 select-none">
                                {questionsList.length} câu hỏi
                            </div>
                        </div>

                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {questionsList.map((question, index) => (
                    <div key={question.id}>

                        <div className="flex justify-between items-center bg-muted px-4 py-2 rounded-t-lg border border-border shadow-sm">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Input
                                    value={question.number_label !== undefined ? question.number_label : `CÂU ${index + 1}`}
                                    onChange={(e) => updateQuestionData(question.id, { number_label: e.target.value })}
                                    className="w-36 h-7 text-xs font-bold text-foreground bg-transparent border-dashed border-muted-foreground/30 focus-visible:ring-1 text-left px-1.5 shadow-none focus-visible:border-primary shrink-0"
                                    placeholder="Ký hiệu / Số câu..."
                                />
                                {question.isCollapsed && question.content && (
                                    <span className="text-xs text-muted-foreground truncate italic hidden sm:block">
                                        — {question.content}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                {(() => {
                                    const typeConf = TYPE_CONFIG[question.type] || TYPE_CONFIG["multiple_choice"];
                                    return (
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border shrink-0 ${typeConf.bg} ${typeConf.text} ${typeConf.border}`}>
                                            {typeConf.label}
                                        </span>
                                    );
                                })()}
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleCollapse(question.id)}
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        title={question.isCollapsed ? "Mở rộng" : "Thu gọn"}
                                    >
                                        {question.isCollapsed
                                            ? <ChevronDown className="w-4 h-4" />
                                            : <ChevronUp className="w-4 h-4" />
                                        }
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeQuestion(question.id)}
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        title="Xóa câu hỏi này"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {!question.isCollapsed && (
                            <QuestionForm
                                question={question}
                                onChangeData={(updatedData) => updateQuestionData(question.id, updatedData)}
                            />
                        )}

                    </div>
                ))}

                {/* Add question area */}
                <div className="space-y-3 pt-1">
                    {showPicker ? (
                        <QuestionTypePicker
                            onSelect={addQuestion}
                            onCancel={() => setShowPicker(false)}
                        />
                    ) : (
                        <div className="flex justify-center">
                            <Button
                                onClick={() => setShowPicker(true)}
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-medium text-xs border border-dashed border-blue-300 dark:border-blue-800 rounded-full px-6 py-2"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Thêm câu hỏi
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                    Tổng cộng <span className="font-semibold text-foreground">{questionsList.length} câu hỏi</span> đã được soạn thảo
                </p>
                <Button
                    onClick={handleSaveExam}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 font-semibold px-10 shadow-md text-white gap-2"
                >
                    <Save className="w-4 h-4" />
                    Lưu đề thi
                </Button>
            </div>
        </div>
    );
}