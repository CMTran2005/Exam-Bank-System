import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, limit, orderBy, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

const runWithTimeout = (promise, ms = 2000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

export const examService = {
    /**
     * Lấy danh sách đề thi của một người dùng
     * @param {string} uid User ID
     * @returns Array of exams
     */
    async getUserExams(uid) {
        if (!uid) return [];
        try {
            const q = query(collection(db, "exams"), where("uid", "==", uid));
            const querySnapshot = await runWithTimeout(getDocs(q));
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            return list;
        } catch (error) {
            console.warn("Lỗi fetch getUserExams:", error);
            throw error;
        }
    },

    /**
     * Lấy chi tiết một đề thi
     * @param {string} examId ID của đề thi
     */
    async getExamDetails(examId) {
        if (!examId) return null;
        try {
            const docRef = doc(db, "exams", examId);
            const docSnap = await runWithTimeout(getDoc(docRef));
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Tương thích ngược: Nếu không có mảng questions (cấu trúc mới), fetch từ collection questions
                if (!data.questions || data.questions.length === 0) {
                    try {
                        const qSnap = await runWithTimeout(getDocs(query(collection(db, "questions"), where("examId", "==", examId))));
                        data.questions = qSnap.docs.map(d => d.data()).sort((a, b) => (a.order || 0) - (b.order || 0));
                    } catch (e) {
                        console.warn("Lỗi khi fetch questions collection:", e);
                        data.questions = [];
                    }
                }
                return { id: docSnap.id, ...data };
            }
            return null;
        } catch (error) {
            console.warn("Lỗi fetch getExamDetails:", error);
            throw error;
        }
    },

    /**
     * Lấy danh sách đề thi chia sẻ (Công khai)
     * @param {string} currentUid ID của người dùng hiện tại (để loại trừ)
     * @param {number} maxLimit Số lượng tối đa
     */
    async getSharedExams(currentUid, maxLimit = 50) {
        try {
            const q = query(collection(db, "exams"), where("isPublic", "==", true), limit(maxLimit));
            const querySnapshot = await runWithTimeout(getDocs(q));
            const list = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.uid && data.uid !== currentUid) {
                    list.push({ id: doc.id, ...data });
                }
            });
            return list;
        } catch (error) {
            console.warn("Lỗi fetch getSharedExams:", error);
            throw error;
        }
    },

    /**
     * Nhân bản đề thi từ Cộng đồng về tài khoản của mình
     * @param {string} examId ID của đề thi gốc
     * @param {string} newUid ID của người dùng (giáo viên) mới
     * @param {string} newAuthorName Tên tác giả mới
     */
    async forkExam(examId, newUid, newAuthorName) {
        try {
            const docRef = doc(db, "exams", examId);
            const docSnap = await runWithTimeout(getDoc(docRef));
            
            if (!docSnap.exists()) {
                throw new Error("Không tìm thấy đề thi gốc.");
            }
            
            const originalData = docSnap.data();
            const newExamId = `exam_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            
            // Lấy questions (nếu là cấu trúc mới thì fetch)
            let questionsToCopy = originalData.questions || [];
            if (questionsToCopy.length === 0) {
                const qSnap = await getDocs(query(collection(db, "questions"), where("examId", "==", examId)));
                questionsToCopy = qSnap.docs.map(d => d.data()).sort((a, b) => (a.order || 0) - (b.order || 0));
            }

            const forkedExam = {
                ...originalData,
                id: newExamId,
                uid: newUid,
                author: newAuthorName,
                isPublic: false,
                title: originalData.title + " (Bản sao)",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                forkedFrom: examId
            };
            
            delete forkedExam.questions;
            forkedExam.total_questions = questionsToCopy.length;

            const batch = writeBatch(db);
            const newExamRef = doc(db, "exams", newExamId);
            batch.set(newExamRef, forkedExam);

            questionsToCopy.forEach((q, index) => {
                const newQId = Date.now() + Math.random();
                const qRef = doc(db, "questions", String(newQId));
                batch.set(qRef, {
                    ...q,
                    id: newQId,
                    examId: newExamId,
                    uid: newUid,
                    order: index
                });
            });

            await runWithTimeout(batch.commit());
            return newExamId;
        } catch (error) {
            console.warn("Lỗi forkExam:", error);
            throw error;
        }
    },

    /**
     * Xóa đề thi (chuyển vào thùng rác)
     */
    async moveToTrash(examId, examData) {
        try {
            // Backup questions
            let questionsList = examData.questions || [];
            if (questionsList.length === 0) {
                const qSnap = await getDocs(query(collection(db, "questions"), where("examId", "==", examId)));
                questionsList = qSnap.docs.map(d => d.data());
            }

            const trashedExam = {
                ...examData,
                questions: questionsList,
                deletedAt: new Date().toISOString()
            };
            
            const batch = writeBatch(db);
            const trashDocRef = doc(db, "trash_exams", examId);
            batch.set(trashDocRef, trashedExam);

            const examDocRef = doc(db, "exams", examId);
            batch.delete(examDocRef);

            // Xóa ở questions
            if (!examData.questions || examData.questions.length === 0) {
                const qSnap = await getDocs(query(collection(db, "questions"), where("examId", "==", examId)));
                qSnap.docs.forEach(d => batch.delete(d.ref));
            }

            await runWithTimeout(batch.commit());
            return true;
        } catch (error) {
            console.warn("Lỗi moveToTrash:", error);
            throw error;
        }
    },

    /**
     * Khôi phục đề thi từ thùng rác
     */
    async restoreFromTrash(examId, examData) {
        try {
            const { deletedAt, questions, ...restData } = examData;
            const restoredExam = {
                ...restData,
                updatedAt: new Date().toISOString(),
                total_questions: (questions || []).length
            };

            const batch = writeBatch(db);
            const examDocRef = doc(db, "exams", examId);
            batch.set(examDocRef, restoredExam);

            (questions || []).forEach((q, index) => {
                const qRef = doc(db, "questions", String(q.id));
                batch.set(qRef, { ...q, examId, uid: restoredExam.uid, order: index });
            });

            const trashDocRef = doc(db, "trash_exams", examId);
            batch.delete(trashDocRef);
            
            await runWithTimeout(batch.commit());
            return true;
        } catch (error) {
            console.warn("Lỗi restoreFromTrash:", error);
            throw error;
        }
    }
};
