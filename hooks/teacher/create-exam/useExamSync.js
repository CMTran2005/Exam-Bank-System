import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc, deleteDoc, writeBatch, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { examCollaborationService } from "@/services/examCollaborationService";
import { useExamDataStore } from "@/store/useExamDataStore";

const runWithTimeout = (promise, ms = 1000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
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

const makeUniqueCode = async (baseSlug, currentExamId) => {
    if (!baseSlug) return "";
    let candidate = baseSlug;
    let counter = 1;
    
    // 1. Lấy danh sách code từ local
    const savedExams = JSON.parse(localStorage.getItem("eb_exams") || "[]");
    
    // 2. Query nhanh Firestore xem có những đề nào trùng prefix
    let dbCodes = [];
    try {
        const examsRef = collection(db, "exams");
        const q = query(
            examsRef, 
            where("code", ">=", candidate), 
            where("code", "<=", candidate + "\uf8ff")
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (doc.id !== currentExamId) {
                dbCodes.push(data.code);
            }
        });
    } catch (e) {
        console.warn("Lỗi kiểm tra trùng mã trên Firestore:", e);
    }
    
    const allExistingCodes = new Set([
        ...savedExams.filter(e => e.id !== currentExamId).map(e => e.code),
        ...dbCodes
    ]);
    
    while (allExistingCodes.has(candidate)) {
        candidate = `${baseSlug}-${counter}`;
        counter++;
    }
    
    return candidate;
};

/**
 * Hàm useExamSync
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  currentUser - Tham số đầu vào
 * @returns {any}
 */
