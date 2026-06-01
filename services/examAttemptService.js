import { collection, doc, setDoc, getDocs, getDoc, query, where, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const runWithTimeout = (promise, ms = 3000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

export const examAttemptService = {
    /**
     * Bắt đầu một bài thi mới
     */
    async startExam(studentUid, studentName, examId, classId) {
        try {
            // Sử dụng ID cố định cho thi thật, ID ngẫu nhiên (chứa timestamp) cho luyện thi
            let attemptId = `attempt_${studentUid}_${classId}_${examId}`;
            if (classId === "practice") {
                attemptId = `attempt_${studentUid}_practice_${examId}_${Date.now()}`;
            }

            const docRef = doc(db, "exam_attempts", attemptId);
            
            // Chỉ kiểm tra tồn tại (chống click đúp) đối với thi thật
            if (classId !== "practice") {
                const docSnap = await runWithTimeout(getDoc(docRef));
                if (docSnap.exists()) {
                    return { id: docSnap.id, ...docSnap.data() };
                }
            }

            const newAttempt = {
                id: attemptId,
                studentId: studentUid,
                studentName: studentName || "Học sinh ẩn danh",
                examId: examId,
                classId: classId,
                startTime: new Date().toISOString(),
                submitTime: null,
                answers: {}, 
                score: null,
                status: "in_progress"
            };
            
            await runWithTimeout(setDoc(docRef, newAttempt));
            return newAttempt;
        } catch (error) {
            console.error("Lỗi startExam:", error);
            throw error;
        }
    },

    /**
     * Lưu nháp câu trả lời trong lúc thi
     */
    async saveAnswersDraft(attemptId, answers) {
        try {
            const docRef = doc(db, "exam_attempts", attemptId);
            await runWithTimeout(updateDoc(docRef, { answers: answers, lastSaved: new Date().toISOString() }));
            return true;
        } catch (error) {
            console.error("Lỗi saveAnswersDraft:", error);
            throw error;
        }
    },

    /**
     * Ghi nhận hành vi gian lận (chuyển tab, thoát fullscreen)
     */
    async logCheat(attemptId, cheatReason) {
        if (!attemptId) return;
        try {
            const docRef = doc(db, "exam_attempts", attemptId);
            const updateData = {};
            if (cheatReason === "Chuyển Tab (Ẩn trình duyệt)" || cheatReason === "Mất Focus (Mở ứng dụng khác)") {
                updateData.tabSwitchCount = increment(1);
            } else if (cheatReason === "Phát hiện tiện ích mở rộng (Extension) can thiệp") {
                updateData.extensionCheatCount = increment(1);
            } else if (cheatReason === "Cố tình dùng phím tắt cấm") {
                updateData.shortcutCheatCount = increment(1);
            } else {
                updateData.otherCheatCount = increment(1);
            }
            await updateDoc(docRef, updateData);
            return true;
        } catch (error) {
            console.error("Lỗi logCheat:", error);
            // Không throw error để không làm gián đoạn bài thi
        }
    },

    /**
     * Nộp bài thi
     */
    async submitExam(attemptId, answers, score) {
        if (!attemptId) return false;
        try {
            const docRef = doc(db, "exam_attempts", attemptId);
            await runWithTimeout(updateDoc(docRef, {
                answers: answers || {},
                score: score !== undefined ? score : null,
                status: "completed",
                submitTime: new Date().toISOString()
            }));
            return true;
        } catch (error) {
            console.error("Lỗi submitExam:", error);
            throw error;
        }
    },

    /**
     * Lấy lịch sử làm bài của một học sinh
     */
    async getStudentAttempts(studentUid) {
        if (!studentUid) return [];
        try {
            const q = query(collection(db, "exam_attempts"), where("studentId", "==", studentUid));
            const snapshot = await runWithTimeout(getDocs(q));
            
            const attempts = [];
            snapshot.forEach((doc) => {
                attempts.push({ id: doc.id, ...doc.data() });
            });
            
            // Sắp xếp mới nhất lên đầu
            return attempts.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        } catch (error) {
            console.error("Lỗi getStudentAttempts:", error);
            throw error;
        }
    },

    /**
     * Lấy danh sách bài làm của một lớp cho một đề thi cụ thể (Dành cho Giáo viên)
     */
    async getExamAttemptsByClass(classId, examId) {
        try {
            const q = query(
                collection(db, "exam_attempts"), 
                where("classId", "==", classId),
                where("examId", "==", examId)
            );
            const snapshot = await runWithTimeout(getDocs(q));
            
            const attempts = [];
            snapshot.forEach((doc) => {
                attempts.push({ id: doc.id, ...doc.data() });
            });
            return attempts;
        } catch (error) {
            console.error("Lỗi getExamAttemptsByClass:", error);
            throw error;
        }
    }
};
