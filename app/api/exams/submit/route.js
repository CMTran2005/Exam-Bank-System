import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Component POST
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any} request - Tham số đầu vào
 * @returns {JSX.Element}
 */
export async function POST(request) {
    try {
        const { attemptId, examId, answers, studentId } = await request.json();

        if (!attemptId || !examId || !studentId) {
            return NextResponse.json({ error: "Thiếu thông tin yêu cầu." }, { status: 400 });
        }

        if (!adminDb) {
            return NextResponse.json({ error: "Lỗi cấu hình Firebase Admin." }, { status: 500 });
        }

        // Bước 1: Lấy thông tin gốc của đề thi từ cơ sở dữ liệu (Firestore)
        const examDoc = await adminDb.collection("exams").doc(examId).get();
        if (!examDoc.exists) {
            return NextResponse.json({ error: "Không tìm thấy đề thi." }, { status: 404 });
        }
        
        const examData = examDoc.data();
        let questions = examData.questions || [];

        // Nếu mảng questions rỗng, có thể câu hỏi được lưu ở collection "questions" riêng (cấu trúc cũ)
        if (questions.length === 0) {
            const qSnap = await adminDb.collection("questions").where("examId", "==", examId).get();
            questions = qSnap.docs.map(doc => doc.data());
        }

        // Bước 2: Bắt đầu tiến trình tự động chấm điểm dựa trên bộ đáp án chuẩn
        let totalPoints = 0;
        let maxPossibleScore = 0;
        const alphabet = ["A", "B", "C", "D", "E", "F"];

        const cleanAndNormalize = (text) => {
            if (text === undefined || text === null) return "";
            return text
                .toString()
                .replace(/<[^>]*>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim()
                .toLowerCase()
                .replace(/,/g, ".");
        };

        const gradeSingleQuestion = (qObj, sAns) => {
            if (sAns === undefined || sAns === null) return 0;
            let earnedPoints = 0;
            let isCorrect = false;

            if (qObj.type === 'true_false') {
                const stmts = qObj.statements || [];
                let stmtCorrectCount = 0;
                stmts.forEach((stmt, idx) => {
                    if (sAns[idx] === stmt.correct) stmtCorrectCount++;
                });
                
                // Quy tắc tính điểm Đúng/Sai chuẩn BGD 2025 (4 ý):
                // 1 ý đúng: 0.1 điểm, 2 ý đúng: 0.25 điểm, 3 ý đúng: 0.5 điểm, 4 ý đúng: 1.0 điểm
                const basePoints = parseFloat(qObj.points || "1");
                if (stmts.length === 4) {
                    if (stmtCorrectCount === 1) earnedPoints = 0.1 * basePoints;
                    else if (stmtCorrectCount === 2) earnedPoints = 0.25 * basePoints;
                    else if (stmtCorrectCount === 3) earnedPoints = 0.5 * basePoints;
                    else if (stmtCorrectCount === 4) earnedPoints = 1.0 * basePoints;
                } else {
                    // Nếu không phải chuẩn 4 ý, tính tỷ lệ %
                    if (stmts.length > 0) {
                        earnedPoints = (stmtCorrectCount / stmts.length) * basePoints;
                    }
                }
                return earnedPoints;
            } else if (qObj.type === 'fill_blank') {
                const regex = /\[\[(.*?)\]\]/g;
                const correctAnswers = [];
                let match;
                while ((match = regex.exec(qObj.content || "")) !== null) {
                    correctAnswers.push(cleanAndNormalize(match[1]));
                }
                let blankCorrectCount = 0;
                correctAnswers.forEach((correct, idx) => {
                    const ans = cleanAndNormalize(sAns[idx]);
                    if (ans && ans === correct) blankCorrectCount++;
                });
                if (blankCorrectCount === correctAnswers.length && correctAnswers.length > 0) isCorrect = true;
            } else if (qObj.type === 'essay') {
                const finalAns = cleanAndNormalize(qObj.final_answer);
                const ans = cleanAndNormalize(sAns);
                if (finalAns && ans === finalAns) isCorrect = true;
            } else {
                const studentLetter = alphabet[sAns];
                if (studentLetter === qObj.correct_answer) isCorrect = true;
            }

            if (isCorrect) {
                earnedPoints = parseFloat(qObj.points || "1");
            }
            return earnedPoints;
        };

        questions.forEach(q => {
            const studentAns = answers[q.id];
            
            // Tính tổng điểm tối đa của đề thi
            if (q.type && q.type.startsWith('group_')) {
                if (q.subQuestions && q.subQuestions.length > 0) {
                    q.subQuestions.forEach(subQ => {
                        maxPossibleScore += parseFloat(subQ.points || "1");
                        if (studentAns !== undefined && studentAns !== null) {
                            const subAns = studentAns[subQ.id];
                            totalPoints += gradeSingleQuestion(subQ, subAns);
                        }
                    });
                }
            } else {
                maxPossibleScore += parseFloat(q.points || "1");
                if (studentAns !== undefined && studentAns !== null) {
                    totalPoints += gradeSingleQuestion(q, studentAns);
                }
            }
        });

        // Bước 3: Cập nhật điểm số vào bản ghi bài làm thông qua quyền ưu tiên (Admin SDK) nhằm vượt qua hệ thống Security Rules
        const attemptRef = adminDb.collection("exam_attempts").doc(attemptId);
        await attemptRef.update({
            answers: answers || {},
            score: totalPoints,
            maxScore: maxPossibleScore,
            status: "completed",
            submitTime: new Date().toISOString()
        });

        return NextResponse.json({ success: true, score: totalPoints, maxScore: maxPossibleScore });

    } catch (error) {
        console.error("Lỗi khi chấm điểm trên Server:", error);
        return NextResponse.json({ error: "Lỗi hệ thống khi xử lý bài nộp." }, { status: 500 });
    }
}
