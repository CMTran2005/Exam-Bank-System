import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/context/ConfirmContext";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQuestionFilterStore } from "@/store/useQuestionFilterStore";

/**
 * Hàm useQuestions
 * Xử lý logic và chức năng liên quan.
 *
 * @returns {any}
 */
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
            // Truy xuất danh sách đề thi của người dùng để lấy các siêu dữ liệu (metadata) như tiêu đề, khối lớp, môn học
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

            const getTypeName = (type) => {
                switch (type) {
                    case "multiple_choice": return "Trắc nghiệm Đơn";
                    case "group_multiple_choice": return "Trắc nghiệm Nhóm";
                    case "true_false": return "Đúng / Sai Đơn";
                    case "group_true_false": return "Đúng / Sai Nhóm";
                    case "essay": return "Tự luận Đơn";
                    case "group_essay": return "Tự luận Nhóm";
                    case "fill_blank": return "Điền khuyết Đơn";
                    case "group_fill_blank": return "Điền khuyết Nhóm";
                    case "matching": return "Nối từ Đơn";
                    case "group_matching": return "Nối từ Nhóm";
                    case "ordering": return "Sắp xếp Đơn";
                    case "group_ordering": return "Sắp xếp Nhóm";
                    default: return "Chưa phân loại";
                }
            };

            const getTypeClass = (type) => {
                if (type?.includes("multiple_choice")) return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700";
                if (type?.includes("true_false")) return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700";
                if (type?.includes("fill_blank")) return "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700";
                if (type?.includes("matching")) return "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700";
                if (type?.includes("ordering")) return "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700";
                return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700";
            };

            // Thu thập dữ liệu từ bộ sưu tập câu hỏi độc lập (kiến trúc mới)
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
                    typeName: getTypeName(qData.type),
                    typeClass: getTypeClass(qData.type)
                });
            });

            // Hỗ trợ tương thích ngược: Tải dữ liệu từ cấu trúc đề thi cũ (nếu chưa được di chuyển)
            examsSnap.docs.forEach(examDoc => {
                const data = examDoc.data();
                if (data.questions && data.questions.length > 0) {
                    data.questions.forEach(q => {
                        // Bỏ qua quá trình lấy dữ liệu cũ nếu câu hỏi đã được đồng bộ sang cấu trúc mới
                        if (allQuestions.find(existing => existing.id === q.id)) return;
                        allQuestions.push({
                            ...q,
                            examId: examDoc.id,
                            examTitle: data.title,
                            province: data.province || "",
                            grade: data.grade || "",
                            subject: data.subject || "",
                            isCollapsed: true,
                            typeName: getTypeName(q.type),
                            typeClass: getTypeClass(q.type)
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
                // Tiến hành xóa câu hỏi trực tiếp trên cơ sở dữ liệu (Firestore)
                const qRef = doc(db, "questions", String(id));
                await deleteDoc(qRef);

                // Cập nhật giảm bộ đếm tổng số câu hỏi của đề thi tương ứng
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
