/**
 * @fileoverview Cỗ máy tính toán điểm Kinh nghiệm (EXP Economy) cho toàn bộ hệ thống Gamification.
 * Đảm bảo cân bằng động lực học tập và chống lạm dụng (Spam).
 */

export const expCalculator = {
    /**
     * 1 & 3. Tính EXP cho chế độ Thi thật và Luyện thi (Practice Mode)
     * @param {number} score - Điểm số (Hệ điểm 10)
     * @param {boolean} isPractice - true nếu là Luyện thi tự do
     * @param {number} attemptCount - Số lần đã nộp lại đề này (Mặc định: 1)
     * @returns {number} - Lượng EXP làm tròn
     */
    calcExamExp(score, isPractice = false, attemptCount = 1) {
        const baseExp = 20; // Điểm chuyên cần nộp bài
        const scoreExp = (Number(score) || 0) * 10;
        const totalBase = baseExp + scoreExp;

        if (!isPractice) {
            // Chế độ Thi thật (Exam): Hệ số 1.0, Không suy giảm (Repetition Decay)
            return Math.round(totalBase * 1.0);
        } else {
            // Chế độ Luyện thi (Practice): Hệ số 0.6
            const modeMultiplier = 0.6;
            let repetitionDecay = 1.0;

            // Cơ chế chống Spam (Cày đi cày lại 1 đề dễ)
            if (attemptCount === 2) repetitionDecay = 0.7;
            else if (attemptCount === 3) repetitionDecay = 0.4;
            else if (attemptCount >= 4) repetitionDecay = 0.15;

            return Math.round(totalBase * modeMultiplier * repetitionDecay);
        }
    },

    /**
     * 2. Tính EXP cho chế độ Đấu trí trực tiếp (Live Quiz)
     * @param {number} correctAnswersCount - Số câu trả lời đúng
     * @param {number} rank - Xếp hạng cuối trận (1, 2, 3...)
     * @returns {number}
     */
    calcLiveQuizExp(correctAnswersCount, rank) {
        const baseJoinExp = 30; // Phí chuyên cần tham gia trận đấu
        const scoreExp = (Number(correctAnswersCount) || 0) * 5; // +5 EXP cho mỗi câu trả lời đúng
        
        let leaderboardBonus = 0;
        if (rank === 1) leaderboardBonus = 50;
        else if (rank === 2) leaderboardBonus = 30;
        else if (rank === 3) leaderboardBonus = 15;

        return baseJoinExp + scoreExp + leaderboardBonus;
    },

    /**
     * 4. Tính EXP cho chế độ Sổ tay Câu sai (Error Notebook)
     * @param {boolean} isCorrect - Trả lời đúng hay sai trong lần đối mặt này
     * @param {number} currentCorrectAttempts - Số lần đã trả lời đúng liên tiếp (Tính cả lần hiện tại)
     * @returns {number}
     */
    calcNotebookExp(isCorrect, currentCorrectAttempts) {
        if (!isCorrect) return 1; // Khích lệ vì đã dám mở ra ôn tập lại lỗ hổng
        
        if (currentCorrectAttempts === 1 || currentCorrectAttempts === 2) {
            return 5; // Cố lên, sắp khắc phục được rồi
        } else if (currentCorrectAttempts >= 3) {
            return 15; // Bonus Thức tỉnh: Hoàn toàn làm chủ được câu sai và xóa khỏi sổ tay
        }
        return 0;
    },

    /**
     * 5. Tính EXP cho chế độ Thẻ ghi nhớ (Flashcards - Spaced Repetition SM-2)
     * @param {number} quality - Mức độ nhạy bén của trí nhớ (Từ 0 đến 5)
     * @returns {number}
     */
    calcFlashcardExp(quality) {
        if (quality === 5) return 5;
        if (quality === 4) return 4;
        if (quality === 3) return 3;
        if (quality === 2 || quality === 1) return 1; // Mờ nhạt hoặc sai nhưng có lật thẻ
        return 0;
    }
};
