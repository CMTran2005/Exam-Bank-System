import { collection, doc, setDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const flashcardService = {
    /**
     * Tự động trích xuất và lưu trữ các câu hỏi học sinh làm sai vào kho Flashcard cá nhân
     * @param {string} uid - ID của học sinh
     * @param {Object} exam - Đối tượng đề thi chứa danh sách câu hỏi
     * @param {Object} answers - Bộ câu trả lời của học sinh
     * @returns {Promise<void>}
     */
    async saveMistakes(uid, exam, answers) {
        if (!uid || !exam || !answers) return;

        try {
            const alphabet = ["A", "B", "C", "D", "E", "F"];

            for (const q of exam.questions) {
                let isWrong = false;
                let studentAns = answers[q.id];

                // Bỏ qua nếu không làm
                if (studentAns === undefined || studentAns === null) continue;

                // Xác định đúng sai tùy theo type
                if (q.type === 'multiple_choice' || q.type === 'group_multiple_choice') {
                    const studentLetter = alphabet[studentAns];
                    if (studentLetter !== q.correct_answer) {
                        isWrong = true;
                    }
                } else if (q.type === 'true_false' || q.type === 'group_true_false') {
                    const stmts = q.statements || [];
                    let stmtCorrectCount = 0;
                    stmts.forEach((stmt, idx) => {
                        if (studentAns && studentAns[idx] === stmt.correct) {
                            stmtCorrectCount++;
                        }
                    });
                    if (stmtCorrectCount !== stmts.length) isWrong = true;
                } else if (q.type === 'fill_blank' || q.type === 'group_fill_blank') {
                    const regex = /\[\[(.*?)\]\]/g;
                    const correctAnswers = [];
                    let match;
                    while ((match = regex.exec(q.content || "")) !== null) {
                        correctAnswers.push(match[1].trim().toLowerCase());
                    }
                    let blankCorrectCount = 0;
                    correctAnswers.forEach((correct, idx) => {
                        const sAns = (studentAns && studentAns[idx] || "").trim().toLowerCase();
                        if (sAns && sAns === correct) blankCorrectCount++;
                    });
                    if (blankCorrectCount !== correctAnswers.length) isWrong = true;
                }

                if (isWrong) {
                    const flashcardId = `${uid}_${q.id}`;
                    const docRef = doc(db, "flashcards", flashcardId);
                    
                    const flashcardData = {
                        uid,
                        examId: exam.id,
                        examTitle: exam.title,
                        subject: exam.subject || "Khác",
                        questionData: q,
                        studentAnswer: studentAns,
                        createdAt: new Date().toISOString(),
                        // Thuật toán SuperMemo-2 (Spaced Repetition)
                        nextReviewDate: new Date().toISOString(),
                        interval: 1,
                        easeFactor: 2.5,
                        repetitions: 0
                    };
                    
                    await setDoc(docRef, flashcardData, { merge: true });
                }
            }
        } catch (error) {
            console.error("Lỗi khi lưu flashcards:", error);
        }
    },

    /**
     * Lấy danh sách toàn bộ Flashcards (câu hỏi ôn tập) của một học sinh
     * @param {string} uid - ID của học sinh
     * @returns {Promise<Array>} - Danh sách các Flashcards
     */
    async getUserFlashcards(uid) {
        if (!uid) return [];
        try {
            const q = query(collection(db, "flashcards"), where("uid", "==", uid));
            const snapshot = await getDocs(q);
            const list = [];
            snapshot.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() });
            });
            return list;
        } catch (error) {
            console.error("Lỗi lấy flashcards:", error);
            return [];
        }
    },

    /**
     * Cập nhật trạng thái của Flashcard sau khi học sinh ôn tập dựa trên thuật toán Spaced Repetition (SM-2)
     * @param {Object} flashcard - Đối tượng Flashcard hiện tại
     * @param {number} quality - Điểm chất lượng của câu trả lời (từ 0 đến 5)
     *        0: Hoàn toàn không nhớ
     *        1: Nhớ sai
     *        2: Có nhớ mang máng nhưng sai
     *        3: Nhớ đúng nhưng mất nhiều thời gian
     *        4: Nhớ đúng sau một chút do dự
     *        5: Nhớ đúng ngay lập tức (Perfect)
     * @returns {Promise<Object>} - Đối tượng chứa thông số SM-2 mới được cập nhật
     */
    async updateFlashcardReview(flashcard, quality) {
        let { interval, easeFactor, repetitions } = flashcard;

        if (quality >= 3) {
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            repetitions++;
        } else {
            repetitions = 0;
            interval = 1;
        }

        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);

        const updatedData = {
            interval,
            easeFactor,
            repetitions,
            nextReviewDate: nextReviewDate.toISOString(),
            lastReviewedAt: new Date().toISOString()
        };

        try {
            const docRef = doc(db, "flashcards", flashcard.id);
            await updateDoc(docRef, updatedData);
            return updatedData;
        } catch (error) {
            console.error("Lỗi cập nhật flashcard:", error);
            throw error;
        }
    }
};
