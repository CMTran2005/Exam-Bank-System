import { collection, doc, setDoc, getDocs, getDoc, query, where, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Hàm hỗ trợ giới hạn thời gian chờ cho một Promise
 * @param {Promise} promise - Promise cần thực thi
 * @param {number} ms - Thời gian chờ tối đa bằng mili-giây (mặc định 3000ms)
 * @returns {Promise<any>}
 */
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
     * Khởi tạo một phiên làm bài thi mới cho học sinh
     * @param {string} studentUid - ID của học sinh
     * @param {string} studentName - Tên của học sinh
     * @param {string} examId - ID của đề thi
     * @param {string} classId - ID của lớp học (hoặc "practice" nếu là luyện tập tự do)
     * @returns {Promise<Object>} - Thông tin chi tiết của phiên làm bài (attempt)
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
     * Lưu trữ nháp các câu trả lời của học sinh trong quá trình làm bài
     * @param {string} attemptId - ID của phiên làm bài
     * @param {Object} answers - Đối tượng chứa các câu trả lời hiện tại
     * @returns {Promise<boolean>} - Trả về true nếu lưu thành công
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
     * Ghi nhận các hành vi có dấu hiệu gian lận trong quá trình thi
     * @param {string} attemptId - ID của phiên làm bài
     * @param {string} cheatReason - Lý do hoặc loại vi phạm (VD: chuyển tab, mất focus)
     * @returns {Promise<boolean|void>} - Trả về true nếu ghi nhận thành công
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
     * Gửi yêu cầu nộp bài thi lên Server API để xử lý và chấm điểm an toàn
     * @param {string} attemptId - ID của phiên làm bài
     * @param {string} examId - ID của đề thi
     * @param {string} studentId - ID của học sinh
     * @param {Object} answers - Bộ câu trả lời hoàn chỉnh
     * @returns {Promise<number>} - Điểm số đạt được sau khi chấm
     */
    async submitExam(attemptId, examId, studentId, answers) {
        if (!attemptId || !examId || !studentId) return false;
        try {
            const response = await fetch('/api/exams/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    attemptId,
                    examId,
                    studentId,
                    answers: answers || {}
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || "Lỗi chấm bài từ Server");
            }
            
            return data.score;
        } catch (error) {
            console.error("Lỗi submitExam API:", error);
            throw error;
        }
    },

    /**
     * Lấy toàn bộ lịch sử các bài thi đã tham gia của một học sinh
     * @param {string} studentUid - ID của học sinh
     * @returns {Promise<Array>} - Danh sách các phiên làm bài (sắp xếp mới nhất lên đầu)
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
     * Lấy danh sách kết quả làm bài của toàn bộ học sinh trong một lớp cho một đề thi cụ thể
     * @param {string} classId - ID của lớp học
     * @param {string} examId - ID của đề thi
     * @returns {Promise<Array>} - Danh sách kết quả bài làm (dành cho Giáo viên)
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
    },

    /**
     * Lấy bảng xếp hạng thành tích của một lớp học dựa trên tổng điểm các bài thi đã hoàn thành
     * @param {string} classId - ID của lớp học
     * @returns {Promise<Array>} - Danh sách học sinh kèm điểm số tổng và trung bình, sắp xếp giảm dần
     */
    async getClassLeaderboard(classId) {
        if (!classId) return [];
        try {
            const q = query(
                collection(db, "exam_attempts"), 
                where("classId", "==", classId), 
                where("status", "==", "completed")
            );
            const snapshot = await runWithTimeout(getDocs(q));
            
            const studentScores = {};
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                const studentId = data.studentId;
                const score = parseFloat(data.score || 0);
                
                if (!studentScores[studentId]) {
                    studentScores[studentId] = {
                        studentId: studentId,
                        studentName: data.studentName || "Học sinh ẩn danh",
                        totalScore: 0,
                        examCount: 0
                    };
                }
                studentScores[studentId].totalScore += score;
                studentScores[studentId].examCount += 1;
            });
            
            // Convert to array and sort by totalScore descending
            const leaderboard = Object.values(studentScores)
                .map(s => ({
                    ...s,
                    avgScore: s.examCount > 0 ? (s.totalScore / s.examCount).toFixed(1) : 0
                }))
                .sort((a, b) => b.totalScore - a.totalScore);
                
            return leaderboard;
        } catch (error) {
            console.error("Lỗi getClassLeaderboard:", error);
            throw error;
        }
    }
};
