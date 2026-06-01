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
        const questions = examData.questions || [];

        // Bước 2: Bắt đầu tiến trình tự động chấm điểm dựa trên bộ đáp án chuẩn
        let totalPoints = 0;
        const alphabet = ["A", "B", "C", "D", "E", "F"];

        questions.forEach(q => {
            const studentAns = answers[q.id];
            if (studentAns !== undefined && studentAns !== null) {
                let isCorrect = false;

                if (q.type === 'true_false') {
                    const stmts = q.statements || [];
                    let stmtCorrectCount = 0;
                    stmts.forEach((stmt, idx) => {
                        if (studentAns[idx] === stmt.correct) {
                            stmtCorrectCount++;
                        }
                    });
                    if (stmtCorrectCount === stmts.length && stmts.length > 0) isCorrect = true;
                } else if (q.type === 'fill_blank') {
                    const regex = /\[\[(.*?)\]\]/g;
                    const correctAnswers = [];
                    let match;
                    while ((match = regex.exec(q.content || "")) !== null) {
                        correctAnswers.push(match[1].trim().toLowerCase());
                    }
                    let blankCorrectCount = 0;
                    correctAnswers.forEach((correct, idx) => {
                        const sAns = (studentAns[idx] || "").trim().toLowerCase();
                        if (sAns && sAns === correct) blankCorrectCount++;
                    });
                    if (blankCorrectCount === correctAnswers.length && correctAnswers.length > 0) isCorrect = true;
                } else if (q.type === 'essay') {
                    // Chấm điểm cho loại câu hỏi Tự luận (Đánh giá khớp chuỗi tuyệt đối - Có thể tích hợp AI ở Phase sau)
                    const finalAns = (q.final_answer || "").trim().toLowerCase();
                    const sAns = (studentAns || "").trim().toLowerCase();
                    if (finalAns && sAns === finalAns) isCorrect = true;
                } else {
                    // Chấm điểm cho loại câu hỏi Trắc nghiệm một lựa chọn (Multiple choice)
                    const studentLetter = alphabet[studentAns];
                    if (studentLetter === q.correct_answer) {
                        isCorrect = true;
                    }
                }

                if (isCorrect) {
                    const qPoints = parseFloat(q.points || "1");
                    totalPoints += qPoints;
                }
            }
        });

        // Bước 3: Cập nhật điểm số vào bản ghi bài làm thông qua quyền ưu tiên (Admin SDK) nhằm vượt qua hệ thống Security Rules
        const attemptRef = adminDb.collection("exam_attempts").doc(attemptId);
        await attemptRef.update({
            answers: answers || {},
            score: totalPoints,
            status: "completed",
            submitTime: new Date().toISOString()
        });

        return NextResponse.json({ success: true, score: totalPoints });

    } catch (error) {
        console.error("Lỗi khi chấm điểm trên Server:", error);
        return NextResponse.json({ error: "Lỗi hệ thống khi xử lý bài nộp." }, { status: 500 });
    }
}
