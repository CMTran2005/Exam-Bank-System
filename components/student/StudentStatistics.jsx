"use client";

import { useState, useEffect } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { examAttemptService } from "@/services/examAttemptService";
import { Flame, Trophy, Target, TrendingUp, CalendarDays } from "lucide-react";
import { classService } from "@/services/classService";

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
    const [radarData, setRadarData] = useState([]);
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

            // 3. Prepare Radar Chart Data (Subjects)
            // Mock map of classId to subject for now if not available
            const subjectScores = {};
            const subjectCounts = {};
            
            completed.forEach(a => {
                if (a.score !== null && a.score !== undefined) {
                    let subjectName = "Khác";
                    if (a.classId === "practice") {
                        subjectName = "Tự do";
                    } else {
                        const classData = classes.find(c => c.id === a.classId);
                        if (classData && classData.subject) {
                            subjectName = classData.subject;
                        }
                    }
                    
                    if (!subjectScores[subjectName]) {
                        subjectScores[subjectName] = 0;
                        subjectCounts[subjectName] = 0;
                    }
                    subjectScores[subjectName] += parseFloat(a.score);
                    subjectCounts[subjectName] += 1;
                }
            });
            
            const rData = Object.keys(subjectScores).map(subject => ({
                subject: subject,
                score: parseFloat((subjectScores[subject] / subjectCounts[subject]).toFixed(1)),
                fullMark: 10
            }));
            
            // Default data if new student
            if (rData.length === 0) {
                rData.push({ subject: "Toán", score: 0, fullMark: 10 });
                rData.push({ subject: "Lý", score: 0, fullMark: 10 });
                rData.push({ subject: "Hóa", score: 0, fullMark: 10 });
                rData.push({ subject: "Anh", score: 0, fullMark: 10 });
            } else if (rData.length < 3) {
                rData.push({ subject: "Môn khác", score: 0, fullMark: 10 });
                rData.push({ subject: "Năng lực", score: 0, fullMark: 10 });
            }
            
            setRadarData(rData);

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

            {/* Cột 2: Radar Chart Năng lực */}
            <div className="lg:col-span-2 bg-card border border-border rounded-3xl shadow-sm p-6 flex flex-col">
                <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Biểu Đồ Năng Lực (Điểm Trung Bình)
                </h3>
                <div className="flex-1 w-full flex justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="var(--border)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 700 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'var(--muted-foreground)' }} />
                            <Radar name="Điểm TB" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
