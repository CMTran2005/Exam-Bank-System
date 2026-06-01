import { doc, setDoc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const examCollaborationService = {
    /**
     * Khởi tạo một phiên bản nháp (Draft) mới trên Firestore để chuẩn bị soạn thảo đề thi
     * @param {string} uid - ID của người tạo (Giáo viên)
     * @returns {Promise<string>} - ID của đề thi (phiên soạn thảo)
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
     * Tham gia vào phòng soạn đề trực tuyến (Thêm thông tin người dùng vào danh sách đang hoạt động)
     * @param {string} examId - ID của phiên soạn thảo
     * @param {Object} user - Dữ liệu của người dùng tham gia (uid, name, photoURL)
     * @returns {Promise<void>}
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
     * Rời khỏi phòng soạn đề trực tuyến (Gỡ thông tin người dùng khỏi danh sách đang hoạt động)
     * @param {string} examId - ID của phiên soạn thảo
     * @param {string} uid - ID của người dùng
     * @returns {Promise<void>}
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
     * Lắng nghe sự thay đổi của đề thi theo thời gian thực (Real-time Sync)
     * @param {string} examId - ID của phiên soạn thảo
     * @param {Function} callback - Hàm xử lý dữ liệu mỗi khi có thay đổi
     * @returns {Function} - Hàm hủy lắng nghe (unsubscribe)
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
     * Cập nhật các thông tin cơ bản của đề thi (Tiêu đề, Môn học, Khối lớp...)
     * @param {string} examId - ID của phiên soạn thảo
     * @param {Object} updates - Đối tượng chứa các trường dữ liệu cần cập nhật
     * @returns {Promise<void>}
     */
    async updateExamInfo(examId, updates) {
        if (!examId) return;
        const docRef = doc(db, "exam_sessions", examId);
        await updateDoc(docRef, updates);
    },

    /**
     * Cập nhật lại toàn bộ danh sách câu hỏi của đề thi
     * @param {string} examId - ID của phiên soạn thảo
     * @param {Array} questions - Danh sách câu hỏi mới
     * @returns {Promise<void>}
     */
    async updateQuestions(examId, questions) {
        if (!examId) return;
        const docRef = doc(db, "exam_sessions", examId);
        await updateDoc(docRef, { questions });
    },

    /**
     * Khóa một câu hỏi (Lock) để tránh xung đột khi có người đang chỉnh sửa
     * @param {string} examId - ID của phiên soạn thảo
     * @param {Array} questions - Danh sách câu hỏi hiện tại
     * @param {string} questionId - ID của câu hỏi cần khóa
     * @param {string} uid - ID của người dùng đang chỉnh sửa
     * @returns {Promise<void>}
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
     * Mở khóa câu hỏi (Unlock) sau khi đã chỉnh sửa xong
     * @param {string} examId - ID của phiên soạn thảo
     * @param {Array} questions - Danh sách câu hỏi hiện tại
     * @param {string} questionId - ID của câu hỏi cần mở khóa
     * @param {string} uid - ID của người dùng đã khóa câu hỏi trước đó
     * @returns {Promise<void>}
     */
    async unlockQuestion(examId, questions, questionId, uid) {
        if (!examId || !questions) return;
        
        const updatedQuestions = questions.map(q => {
            if (q.id === questionId && q.lockedBy === uid) {
                const { lockedBy: _lockedBy, ...rest } = q;
                return rest;
            }
            return q;
        });
        
        await this.updateQuestions(examId, updatedQuestions);
    }
};
