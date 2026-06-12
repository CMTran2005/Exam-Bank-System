import { collection, doc, setDoc, getDocs, getDoc, query, where, updateDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

const runWithTimeout = (promise, ms = 5000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

export const liveQuizService = {
    /**
     * Tạo một phiên Live Quiz mới
     * @param {string} examId - ID đề thi
     * @param {string} hostUid - UID của giáo viên
     * @param {Object} examData - Dữ liệu đề thi (tiêu đề, danh sách câu hỏi)
     * @param {Object} settings - Cấu hình cài đặt của giáo viên
     * @returns {Promise<Object>} - Phiên chơi vừa tạo
     */
    async createSession(examId, hostUid, examData, settings = {}) {
        try {
            // Tạo mã PIN ngẫu nhiên 6 chữ số
            const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
            const sessionId = `live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            
            const sessionData = {
                id: sessionId,
                pinCode,
                examId,
                examTitle: examData.title || "Đề thi Live",
                questions: examData.questions || [],
                hostUid,
                status: "waiting", // waiting | playing | finished
                currentQuestionIndex: -1,
                questionStartTime: null,
                settings: {
                    durationPerQuestion: settings.durationPerQuestion || 30, // tính bằng giây
                    maxPoints: settings.maxPoints || 1000,
                    scoringMethod: settings.scoringMethod || "time-decay", // time-decay | flat
                    shuffleQuestions: settings.shuffleQuestions || false,
                    shuffleAnswers: settings.shuffleAnswers || false,
                    revealAnswers: settings.revealAnswers !== false, // hiển thị đáp án đúng sau mỗi câu
                    ...settings
                },
                createdAt: new Date().toISOString(),
            };

            // Trộn câu hỏi nếu được chọn
            if (sessionData.settings.shuffleQuestions && sessionData.questions.length > 0) {
                sessionData.questions = [...sessionData.questions].sort(() => Math.random() - 0.5);
            }

            // Trộn các đáp án trong từng câu hỏi nếu được chọn
            if (sessionData.settings.shuffleAnswers && sessionData.questions.length > 0) {
                sessionData.questions = sessionData.questions.map(q => {
                    if (q.type === "multiple_choice" && Array.isArray(q.options)) {
                        const optionsWithIndex = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
                        const shuffled = [...optionsWithIndex].sort(() => Math.random() - 0.5);
                        
                        // Tìm chỉ mục đáp án đúng mới
                        const originalCorrectIndex = Number(q.correctAnswer);
                        const newCorrectIndex = shuffled.findIndex(item => item.originalIndex === originalCorrectIndex);
                        
                        return {
                            ...q,
                            options: shuffled.map(item => item.text),
                            correctAnswer: newCorrectIndex.toString()
                        };
                    }
                    return q;
                });
            }

            const docRef = doc(db, "live_sessions", sessionId);
            await runWithTimeout(setDoc(docRef, sessionData));
            return sessionData;
        } catch (error) {
            console.error("Lỗi createSession:", error);
            throw error;
        }
    },

    /**
     * Tham gia phòng chờ Live Quiz bằng mã PIN
     * @param {string} pinCode - Mã PIN 6 chữ số
     * @param {string} studentUid - UID học sinh
     * @param {string} studentName - Tên học sinh
     * @returns {Promise<Object>} - Thông tin phiên chơi
     */
    async joinSession(pinCode, studentUid, studentName) {
        try {
            // Tìm phòng chờ có mã PIN đang active
            const q = query(
                collection(db, "live_sessions"),
                where("pinCode", "==", pinCode),
                where("status", "==", "waiting")
            );
            const querySnap = await runWithTimeout(getDocs(q));
            
            if (querySnap.empty) {
                throw new Error("Không tìm thấy phòng thi nào có mã PIN này hoặc phòng đã bắt đầu chơi.");
            }

            const sessionDoc = querySnap.docs[0];
            const sessionData = { id: sessionDoc.id, ...sessionDoc.data() };
            
            // Đăng ký học sinh vào sub-collection players
            const playerRef = doc(db, "live_sessions", sessionData.id, "players", studentUid);
            const playerData = {
                uid: studentUid,
                name: studentName,
                score: 0,
                streak: 0,
                joinedAt: new Date().toISOString(),
                lastAnsweredIndex: -1,
                lastAnswerCorrect: false,
                answers: {} // questionIndex -> { answer, timeTaken, scoreEarned }
            };

            await runWithTimeout(setDoc(playerRef, playerData));
            return sessionData;
        } catch (error) {
            console.error("Lỗi joinSession:", error);
            throw error;
        }
    },

    /**
     * Bắt đầu chơi phiên Live Quiz
     * @param {string} sessionId - ID phiên chơi
     * @returns {Promise<boolean>}
     */
    async startSession(sessionId) {
        try {
            const docRef = doc(db, "live_sessions", sessionId);
            await runWithTimeout(updateDoc(docRef, {
                status: "playing",
                currentQuestionIndex: 0,
                questionStartTime: serverTimestamp()
            }));
            return true;
        } catch (error) {
            console.error("Lỗi startSession:", error);
            throw error;
        }
    },

    /**
     * Chuyển sang câu hỏi kế tiếp
     * @param {string} sessionId - ID phiên chơi
     * @param {number} nextIndex - Chỉ số câu hỏi tiếp theo
     * @returns {Promise<boolean>}
     */
    async nextQuestion(sessionId, nextIndex) {
        try {
            const docRef = doc(db, "live_sessions", sessionId);
            await runWithTimeout(updateDoc(docRef, {
                currentQuestionIndex: nextIndex,
                questionStartTime: serverTimestamp()
            }));
            return true;
        } catch (error) {
            console.error("Lỗi nextQuestion:", error);
            throw error;
        }
    },

    /**
     * Kết thúc phiên chơi Live Quiz
     * @param {string} sessionId - ID phiên chơi
     * @returns {Promise<boolean>}
     */
    async endSession(sessionId) {
        try {
            const docRef = doc(db, "live_sessions", sessionId);
            await runWithTimeout(updateDoc(docRef, {
                status: "finished"
            }));
            return true;
        } catch (error) {
            console.error("Lỗi endSession:", error);
            throw error;
        }
    },

    /**
     * Nộp đáp án câu hỏi từ phía học sinh
     * @param {string} sessionId - ID phiên chơi
     * @param {string} studentUid - UID học sinh
     * @param {number} questionIndex - Chỉ số câu hỏi đang trả lời
     * @param {string} answer - Đáp án học sinh chọn
     * @param {boolean} isCorrect - Đúng hay sai
     * @param {number} timeTaken - Thời gian làm bài (giây)
     * @param {Object} settings - Cấu hình điểm số của phiên chơi
     * @returns {Promise<number>} - Số điểm kiếm được
     */
    async submitAnswer(sessionId, studentUid, questionIndex, answer, isCorrect, timeTaken, settings) {
        try {
            const playerRef = doc(db, "live_sessions", sessionId, "players", studentUid);
            let scoreEarned = 0;

            if (isCorrect) {
                const maxPoints = settings.maxPoints || 1000;
                const timeLimit = settings.durationPerQuestion || 30;

                if (settings.scoringMethod === "time-decay") {
                    // Thuật toán tính điểm giảm dần:
                    // Trả lời ngay lập tức được 100% điểm
                    // Trả lời ở giây cuối cùng được tối thiểu 50% điểm
                    const ratio = Math.max(0, Math.min(1, timeTaken / timeLimit));
                    scoreEarned = Math.round(maxPoints * (1 - ratio * 0.5));
                } else {
                    // Điểm cố định
                    scoreEarned = maxPoints;
                }
            }

            // Sử dụng transaction để tăng điểm số, streak một cách an toàn
            await runTransaction(db, async (transaction) => {
                const playerDoc = await transaction.get(playerRef);
                if (!playerDoc.exists()) {
                    throw new Error("Không tìm thấy dữ liệu người chơi.");
                }

                const playerData = playerDoc.data();
                
                // Tránh nộp bài trùng lặp cho cùng một câu hỏi
                if (playerData.answers && playerData.answers[questionIndex]) {
                    return; // Đã nộp rồi
                }

                const currentScore = playerData.score || 0;
                const currentStreak = playerData.streak || 0;
                
                const newStreak = isCorrect ? currentStreak + 1 : 0;
                const newScore = currentScore + scoreEarned;

                const updatedAnswers = {
                    ...(playerData.answers || {}),
                    [questionIndex]: {
                        answer,
                        timeTaken,
                        scoreEarned,
                        isCorrect
                    }
                };

                transaction.update(playerRef, {
                    score: newScore,
                    streak: newStreak,
                    lastAnsweredIndex: questionIndex,
                    lastAnswerCorrect: isCorrect,
                    answers: updatedAnswers
                });
            });

            return scoreEarned;
        } catch (error) {
            console.error("Lỗi submitAnswer:", error);
            throw error;
        }
    },

    /**
     * Lấy danh sách bảng xếp hạng học sinh hiện tại của phiên chơi
     * @param {string} sessionId - ID phiên chơi
     * @returns {Promise<Array>} - Danh sách xếp hạng người chơi
     */
    async getPlayersList(sessionId) {
        try {
            const q = collection(db, "live_sessions", sessionId, "players");
            const querySnap = await getDocs(q);
            const list = [];
            querySnap.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() });
            });
            // Sắp xếp giảm dần theo điểm số
            return list.sort((a, b) => b.score - a.score);
        } catch (error) {
            console.error("Lỗi getPlayersList:", error);
            throw error;
        }
    }
};
