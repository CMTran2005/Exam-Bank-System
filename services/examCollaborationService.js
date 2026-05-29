import { doc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const examCollaborationService = {
    /**
     * Tạo một phiên bản nháp (Draft) mới trên Firestore để chuẩn bị soạn thảo.
     * Trả về ID của đề thi.
     */
    async createDraftSession(uid) {
        if (!uid) throw new Error("Chưa đăng nhập");
        const examId = crypto.randomUUID();
        const docRef = doc(db, "exam_sessions", examId);
        
        const initialData = {
            id: examId,
            creatorId: uid,
            title: "Đề thi mới (Chưa đặt tên)",
            code: "",
            grade: "Khối 12",
            subject: "Toán",
            questions: [],
            isDraft: true,
            createdAt: new Date().toISOString(),
            activeUsers: [], // Danh sách người đang online
        };

        await setDoc(docRef, initialData);
        return examId;
    },

    /**
     * Tham gia vào phòng soạn đề (Thêm UID vào activeUsers)
     */
    async joinSession(examId, user) {
        if (!user || !examId) return;
        const docRef = doc(db, "exam_sessions", examId);
        
        const userData = {
            uid: user.uid,
            name: user.name || "Giáo viên",
            avatar: user.photoURL || null,
            joinedAt: new Date().toISOString()
        };

        try {
            // Lọc ra các user cũ trùng UID nếu có
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const currentActive = snap.data().activeUsers || [];
                const filtered = currentActive.filter(u => u.uid !== user.uid);
                await updateDoc(docRef, {
                    activeUsers: [...filtered, userData]
                });
            }
        } catch (error) {
            console.error("Lỗi khi join session:", error);
        }
    },

    /**
     * Rời khỏi phòng soạn đề
     */
    async leaveSession(examId, uid) {
        if (!uid || !examId) return;
        const docRef = doc(db, "exam_sessions", examId);
        try {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const currentActive = snap.data().activeUsers || [];
                const filtered = currentActive.filter(u => u.uid !== uid);
                await updateDoc(docRef, { activeUsers: filtered });
            }
        } catch (error) {
            console.error("Lỗi khi leave session:", error);
        }
    },

    /**
     * Lắng nghe sự thay đổi của đề thi (Real-time Sync)
     */
    subscribeToSession(examId, callback) {
        if (!examId) return () => {};
        const docRef = doc(db, "exam_sessions", examId);
        
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            } else {
                callback(null);
            }
        });
    },

    /**
     * Cập nhật thông tin chung của đề thi (Tiêu đề, môn học...)
     */
    async updateExamInfo(examId, updates) {
        if (!examId) return;
        const docRef = doc(db, "exam_sessions", examId);
        await updateDoc(docRef, updates);
    },

    /**
     * Cập nhật danh sách câu hỏi
     */
    async updateQuestions(examId, questions) {
        if (!examId) return;
        const docRef = doc(db, "exam_sessions", examId);
        await updateDoc(docRef, { questions });
    },

    /**
     * Khóa một câu hỏi khi có người đang edit
     */
    async lockQuestion(examId, questions, questionId, uid) {
        if (!examId || !questions) return;
        
        const updatedQuestions = questions.map(q => {
            if (q.id === questionId) {
                return { ...q, lockedBy: uid };
            }
            return q;
        });
        
        await this.updateQuestions(examId, updatedQuestions);
    },

    /**
     * Mở khóa câu hỏi khi sửa xong
     */
    async unlockQuestion(examId, questions, questionId, uid) {
        if (!examId || !questions) return;
        
        const updatedQuestions = questions.map(q => {
            if (q.id === questionId && q.lockedBy === uid) {
                const { lockedBy, ...rest } = q;
                return rest;
            }
            return q;
        });
        
        await this.updateQuestions(examId, updatedQuestions);
    }
};