export function useExamSync({ currentUser, examId, confirmDialog }) {
    const router = useRouter();
    const [editId, setEditId] = useState(null);
    const isCodeManuallyEdited = useRef(false);
    const isSyncingFromRemote = useRef(false);
    const checkCodeTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (checkCodeTimeoutRef.current) clearTimeout(checkCodeTimeoutRef.current);
        };
    }, []);

    const {
        examInfo, setExamInfo,
        questionsList, setQuestionsList,
        activeUsers, setActiveUsers,
        lastSaved, setLastSaved
    } = useExamDataStore();

    // Khởi tạo dữ liệu khi tải trang (Load Data)
    useEffect(() => {
        const loadExamData = async () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                const id = params.get("editId") || examId;
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
                            title: examToEdit.title || "", code: examToEdit.code || examToEdit.id || "",
                            year: examToEdit.year || "", grade: examToEdit.grade || "",
                            subject: examToEdit.subject || "", province: examToEdit.province || "",
                            duration: examToEdit.duration !== undefined ? String(examToEdit.duration) : "",
                            isPublic: examToEdit.isPublic || false,
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
                                try { await deleteDoc(doc(db, "drafts", currentUser.uid)); } catch (e) { console.warn("Lỗi xóa nháp Firebase:", e); }
                            }
                        }
                    }
                }
            }
        };
        
        const initRealtimeSession = async () => {
            if (examId && currentUser) {
                setEditId(examId);
                isCodeManuallyEdited.current = true;
                
                examCollaborationService.joinSession(examId, currentUser);
                
                const unsubscribe = examCollaborationService.subscribeToSession(examId, (data) => {
                    if (data) {
                        isSyncingFromRemote.current = true;
                        setExamInfo(prev => {
                            const { questions, activeUsers, ...examInfoRemote } = data;
                            const newInfo = { ...prev, ...examInfoRemote };
                            return JSON.stringify(prev) !== JSON.stringify(newInfo) ? newInfo : prev;
                        });
                        setQuestionsList(prev => {
                            return JSON.stringify(prev) !== JSON.stringify(data.questions || []) ? (data.questions || []) : prev;
                        });
                        setActiveUsers(data.activeUsers || []);
                        setTimeout(() => isSyncingFromRemote.current = false, 100);
                    } else {
                        loadExamData();
                    }
                });
                
                return unsubscribe;
            } else {
                loadExamData();
                return () => {};
            }
        };

        let unsub = () => {};
        initRealtimeSession().then(fn => unsub = fn);

        return () => {
            unsub();
            if (examId && currentUser) {
                examCollaborationService.leaveSession(examId, currentUser.uid);
            }
        };
    }, [currentUser, examId]);

    // Cơ chế tự động lưu dữ liệu (Auto-save)
    useEffect(() => {
        if (!examInfo.title && questionsList.length === 0) return;
        const timer = setTimeout(async () => {
            const draft = { examInfo, questionsList, timestamp: new Date().toISOString() };
            localStorage.setItem("eb_exam_draft", JSON.stringify(draft));
            
            if (currentUser?.uid) {
                try {
                    const cleanDraft = JSON.parse(JSON.stringify(draft));
                    await setDoc(doc(db, "drafts", currentUser.uid), cleanDraft);
                } catch (err) { console.warn("Lỗi lưu nháp Cloud:", err); }
            }
            setLastSaved(new Date());
        }, 5000);
        return () => clearTimeout(timer);
    }, [examInfo, questionsList, currentUser]);

    const handleExamInfoChange = (field, value) => {
        setExamInfo((prev) => {
            const updated = { ...prev, [field]: value };
            
            // Xử lý tự động tạo mã đề thi từ tiêu đề nếu người dùng chưa tự chỉnh sửa mã
            if (field === 'title' && !isCodeManuallyEdited.current) {
                const slug = slugify(value);
                updated.code = slug;

                if (checkCodeTimeoutRef.current) clearTimeout(checkCodeTimeoutRef.current);
                if (slug) {
                    checkCodeTimeoutRef.current = setTimeout(async () => {
                        const uniqueCode = await makeUniqueCode(slug, editId || examId);
                        setExamInfo(p => {
                            if (!isCodeManuallyEdited.current && slugify(p.title) === slug) {
                                const newInfo = { ...p, code: uniqueCode };
                                if (examId && !isSyncingFromRemote.current) {
                                    examCollaborationService.updateExamInfo(examId, newInfo);
                                }
                                return newInfo;
                            }
                            return p;
                        });
                    }, 600);
                }
            }
            
            // Đánh dấu là đã chỉnh sửa mã thủ công
            if (field === 'code') {
                isCodeManuallyEdited.current = true;
                updated.code = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
            }
            
            // Xóa môn học khi đổi cấp học (vì danh sách môn sẽ khác nhau)
            if (field === 'grade') {
                updated.subject = "";
            }
            
            if (examId && !isSyncingFromRemote.current) {
                examCollaborationService.updateExamInfo(examId, updated);
            }
            return updated;
        });
    };

    const handleSaveExam = async () => {
        if (!examInfo.title.trim()) return toast.error("Vui lòng nhập Tiêu đề đề thi.");
        if (questionsList.length === 0) return toast.error("Vui lòng thêm ít nhất một câu hỏi.");

        const savedExams = JSON.parse(localStorage.getItem("eb_exams") || "[]");
        const finalId = examInfo.code || editId || `exam_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        let existingExam = null;
        try {
            const docSnap = await getDoc(doc(db, "exams", finalId));
            if (docSnap.exists()) {
                existingExam = docSnap.data();
            }
        } catch (e) {}

        const finalExamPayload = {
            id: finalId, 
            uid: existingExam?.uid || currentUser?.uid || "anonymous", 
            author: existingExam?.author || currentUser?.name || "Giáo viên",
            title: examInfo.title, year: examInfo.year, grade: examInfo.grade,
            subject: examInfo.subject, province: examInfo.province, 
            duration: Number(examInfo.duration) || 90,
            code: finalId, 
            isPublic: examInfo.isPublic || false,
            total_questions: questionsList.length, 
            updatedAt: new Date().toISOString(),
        };

        if (existingExam?.createdAt) finalExamPayload.createdAt = existingExam.createdAt;
        if (existingExam?.forkedFrom) finalExamPayload.forkedFrom = existingExam.forkedFrom;

        try {
            const batch = writeBatch(db);

            // Thu hồi các câu hỏi cũ không còn tồn tại trong danh sách hiện tại (khi cập nhật)
            if (editId) {
                // Query theo editId (mã cũ) để dọn dẹp câu hỏi cũ
                const qSnap = await getDocs(query(collection(db, "questions"), where("examId", "==", editId)));
                const currentQuestionIds = questionsList.map(q => String(q.id));
                qSnap.docs.forEach(d => {
                    if (!currentQuestionIds.includes(d.id)) batch.delete(d.ref);
                });

                // Nếu đổi mã đề thi (editId !== finalId), ta cần xóa bản ghi cũ ở Firestore
                if (editId !== finalId) {
                    batch.delete(doc(db, "exams", editId));
                }
            }

            // Lưu trữ thông tin từng câu hỏi hiện tại vào bộ sưu tập câu hỏi (questions collection)
            const cleanQuestions = JSON.parse(JSON.stringify(questionsList));
            cleanQuestions.forEach((q, index) => {
                const qDocRef = doc(db, "questions", String(q.id));
                const { isCollapsed, ...rest } = q;
                batch.set(qDocRef, {
                    ...rest,
                    examId: finalId,
                    uid: finalExamPayload.uid,
                    order: index
                }, { merge: true });
            });

            // Ghi nhận cấu hình (Metadata) của đề thi vào bộ sưu tập đề thi (exams collection)
            const examDocRef = doc(db, "exams", finalId);
            const cleanPayload = JSON.parse(JSON.stringify(finalExamPayload));
            batch.set(examDocRef, cleanPayload, { merge: true });

            await runWithTimeout(batch.commit(), 15000);
        } catch (err) {
            console.error("Lỗi Firestore khi lưu đề thi:", err.message);
            return toast.error("Có lỗi khi lưu lên Cloud: " + err.message);
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
        if (currentUser?.uid) {
            try { await deleteDoc(doc(db, "drafts", currentUser.uid)); } catch (e) {}
        }
        toast.success(editId ? "Cập nhật đề thi thành công!" : "Lưu đề thi mới thành công!");
        router.push("/my-exams");
    };

    return {
        editId, isCodeManuallyEdited, isSyncingFromRemote, activeUsers,
        examInfo, setExamInfo, questionsList, setQuestionsList, lastSaved,
        handleExamInfoChange, handleSaveExam
    };
}
