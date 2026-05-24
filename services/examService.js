import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, limit, orderBy } from "firebase/firestore";
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
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.warn("Lỗi fetch getExamDetails:", error);
            throw error;
        }
    },

    /**
     * Lấy danh sách đề thi chia sẻ (của người khác)
     * @param {string} currentUid ID của người dùng hiện tại (để loại trừ)
     * @param {number} maxLimit Số lượng tối đa
     */
    async getSharedExams(currentUid, maxLimit = 50) {
        try {
            const q = query(collection(db, "exams"), limit(maxLimit));
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
     * Xóa đề thi (chuyển vào thùng rác)
     */
    async moveToTrash(examId, examData) {
        try {
            const trashedExam = {
                ...examData,
                deletedAt: new Date().toISOString()
            };
            const trashDocRef = doc(db, "trash_exams", examId);
            await runWithTimeout(setDoc(trashDocRef, trashedExam));

            const examDocRef = doc(db, "exams", examId);
            await runWithTimeout(deleteDoc(examDocRef));
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
            // Remove deletedAt
            const { deletedAt, ...restData } = examData;
            const restoredExam = {
                ...restData,
                updatedAt: new Date().toISOString()
            };

            const examDocRef = doc(db, "exams", examId);
            await runWithTimeout(setDoc(examDocRef, restoredExam));

            const trashDocRef = doc(db, "trash_exams", examId);
            await runWithTimeout(deleteDoc(trashDocRef));
            return true;
        } catch (error) {
            console.warn("Lỗi restoreFromTrash:", error);
            throw error;
        }
    }
};
