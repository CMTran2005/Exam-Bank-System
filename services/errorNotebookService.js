import { collection, doc, getDocs, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { expCalculator } from "@/lib/expCalculator";
import { leagueService } from "@/services/leagueService";

/**
 * Service quản lý Sổ Tay Câu Sai (Error Notebook) của học sinh
 */
export const errorNotebookService = {
    /**
     * Lấy danh sách câu hỏi sai trong sổ tay của học sinh
     * @param {string} studentId - ID của học sinh
     * @returns {Promise<Array>} - Danh sách các câu hỏi sai
     */
    async getWrongQuestions(studentId) {
        if (!studentId) return [];
        try {
            const colRef = collection(db, "users", studentId, "error_notebook");
            const snapshot = await getDocs(colRef);
            const list = [];
            snapshot.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() });
            });
            // Sắp xếp câu hỏi mới thêm lên đầu
            return list.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        } catch (error) {
            console.error("Lỗi lấy sổ tay câu sai:", error);
            return [];
        }
    },

    /**
     * Cập nhật trạng thái luyện tập của một câu hỏi sai
     * @param {string} studentId - ID của học sinh
     * @param {string} questionId - ID của câu hỏi
     * @param {boolean} isCorrect - Trả lời đúng hay sai trong lần luyện tập này
     * @returns {Promise<Object>} - Đối tượng chứa trạng thái mới hoặc thông báo đã xóa
     */
    async updateQuestionReview(studentId, questionId, isCorrect) {
        if (!studentId || !questionId) throw new Error("Thiếu thông tin cập nhật.");

        try {
            const docRef = doc(db, "users", studentId, "error_notebook", questionId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error("Không tìm thấy câu hỏi trong sổ tay.");
            }

            const data = docSnap.data();
            let newAttempts = isCorrect ? (data.correctAttempts || 0) + 1 : 0;
            const earnedExp = expCalculator.calcNotebookExp(isCorrect, newAttempts);

            if (earnedExp > 0) {
                leagueService.addWeeklyExp(studentId, earnedExp).catch(err => console.error("Lỗi cộng EXP Notebook:", err));
            }

            if (newAttempts >= 3) {
                // Đạt 3 lần đúng liên tiếp -> Xóa khỏi sổ tay
                await deleteDoc(docRef);
                return { deleted: true, correctAttempts: newAttempts, earnedExp };
            } else {
                const updatedData = {
                    correctAttempts: newAttempts,
                    lastReviewed: new Date().toISOString()
                };
                await updateDoc(docRef, updatedData);
                return { deleted: false, correctAttempts: newAttempts, earnedExp, ...updatedData };
            }
        } catch (error) {
            console.error("Lỗi cập nhật luyện tập câu sai:", error);
            throw error;
        }
    }
};
