import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { toast } from "sonner";
import { createDefaultSubQuestion } from "@/components/question/GroupQuestionForm";

const runWithTimeout = (promise, ms = 1000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

export const TYPE_CONFIG = {
    multiple_choice: { label: "Trắc nghiệm Đơn", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
    group_multiple_choice: { label: "Trắc nghiệm Nhóm", bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-300 dark:border-violet-700" },
    true_false: { label: "Đúng / Sai Đơn", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
    group_true_false: { label: "Đúng / Sai Nhóm", bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-300 dark:border-teal-700" },
    essay: { label: "Tự luận Đơn", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
    group_essay: { label: "Tự luận Nhóm", bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
};

export const createDefaultQuestion = (type = "multiple_choice") => {
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

export function useCreateExam() {
    const confirmDialog = useConfirm();
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const [editId, setEditId] = useState(null);
    const isCodeManuallyEdited = useRef(false);

    const [examInfo, setExamInfo] = useState({
        title: "", code: "", year: "", grade: "", subject: "", province: "", duration: "",
    });
    const [questionsList, setQuestionsList] = useState([]);
    const [showPicker, setShowPicker] = useState(false);
    
    // Zen Mode & Auto Save
    const [zenMode, setZenMode] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // AI Assistant
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [aiPromptText, setAiPromptText] = useState("");
    const [aiGenType, setAiGenType] = useState("multiple_choice");
    const [aiGenerating, setAiGenerating] = useState(false);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    // Load Data
    useEffect(() => {
        const loadExamData = async () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                const id = params.get("editId");
                if (id) {
                    setEditId(id);
                    let examToEdit = null;
                    try {
                        const examDocRef = doc(db, "exams", id);
                        const examDoc = await runWithTimeout(getDoc(examDocRef), 1200);
                        if (examDoc.exists()) examToEdit = examDoc.data();
                    } catch (e) {
                        console.warn("Bỏ qua lỗi Firestore khi tải đề thi:", e.message);
                    }

                    if (!examToEdit) {
                        const savedExams = JSON.parse(localStorage.getItem("eb_exams") || "[]");
                        examToEdit = savedExams.find((e) => String(e.id) === String(id));
                    }

                    if (examToEdit) {
                        setExamInfo({
                            title: examToEdit.title || "", code: examToEdit.id || "",
                            year: examToEdit.year || "", grade: examToEdit.grade || "",
                            subject: examToEdit.subject || "", province: examToEdit.province || "",
                            duration: examToEdit.duration !== undefined ? String(examToEdit.duration) : "",
                        });
                        isCodeManuallyEdited.current = true;
                        setQuestionsList(examToEdit.questions || []);
                    }
                } else {
                    let draft = null;
                    if (currentUser?.uid) {
                        try {
                            const draftDoc = await getDoc(doc(db, "drafts", currentUser.uid));
                            if (draftDoc.exists() && !draftDoc.data().deleted) draft = draftDoc.data();
                        } catch (e) { console.warn("Lỗi tải nháp Cloud:", e); }
                    }
                    if (!draft) {
                        const draftStr = localStorage.getItem("eb_exam_draft");
                        if (draftStr) try { draft = JSON.parse(draftStr); } catch (e) {}
                    }

                    if (draft && (draft.examInfo || draft.questionsList?.length > 0)) {
                        if (await confirmDialog(`Bạn có bản nháp (Cloud/Local) đang soạn dở lúc ${new Date(draft.timestamp).toLocaleTimeString('vi-VN')}. Bạn có muốn khôi phục không?`, "Khôi phục bản nháp")) {
                            setExamInfo(draft.examInfo || examInfo);
                            setQuestionsList(draft.questionsList || []);
                            isCodeManuallyEdited.current = !!draft.examInfo?.code;
                        } else {
                            localStorage.removeItem("eb_exam_draft");
                            if (currentUser?.uid) {
                                try { await setDoc(doc(db, "drafts", currentUser.uid), { deleted: true }); } catch (e) {}
                            }
                        }
                    }
                }
            }
        };
        loadExamData();
    }, [currentUser]);

    // Auto-save
    useEffect(() => {
        if (!examInfo.title && questionsList.length === 0) return;
        const timer = setTimeout(async () => {
            const draft = { examInfo, questionsList, timestamp: new Date().toISOString() };
            localStorage.setItem("eb_exam_draft", JSON.stringify(draft));
            
            if (currentUser?.uid) {
                try {
                    await setDoc(doc(db, "drafts", currentUser.uid), draft);
                } catch (err) { console.warn("Lỗi lưu nháp Cloud:", err); }
            }
            setLastSaved(new Date());
        }, 5000);
        return () => clearTimeout(timer);
    }, [examInfo, questionsList, currentUser]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleSaveExam();
            } else if (e.altKey && e.key === 'n') {
                e.preventDefault();
                addQuestion("multiple_choice");
            } else if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                setQuestionsList(prev => {
                    if (prev.length === 0) return prev;
                    const lastQ = prev[prev.length - 1];
                    const newQ = JSON.parse(JSON.stringify(lastQ));
                    newQ.id = Date.now() + Math.random();
                    if (newQ.number_label) newQ.number_label = newQ.number_label + " (Bản sao)";
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

    const toggleZenMode = () => {
        const newZen = !zenMode;
        setZenMode(newZen);
        window.dispatchEvent(new CustomEvent("toggle-zen-mode", { detail: newZen }));
    };

    const handleAIGenerateQuestion = async () => {
        if (!aiPromptText.trim()) {
            toast.error("Vui lòng nhập chủ đề hoặc yêu cầu trước khi tạo câu hỏi.");
            return;
        }

        setAiGenerating(true);
        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "generate_question", promptText: aiPromptText, type: aiGenType })
            });

            const data = await response.json();
            if (data.error) {
                toast.error("Lỗi tạo câu hỏi: " + data.error);
                return;
            }

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
            setAiPromptText("");
            setShowAIAssistant(false);
            toast.success("Tạo câu hỏi thành công!");
        } catch (err) {
            console.error("Lỗi gọi AI tạo câu hỏi:", err);
            toast.error("Lỗi kết nối AI: " + err.message);
        } finally {
            setAiGenerating(false);
        }
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
        const cleanedVal = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
        setExamInfo({ ...examInfo, code: cleanedVal });
    };

    const handleGradeChange = (selectedGrade) => {
        setExamInfo({ ...examInfo, grade: selectedGrade, subject: "" });
    };

    const addQuestion = (type) => {
        setQuestionsList((prev) => [...prev, createDefaultQuestion(type)]);
        setShowPicker(false);
    };

    const removeQuestion = (id) => setQuestionsList(questionsList.filter((q) => q.id !== id));
    
    const duplicateQuestion = (question) => {
        const newQ = JSON.parse(JSON.stringify(question));
        newQ.id = Date.now() + Math.random();
        if (newQ.number_label) newQ.number_label += " (Bản sao)";
        setQuestionsList(prev => {
            const idx = prev.findIndex(q => q.id === question.id);
            const copy = [...prev];
            copy.splice(idx + 1, 0, newQ);
            return copy;
        });
    };

    const toggleCollapse = (id) => setQuestionsList(questionsList.map((q) => q.id === id ? { ...q, isCollapsed: !q.isCollapsed } : q));
    
    const updateQuestionData = (id, updatedData) => setQuestionsList(questionsList.map((q) => q.id === id ? { ...q, ...updatedData } : q));

    const handleSaveExam = async () => {
        if (!examInfo.title.trim()) return toast.error("Vui lòng nhập Tiêu đề đề thi.");
        if (!examInfo.code.trim()) return toast.error("Vui lòng nhập Mã đề thi.");
        if (questionsList.length === 0) return toast.error("Vui lòng thêm ít nhất một câu hỏi.");

        const savedExams = JSON.parse(localStorage.getItem("eb_exams") || "[]");
        const finalId = examInfo.code.trim();

        const finalExamPayload = {
            id: finalId, uid: currentUser?.uid || "anonymous", author: currentUser?.name || "Giáo viên",
            title: examInfo.title, year: examInfo.year, grade: examInfo.grade,
            subject: examInfo.subject, province: examInfo.province, duration: Number(examInfo.duration) || 90,
            total_questions: questionsList.length, questions: questionsList.map(({ isCollapsed, ...rest }) => rest),
            updatedAt: new Date().toISOString(),
        };

        try {
            const examDocRef = doc(db, "exams", finalId);
            await runWithTimeout(setDoc(examDocRef, finalExamPayload), 1500);
        } catch (err) {
            console.warn("Bỏ qua lỗi Firestore khi lưu đề thi:", err.message);
        }

        if (editId) {
            let updatedExams = savedExams;
            if (String(editId) !== String(finalId)) updatedExams = savedExams.filter((e) => String(e.id) !== String(editId));
            const index = updatedExams.findIndex((e) => String(e.id) === String(finalId));
            if (index !== -1) updatedExams[index] = finalExamPayload;
            else updatedExams.push(finalExamPayload);
            localStorage.setItem("eb_exams", JSON.stringify(updatedExams));
        } else {
            const exists = savedExams.some((e) => String(e.id) === String(finalId));
            if (exists && !(await confirmDialog("Mã đề thi này đã tồn tại trong hệ thống. Bạn có chắc chắn muốn ghi đè lên đề thi hiện tại không?", "Trùng mã đề thi"))) return;
            const updatedExams = savedExams.filter((e) => String(e.id) !== String(finalId));
            updatedExams.push(finalExamPayload);
            localStorage.setItem("eb_exams", JSON.stringify(updatedExams));
        }

        localStorage.removeItem("eb_exam_draft");
        toast.success(editId ? "Cập nhật đề thi thành công!" : "Lưu đề thi mới thành công!");
        router.push("/my-exams");
    };

    return {
        currentUser, loading,
        examInfo, setExamInfo, handleTitleChange, handleCodeChange, handleGradeChange,
        questionsList, setQuestionsList, addQuestion, removeQuestion, toggleCollapse, updateQuestionData, duplicateQuestion,
        showPicker, setShowPicker,
        zenMode, toggleZenMode, lastSaved,
        showAIAssistant, setShowAIAssistant, aiPromptText, setAiPromptText, aiGenType, setAiGenType, aiGenerating, handleAIGenerateQuestion,
        handleSaveExam
    };
}
