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
import { Plus, Save, Trash2, ChevronDown, ChevronUp, BookOpen, Loader2, Sparkles, Maximize, Minimize, Check, Copy } from "lucide-react";
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
    
    // UI States for Part 4
    const [zenMode, setZenMode] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Auto-save Effect (5s debounce)
    useEffect(() => {
        if (!examInfo.title && questionsList.length === 0) return;
        const timer = setTimeout(() => {
            const draft = { examInfo, questionsList, timestamp: new Date().toISOString() };
            localStorage.setItem("eb_exam_draft", JSON.stringify(draft));
            setLastSaved(new Date());
        }, 5000);
        return () => clearTimeout(timer);
    }, [examInfo, questionsList]);

    const toggleZenMode = () => {
        const newZen = !zenMode;
        setZenMode(newZen);
        window.dispatchEvent(new CustomEvent("toggle-zen-mode", { detail: newZen }));
    };

    // AI Assistant States
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [aiPromptText, setAiPromptText] = useState("");
    const [aiGenType, setAiGenType] = useState("multiple_choice");
    const [aiGenerating, setAiGenerating] = useState(false);

    const handleAIGenerateQuestion = async () => {
        if (!aiPromptText.trim()) {
            alert("Vui lòng nhập chủ đề hoặc yêu cầu trước khi tạo câu hỏi.");
            return;
        }

        setAiGenerating(true);
        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate_question",
                    promptText: aiPromptText,
                    type: aiGenType
                })
            });

            const data = await response.json();
            if (data.error) {
                alert("Lỗi tạo câu hỏi: " + data.error);
                return;
            }

            // Tạo đối tượng câu hỏi mới từ dữ liệu AI trả về
            const newQ = {
                id: Date.now() + Math.random(),
                type: aiGenType,
                content: data.content || "",
                images: [],
                difficulty: data.difficulty || "nhan_biet",
                points: data.points || "1.0",
                suggested_solution: data.suggested_solution || "",
                final_answer: data.final_answer || "",
                answer_images: [],
                isCollapsed: false
            };

            if (aiGenType === "multiple_choice") {
                const labels = ["A", "B", "C", "D"];
                newQ.options = (data.choices || []).map(c => c.text || "");
                newQ.options_images = ["", "", "", ""];
                
                // Xác định đáp án đúng
                const correctIdx = (data.choices || []).findIndex(c => c.isCorrect);
                newQ.correct_answer = correctIdx !== -1 ? labels[correctIdx] : "A";
            } else if (aiGenType === "true_false") {
                newQ.subQuestions = (data.subQuestions || []).map(sq => ({
                    id: Date.now() + Math.random() + Math.random(),
                    content: sq.content || "",
                    isCorrect: sq.isCorrect || false,
                    points: sq.points || "0.25"
                }));
            }

            setQuestionsList(prev => [...prev, newQ]);
            setAiPromptText(""); // Reset prompt
            setShowAIAssistant(false); // Đóng panel
            alert("Tạo câu hỏi thành công!");
        } catch (err) {
            console.error("Lỗi gọi AI tạo câu hỏi:", err);
            alert("Lỗi kết nối AI: " + err.message);
        } finally {
            setAiGenerating(false);
        }
    };

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
                } else {
                    const draftStr = localStorage.getItem("eb_exam_draft");
                    if (draftStr) {
                        try {
                            const draft = JSON.parse(draftStr);
                            if (draft.examInfo || draft.questionsList?.length > 0) {
                                if (confirm(`Bạn có bản nháp đang soạn dở lúc ${new Date(draft.timestamp).toLocaleTimeString('vi-VN')}. Bạn có muốn khôi phục không?`)) {
                                    setExamInfo(draft.examInfo || examInfo);
                                    setQuestionsList(draft.questionsList || []);
                                    isCodeManuallyEdited.current = !!draft.examInfo?.code;
                                } else {
                                    localStorage.removeItem("eb_exam_draft");
                                }
                            }
                        } catch (e) {
                            console.error("Lỗi đọc bản nháp:", e);
                        }
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

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ngăn chặn các phím tắt mặc định nếu cần
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleSaveExam();
            } else if (e.altKey && e.key === 'n') {
                e.preventDefault();
                addQuestion("multiple_choice");
            } else if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                // Duplicate last question
                setQuestionsList(prev => {
                    if (prev.length === 0) return prev;
                    const lastQ = prev[prev.length - 1];
                    const newQ = JSON.parse(JSON.stringify(lastQ));
                    newQ.id = Date.now() + Math.random();
                    if (newQ.number_label) {
                        newQ.number_label = newQ.number_label + " (Bản sao)";
                    }
                    return [...prev, newQ];
                });
            } else if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                setShowAIAssistant(prev => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [examInfo, questionsList, currentUser, editId]);

    return (
        <div className={`w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 transition-all duration-300 ${zenMode ? 'max-w-7xl' : ''}`}>

            {/* Top Toolbar (Auto-save & Zen Mode) */}
            <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-sm animate-in slide-in-from-top-3">
                <div className="flex items-center gap-2">
                    {lastSaved ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/50">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã lưu nháp lúc {lastSaved.toLocaleTimeString('vi-VN')}
                        </span>
                    ) : (
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                            <Save className="w-3.5 h-3.5" /> Trạng thái: Chưa có thay đổi
                        </span>
                    )}
                </div>
                <Button 
                    variant={zenMode ? "default" : "outline"}
                    size="sm" 
                    onClick={toggleZenMode} 
                    className={`gap-2 text-xs font-bold rounded-xl h-9 ${zenMode ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"}`}
                >
                    {zenMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    {zenMode ? "Thoát Zen Mode" : "Zen Mode"}
                </Button>
            </div>

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

            {/* Trợ lý Soạn Câu Hỏi */}
            <Card className="border-violet-200 bg-violet-50/10 dark:border-violet-900/40 dark:bg-violet-950/10 shadow-sm overflow-hidden transition-all duration-300">
                <div 
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-violet-50/30 dark:hover:bg-violet-950/25 transition-colors select-none"
                >
                    <div className="flex items-center gap-2.5">
                        <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 fill-violet-600/10 animate-pulse" />
                        <div>
                            <h3 className="text-sm font-bold text-violet-800 dark:text-violet-300">Trợ lý Soạn Câu Hỏi (Generative Assistant)</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Tự động soạn câu hỏi toán lý hóa chuẩn cấu trúc kiến thức</p>
                        </div>
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900/50 shrink-0"
                    >
                        {showAIAssistant ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>

                {showAIAssistant && (
                    <CardContent className="p-4 sm:p-5 border-t border-violet-100 dark:border-violet-900/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-violet-700 dark:text-violet-400 block mb-1.5">
                                    Mô tả yêu cầu / Chủ đề kiến thức:
                                </label>
                                <Input
                                    value={aiPromptText}
                                    onChange={(e) => setAiPromptText(e.target.value)}
                                    placeholder="Ví dụ: Tạo 1 câu trắc nghiệm Toán 12 về thể tích khối chóp tam giác đều cạnh đáy bằng a..."
                                    className="border-violet-200/80 dark:border-violet-800 focus-visible:ring-violet-500"
                                    disabled={aiGenerating}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-violet-700 dark:text-violet-400 block mb-1.5">
                                    Loại câu hỏi cần tạo:
                                </label>
                                <Select 
                                    value={aiGenType} 
                                    onValueChange={setAiGenType}
                                    disabled={aiGenerating}
                                >
                                    <SelectTrigger className="border-violet-200/80 dark:border-violet-800 focus:ring-violet-500">
                                        <SelectValue placeholder="Chọn loại câu hỏi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="multiple_choice">Trắc nghiệm Đơn</SelectItem>
                                        <SelectItem value="true_false">Đúng / Sai Đơn</SelectItem>
                                        <SelectItem value="essay">Tự luận Đơn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <Button
                                onClick={handleAIGenerateQuestion}
                                disabled={aiGenerating}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold px-6 shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] gap-1.5"
                            >
                                {aiGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Đang soạn đề...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 fill-white/10" /> Soạn Câu Hỏi
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                )}
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
                                        onClick={() => {
                                            const newQ = JSON.parse(JSON.stringify(question));
                                            newQ.id = Date.now() + Math.random();
                                            if (newQ.number_label) {
                                                newQ.number_label = newQ.number_label + " (Bản sao)";
                                            }
                                            setQuestionsList(prev => {
                                                const idx = prev.findIndex(q => q.id === question.id);
                                                const copy = [...prev];
                                                copy.splice(idx + 1, 0, newQ);
                                                return copy;
                                            });
                                        }}
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        title="Nhân bản câu hỏi này"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
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
