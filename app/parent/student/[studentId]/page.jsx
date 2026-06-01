"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChevronLeft, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { studentService } from "@/services/studentService";
import StudentSummaryCards from "@/components/parent/student-detail/StudentSummaryCards";
import StudentCharts from "@/components/parent/student-detail/StudentCharts";
import StudentExamHistory from "@/components/parent/student-detail/StudentExamHistory";

export default function ParentStudentDetail() {
    const params = useParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    
    const [studentData, setStudentData] = useState(null);
    const [classes, setClasses] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [radarData, setRadarData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [avgScore, setAvgScore] = useState(0);
    const [loading, setLoading] = useState(true);

    const studentId = params?.studentId;

    useEffect(() => {
        if (currentUser && studentId) {
            // Verify that this student is actually linked to the parent
            if (currentUser.children && currentUser.children.includes(studentId)) {
                loadStudentDetails();
            } else {
                router.push("/parent");
            }
        }
    }, [currentUser, studentId]);

    const loadStudentDetails = async () => {
        setLoading(true);
        try {
            // Lấy thông tin cơ bản của học sinh
            const studentSnap = await getDoc(doc(db, "users", studentId));
            if (studentSnap.exists()) {
                setStudentData({ id: studentSnap.id, ...studentSnap.data() });
            }

            // Lấy danh sách lớp mà học sinh đang học để map môn học trong thống kê
            const studentClasses = await studentService.getJoinedClasses(studentId);
            setClasses(studentClasses || []);

            // Lấy chi tiết toàn bộ lịch sử làm bài (Sắp xếp client-side an toàn)
            const attemptsQuery = query(
                collection(db, "exam_attempts"),
                where("studentId", "==", studentId)
            );
            const attemptsSnap = await getDocs(attemptsQuery);
            const attemptsData = attemptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    const timeA = a.startTime ? Date.parse(a.startTime) : 0;
                    const timeB = b.startTime ? Date.parse(b.startTime) : 0;
                    return timeB - timeA;
                });
            setAttempts(attemptsData);

            // Tính toán dữ liệu biểu đồ cho phụ huynh
            let total = 0;
            let count = 0;
            const subjectDataMap = {};
            const trendDataMap = [];

            attemptsData.forEach(a => {
                if (a.score !== null && a.score !== undefined) {
                    const score = parseFloat(a.score);
                    total += score;
                    count++;

                    // Môn học (cho Radar)
                    let sub = "Khác";
                    if (a.classId === "practice") sub = "Tự do";
                    else {
                        const matched = (studentClasses || []).find(c => c.id === a.classId);
                        if (matched) sub = matched.subject || "Khác";
                    }
                    if (!subjectDataMap[sub]) subjectDataMap[sub] = { name: sub, total: 0, count: 0 };
                    subjectDataMap[sub].total += score;
                    subjectDataMap[sub].count++;
                }
            });

            // -------------------------------------------------------------
            // XỬ LÝ DỮ LIỆU BIỂU ĐỒ TIẾN ĐỘ (Liên tục theo ngày)
            // -------------------------------------------------------------
            const scoredAttempts = attemptsData.filter(a => a.score !== null && a.score !== undefined && a.status === "completed");
            
            if (scoredAttempts.length > 0) {
                // Nhóm các bài thi theo ngày và tính điểm trung bình mỗi ngày
                const dailyData = {};
                let minDate = new Date();
                let maxDate = new Date("2000-01-01"); // Rất cũ để tìm max
                
                scoredAttempts.forEach(a => {
                    const d = new Date(a.startTime);
                    d.setHours(0, 0, 0, 0); // Đưa về đầu ngày
                    
                    if (d < minDate) minDate = new Date(d);
                    if (d > maxDate) maxDate = new Date(d);
                    
                    const dateStr = d.getTime();
                    if (!dailyData[dateStr]) {
                        dailyData[dateStr] = { totalScore: 0, count: 0 };
                    }
                    dailyData[dateStr].totalScore += parseFloat(a.score);
                    dailyData[dateStr].count += 1;
                });

                // Nếu thời gian từ minDate đến maxDate quá dài (VD: > 14 ngày), chỉ lấy 14 ngày gần nhất
                const maxDays = 14;
                const diffTime = Math.abs(maxDate - minDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays > maxDays) {
                    minDate = new Date(maxDate);
                    minDate.setDate(maxDate.getDate() - maxDays + 1);
                }

                // Sinh ra mốc thời gian liên tục từ minDate đến maxDate (để không bị khuyết ngày)
                const continuousTrend = [];
                let currDate = new Date(minDate);
                while (currDate <= maxDate) {
                    const timeKey = currDate.getTime();
                    let dailyCount = 0; // Đặt bằng 0 cho các ngày không có bài thi
                    
                    if (dailyData[timeKey]) {
                        dailyCount = dailyData[timeKey].count; // Lấy tổng số bài đã làm trong ngày
                    }

                    continuousTrend.push({
                        name: `${currDate.getDate()}/${currDate.getMonth() + 1}`,
                        count: dailyCount
                    });

                    currDate.setDate(currDate.getDate() + 1);
                }
                setTrendData(continuousTrend);
            } else {
                setTrendData([]);
            }

            // Phục hồi dữ liệu Radar Chart (Phổ điểm từng môn)
            setRadarData(Object.values(subjectDataMap).map(s => ({
                subject: s.name,
                score: parseFloat((s.total / s.count).toFixed(1))
            })));

            setAvgScore(count > 0 ? (total / count).toFixed(1) : 0);

        } catch (error) {
            console.error("Lỗi tải chi tiết học sinh:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="flex flex-col h-[60vh] items-center justify-center space-y-4">
                <p className="text-lg font-bold text-muted-foreground">Không tìm thấy thông tin học sinh.</p>
                <Button onClick={() => router.push("/parent")} variant="outline">
                    Quay lại
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => router.push("/parent")} className="rounded-xl shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-border shadow-sm overflow-hidden bg-muted flex items-center justify-center text-xl font-black text-muted-foreground shrink-0">
                        {studentData.photoURL ? (
                            <img src={studentData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            studentData.name?.charAt(0) || "H"
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-foreground leading-none">
                            Báo cáo của {studentData.name}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4" />
                            {studentData.grade ? `Học sinh lớp ${studentData.grade}` : "Thông tin học sinh"}
                        </p>
                    </div>
                </div>
            </div>

            {/* BẢNG TÓM TẮT ĐỘC QUYỀN CHO PHỤ HUYNH */}
            <StudentSummaryCards avgScore={avgScore} attempts={attempts} />

            {/* KHU VỰC BIỂU ĐỒ TRỰC QUAN */}
            <StudentCharts radarData={radarData} trendData={trendData} />

            {/* Chi tiết Bài Thi và Bài Luyện */}
            <StudentExamHistory attempts={attempts} classes={classes} />
        </div>
    );
}
