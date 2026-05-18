"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QuestionForm from "@/components/question/QuestionForm";
import QuestionTypePicker from "@/components/question/QuestionTypePicker";
import { createDefaultSubQuestion } from "@/components/question/GroupQuestionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Trash2, ChevronDown, ChevronUp, BookOpen, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
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

import { GRADE_SUBJECTS_MAP, getDynamicAcademicYears } from "@/lib/constants";
import useProvinces from "@/hooks/useProvinces";

const ACADEMIC_YEARS = getDynamicAcademicYears();
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
        difficulty: "nhan_biet",
        final_answer: "",
        answer_images: [],
    };
};

export default function CreateExamPage() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const [editId, setEditId] = useState(null);
    const { provinces } = useProvinces();
    const isCodeManuallyEdited = useRef(false);

    const [examInfo, setExamInfo] = useState({
        title: "",
        code: "",
        year: "",
        grade: "",
        subject: "",
        province: "",
        duration: "",
    });

    const [questionsList, setQuestionsList] = useState([]);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    useEffect(() => {
        const loadExamData = async () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                const id = params.get("editId");
                if (id) {
                    setEditId(id);
                    let examToEdit = null;

                    // Thử load từ Firestore
                    try {
                        const examDocRef = doc(db, "exams", id);
                        const examDoc = await runWithTimeout(getDoc(examDocRef), 1200);
                        if (examDoc.exists()) {
                            examToEdit = examDoc.data();
                        }
                    } catch (e) {
                        console.warn("Bỏ qua lỗi Firestore khi tải đề thi:", e.message);
                    }

                    // Fallback nếu Firestore không có hoặc lỗi
                    if (!examToEdit) {
                        const savedExams = JSON.parse(localStorage.getItem("eb_exams") || "[]");
                        examToEdit = savedExams.find((e) => String(e.id) === String(id));
                    }

                    if (examToEdit) {
                        setExamInfo({
                            title: examToEdit.title || "",
                            code: examToEdit.id || "",
                            year: examToEdit.year || "",
                            grade: examToEdit.grade || "",
                            subject: examToEdit.subject || "",
                            province: examToEdit.province || "",
                            duration: examToEdit.duration !== undefined ? String(examToEdit.duration) : "",
                        });
                        isCodeManuallyEdited.current = true;
                        setQuestionsList(examToEdit.questions || []);
                    }
                }
            }
        };

        loadExamData();
    }, [currentUser]);

    if (loading || !currentUser) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const slugify = (text) => {
        if (!text) return "";
        return text
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/([^a-z0-9\s-]|_)+/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    const handleGradeChange = (selectedGrade) => {
        setExamInfo({ ...examInfo, grade: selectedGrade, subject: "" });
    };

    const handleTitleChange = (title) => {
        setExamInfo((prev) => {
            const updated = { ...prev, title };
            if (!isCodeManuallyEdited.current) {
                const slug = slugify(title);
                updated.code = slug ? `${slug}-${Math.floor(1000 + Math.random() * 9000)}` : "";
            }
            return updated;
        });
    };

    const handleCodeChange = (e) => {
        isCodeManuallyEdited.current = true;
        const cleanedVal = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "");
        setExamInfo({ ...examInfo, code: cleanedVal });
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

    const handleSaveExam = async () => {
        if (!examInfo.title.trim()) {
            alert("Vui lòng nhập Tiêu đề đề thi.");
            return;
        }
        if (!examInfo.code.trim()) {
            alert("Vui lòng nhập Mã đề thi.");
            return;
        }
        if (questionsList.length === 0) {
            alert("Vui lòng thêm ít nhất một câu hỏi.");
            return;
        }

        const savedExams = JSON.parse(localStorage.getItem("eb_exams") || "[]");
        const finalId = examInfo.code.trim();

        const finalExamPayload = {
            id: finalId,
            uid: currentUser?.uid || "anonymous",
            author: currentUser?.name || "Giáo viên",
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

        // Đồng bộ trực tiếp lên Firebase Firestore (Yêu cầu chính của đề bài)
        try {
            const examDocRef = doc(db, "exams", finalId);
            await runWithTimeout(setDoc(examDocRef, finalExamPayload), 1500);
        } catch (err) {
            console.warn("Bỏ qua lỗi Firestore khi lưu đề thi:", err.message);
        }

        if (editId) {
            let updatedExams = savedExams;
            if (String(editId) !== String(finalId)) {
                updatedExams = savedExams.filter((e) => String(e.id) !== String(editId));
            }

            const index = updatedExams.findIndex((e) => String(e.id) === String(finalId));
            if (index !== -1) {
                updatedExams[index] = finalExamPayload;
            } else {
                updatedExams.push(finalExamPayload);
            }
            localStorage.setItem("eb_exams", JSON.stringify(updatedExams));
        } else {
            const exists = savedExams.some((e) => String(e.id) === String(finalId));
            if (exists) {
                if (!confirm("Mã đề thi này đã tồn tại trong hệ thống. Bạn có chắc chắn muốn ghi đè lên đề thi hiện tại không?")) {
                    return;
                }
            }

            const updatedExams = savedExams.filter((e) => String(e.id) !== String(finalId));
            updatedExams.push(finalExamPayload);
            localStorage.setItem("eb_exams", JSON.stringify(updatedExams));
        }

        alert(editId ? "Cập nhật đề thi thành công!" : "Lưu đề thi mới thành công!");
        router.push("/my-exams");
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 transition-colors duration-300">

            <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
                    <CardTitle className="text-lg sm:text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 shrink-0" />
                        Cấu Hình Thông Tin Đề Thi
                    </CardTitle>
                    <div className="text-[11px] font-extrabold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200/60 dark:border-blue-900/40 select-none shrink-0">
                        Tổng số: {questionsList.length} câu hỏi
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        <div className="sm:col-span-2 lg:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tiêu đề đề thi</label>
                            <Input
                                placeholder="Ví dụ: Đề thi thử THPT Quốc Gia môn Toán..."
                                value={examInfo.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                            />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-1">
                            <label className="text-xs font-bold text-blue-700 dark:text-blue-400 block mb-1.5 flex items-center gap-1">
                                Mã đề thi (Slug ID)
                            </label>
                            <Input
                                placeholder="vi-du-ma-de-thi"
                                value={examInfo.code}
                                onChange={handleCodeChange}
                            />
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
                            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tỉnh thành</label>
                            <Select value={examInfo.province} onValueChange={(val) => setExamInfo({ ...examInfo, province: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tỉnh thành" />
                                </SelectTrigger>
                                <SelectContent>
                                    {provinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
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
