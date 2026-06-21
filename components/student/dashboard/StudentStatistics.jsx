"use client";

import { useState, useEffect } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { examAttemptService } from "@/services/examAttemptService";
import { Flame, Trophy, Target, TrendingUp, CalendarDays, BookOpen, Sword } from "lucide-react";
import { classService } from "@/services/classService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Component StudentStatistics
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  studentUid - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function StudentStatistics({ studentUid, classes = [] }) {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [officialRadarData, setOfficialRadarData] = useState([]);
    const [practiceRadarData, setPracticeRadarData] = useState([]);
    const [streak, setStreak] = useState(0);
    const [stats, setStats] = useState({ totalExams: 0, avgScore: 0, totalPractice: 0 });

    useEffect(() => {
        if (studentUid) {
            loadStats();
        }
    }, [studentUid, classes]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await examAttemptService.getStudentAttempts(studentUid);
            setAttempts(data);
            
            // 1. Calculate general stats
            const completed = data.filter(a => a.status === "completed");
            const practiceCount = data.filter(a => a.classId === "practice" && a.status === "completed").length;
            
            let totalScore = 0;
            let validScoreCount = 0;
            completed.forEach(a => {
                if (a.score !== null && a.score !== undefined) {
                    totalScore += parseFloat(a.score);
                    validScoreCount++;
                }
            });
            
            setStats({
                totalExams: completed.length,
                totalPractice: practiceCount,
                avgScore: validScoreCount > 0 ? (totalScore / validScoreCount).toFixed(1) : 0
            });

            // 2. Calculate Streak
            let currentStreak = 0;
            let today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Group attempts by date
            const daysActive = new Set();
            data.forEach(a => {
                const d = new Date(a.startTime);
                d.setHours(0, 0, 0, 0);
                daysActive.add(d.getTime());
            });
            
            const sortedDays = Array.from(daysActive).sort((a, b) => b - a); // Descending
            
            // Check if active today or yesterday
            if (sortedDays.length > 0) {
                const lastActive = sortedDays[0];
                const diffDays = Math.floor((today.getTime() - lastActive) / (1000 * 60 * 60 * 24));
                
                if (diffDays <= 1) { // Active today or yesterday
                    currentStreak = 1;
                    let checkDate = lastActive;
                    for (let i = 1; i < sortedDays.length; i++) {
                        checkDate = checkDate - (1000 * 60 * 60 * 24); // previous day
                        if (sortedDays[i] === checkDate) {
                            currentStreak++;
                        } else {
                            break;
                        }
                    }
                }
            }
            setStreak(currentStreak);

            // 3. Lấy môn học cho các bài luyện tập
            const practiceAttempts = completed.filter(a => a.classId === "practice");
            const uniqueExamIds = [...new Set(practiceAttempts.map(a => a.examId).filter(Boolean))];
            const examSubjectsMap = {};
            
            await Promise.all(uniqueExamIds.map(async (examId) => {
                try {
                    const snap = await getDoc(doc(db, "exams", examId));
                    if (snap.exists()) {
                        examSubjectsMap[examId] = snap.data().subject || "Chưa phân loại";
                    } else {
                        examSubjectsMap[examId] = "Đề đã xóa";
                    }
                } catch (e) {
                    examSubjectsMap[examId] = "Chưa phân loại";
                }
            }));

            // 4. Prepare Radar Chart Data (Split into Official and Practice)
            const officialScores = {};
            const officialCounts = {};
            const practiceScores = {};
            const practiceCounts = {};
            
            completed.forEach(a => {
                if (a.score !== null && a.score !== undefined) {
                    if (a.classId === "practice") {
                        const subjectName = examSubjectsMap[a.examId] || "Chưa phân loại";
                        if (!practiceScores[subjectName]) { practiceScores[subjectName] = 0; practiceCounts[subjectName] = 0; }
                        practiceScores[subjectName] += parseFloat(a.score);
                        practiceCounts[subjectName] += 1;
                    } else {
                        let subjectName = "Chưa phân loại";
                        const classData = classes.find(c => c.id === a.classId);
                        if (classData && classData.subject) {
                            subjectName = classData.subject;
                        }
                        if (!officialScores[subjectName]) { officialScores[subjectName] = 0; officialCounts[subjectName] = 0; }
                        officialScores[subjectName] += parseFloat(a.score);
                        officialCounts[subjectName] += 1;
                    }
                }
            });
            
            const formatRadarData = (scores, counts) => {
                const rData = Object.keys(scores).map(subject => ({
                    subject: subject,
                    score: parseFloat((scores[subject] / counts[subject]).toFixed(1)),
                    fullMark: 10
                }));
                
                // Cần ít nhất 3-4 trục để biểu đồ Radar vẽ thành đa giác thay vì 1 đường thẳng
                const defaultPadding = ["Toán học", "Vật lý", "Hóa học", "Tiếng Anh", "Ngữ Văn"];
                let i = 0;
                while (rData.length < 3 && i < defaultPadding.length) {
                    const subj = defaultPadding[i];
                    if (!rData.find(d => d.subject === subj)) {
                        rData.push({ subject: subj, score: 0, fullMark: 10 });
                    }
                    i++;
                }
                return rData;
            };
            
            setOfficialRadarData(formatRadarData(officialScores, officialCounts));
            setPracticeRadarData(formatRadarData(practiceScores, practiceCounts));

        } catch (error) {
            console.error("Lỗi tải thống kê:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="h-64 animate-pulse bg-card rounded-3xl border border-border"></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Cột 1: Thông số tổng quan & Streak */}
            <div className="flex flex-col gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-3xl text-white shadow-md relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                        <Flame className="w-32 h-32" />
                    </div>
                    <h3 className="text-white/80 font-bold mb-1 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-yellow-300" />
                        Chuỗi Ngày Học Tập
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black">{streak}</span>
                        <span className="text-white/80 font-bold">ngày</span>
                    </div>
                    <p className="text-sm mt-3 text-white/90 font-medium">
                        {streak > 0 ? "Giữ vững phong độ nhé! Đừng để chuỗi bị đứt." : "Hãy làm một bài tập hôm nay để bắt đầu chuỗi!"}
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="bg-card border border-border p-5 rounded-3xl shadow-sm flex flex-col justify-center items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                            <Target className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-foreground">{stats.totalExams}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Đã Hoàn Thành</span>
                    </div>
                    <div className="bg-card border border-border p-5 rounded-3xl shadow-sm flex flex-col justify-center items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-foreground">{stats.avgScore}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Điểm Trung Bình</span>
                    </div>
                </div>
            </div>

            {/* Cột 2: Radar Charts Năng lực */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Biểu đồ Thi Chính Thức */}
                <div className="bg-card border border-border rounded-3xl shadow-sm p-6 flex flex-col">
                    <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                        <Sword className="w-5 h-5 text-indigo-500" />
                        Năng Lực Thi Thật
                    </h3>
                    <div className="flex-1 w-full flex justify-center">
                        <ResponsiveContainer width="100%" height={260}>
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={officialRadarData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'var(--muted-foreground)' }} />
                                <Radar name="Điểm TB Thi Thật" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Biểu đồ Luyện Thi */}
                <div className="bg-card border border-border rounded-3xl shadow-sm p-6 flex flex-col">
                    <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-500" />
                        Năng Lực Luyện Tập
                    </h3>
                    <div className="flex-1 w-full flex justify-center">
                        <ResponsiveContainer width="100%" height={260}>
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={practiceRadarData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'var(--muted-foreground)' }} />
                                <Radar name="Điểm TB Luyện Tập" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
