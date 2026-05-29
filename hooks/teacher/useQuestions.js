import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/context/ConfirmContext";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQuestionFilterStore } from "@/store/useQuestionFilterStore";

export function useQuestions() {
    const confirmDialog = useConfirm();
    const { currentUser, loading } = useAuth();
    const router = useRouter();



    const {
        searchTerm, tagSearch, examTitleSearch, selectedGrade,
        selectedSubject, selectedType, selectedProvince, selectedDifficulty
    } = useQuestionFilterStore();

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    const { data: questions = [], mutate: mutateQuestions, isValidating: isQuestionsLoading } = useSWR(
        currentUser ? `questions_${currentUser.uid}` : null,
        async () => {
            // Fetch user's exams to get metadata like examTitle, grade, subject, province
            const examsQuery = query(collection(db, "exams"), where("uid", "==", currentUser.uid));
            const examsSnap = await getDocs(examsQuery);
            const examMeta = {};
            examsSnap.docs.forEach(doc => {
                const data = doc.data();
                examMeta[doc.id] = {
                    title: data.title,
                    grade: data.grade,
                    subject: data.subject,
                    province: data.province
                };
            });

            // Lấy từ collection questions (mới)
            const qQuery = query(collection(db, "questions"), where("uid", "==", currentUser.uid));
            const qSnap = await getDocs(qQuery);
            
            const allQuestions = [];
            qSnap.docs.forEach(qDoc => {
                const qData = qDoc.data();
                const meta = examMeta[qData.examId] || {};
                allQuestions.push({
                    ...qData,
                    examTitle: meta.title || "Không xác định",
                    province: meta.province || "",
                    grade: meta.grade || "",
                    subject: meta.subject || "",
                    isCollapsed: true,
                    typeName: qData.type === "multiple_choice" ? "Trắc nghiệm Đơn"
                        : qData.type === "group_multiple_choice" ? "Trắc nghiệm Nhóm"
                            : qData.type === "true_false" ? "Đúng / Sai Đơn"
                                : qData.type === "group_true_false" ? "Đúng / Sai Nhóm"
                                    : qData.type === "essay" ? "Tự luận Đơn" : "Tự luận Nhóm",
                    typeClass: qData.type?.includes("multiple_choice")
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                        : qData.type?.includes("true_false")
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                });
            });

            // Load từ legacy exams (nếu chưa migrate)
            examsSnap.docs.forEach(examDoc => {
                const data = examDoc.data();
                if (data.questions && data.questions.length > 0) {
                    data.questions.forEach(q => {
                        // Bỏ qua nếu đã có trong collection
                        if (allQuestions.find(existing => existing.id === q.id)) return;
                        allQuestions.push({
                            ...q,
                            examId: examDoc.id,
                            examTitle: data.title,
                            province: data.province || "",
                            grade: data.grade || "",
                            subject: data.subject || "",
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

            return allQuestions;
        },
        { fallbackData: [], revalidateOnFocus: false }
    );

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
        const updated = questions.map((q) => (q.id === id ? { ...q, isCollapsed: !q.isCollapsed } : q));
        mutateQuestions(updated, false);
    };

    const handleDelete = async (id, examId) => {
        if (await confirmDialog("Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng câu hỏi và đề thi tương ứng?", "Xóa câu hỏi")) {
            try {
                // Xóa ở Firestore questions
                const qRef = doc(db, "questions", String(id));
                await deleteDoc(qRef);

                // Giảm total_questions của exam
                if (examId) {
                    const examRef = doc(db, "exams", examId);
                    await updateDoc(examRef, {
                        total_questions: increment(-1)
                    });
                }

                const updated = questions.filter((q) => q.id !== id);
                mutateQuestions(updated, false);
            } catch (e) {
                console.error("Lỗi xóa câu hỏi:", e);
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
        currentUser, loading: loading || isQuestionsLoading,
        questions,
        uniqueTags, uniqueExamTitles, filteredQuestions,
        toggleCollapse, handleDelete
    };
}
