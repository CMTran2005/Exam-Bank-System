import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function useQuestions() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    const [questions, setQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [tagSearch, setTagSearch] = useState("all");
    const [examTitleSearch, setExamTitleSearch] = useState("all");
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

    const uniqueTags = useMemo(() => {
        const tags = new Set();
        questions.forEach(q => {
            if (q.tags && Array.isArray(q.tags)) {
                q.tags.forEach(t => tags.add(t));
            }
        });
        return Array.from(tags).sort((a, b) => a.localeCompare(b, "vi"));
    }, [questions]);

    const uniqueExamTitles = useMemo(() => {
        const titles = new Set();
        questions.forEach(q => {
            if (q.examTitle) {
                titles.add(q.examTitle);
            }
        });
        return Array.from(titles).sort((a, b) => a.localeCompare(b, "vi"));
    }, [questions]);

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
        const matchesExamTitle = examTitleSearch && examTitleSearch !== "all"
            ? q.examTitle === examTitleSearch
            : true;
        const matchesProvince = selectedProvince && selectedProvince !== "all" ? q.province === selectedProvince : true;
        const matchesDifficulty = selectedDifficulty && selectedDifficulty !== "all"
            ? (q.difficulty === selectedDifficulty || (Array.isArray(q.subQuestions) && q.subQuestions.some(sub => sub.difficulty === selectedDifficulty)))
            : true;
        const matchesTag = tagSearch && tagSearch !== "all"
            ? (q.tags && q.tags.includes(tagSearch)) 
            : true;

        return matchesSearch && matchesGrade && matchesSubject && matchesType && matchesExamTitle && matchesProvince && matchesDifficulty && matchesTag;
    });

    return {
        currentUser, loading,
        questions, searchTerm, setSearchTerm,
        tagSearch, setTagSearch, examTitleSearch, setExamTitleSearch,
        selectedGrade, setSelectedGrade, selectedSubject, setSelectedSubject,
        selectedType, setSelectedType, selectedProvince, setSelectedProvince,
        selectedDifficulty, setSelectedDifficulty,
        uniqueTags, uniqueExamTitles, filteredQuestions,
        toggleCollapse, handleDelete
    };
}
