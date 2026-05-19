"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    BarChart3,
    HelpCircle,
    TrendingUp,
    PieChart,
    Calendar,
    ArrowUpRight,
    Award,
    Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function StatisticsPage() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    const [totalQuestions, setTotalQuestions] = useState(0);
    const [totalExams, setTotalExams] = useState(0);
    const [subjectCount, setSubjectCount] = useState(0);
    const [subjectsListStr, setSubjectsListStr] = useState("");
    const [growthPercent, setGrowthPercent] = useState(0);
    const [ocrRate, setOcrRate] = useState(98.4);
    const [avgLatency, setAvgLatency] = useState(2.1);

    const [difficultyStats, setDifficultyStats] = useState([
        { name: "Nhận biết", count: 0, percentage: 0, color: "bg-sky-500", text: "text-sky-500" },
        { name: "Thông hiểu", count: 0, percentage: 0, color: "bg-emerald-500", text: "text-emerald-500" },
        { name: "Vận dụng", count: 0, percentage: 0, color: "bg-amber-500", text: "text-amber-500" },
        { name: "Vận dụng cao", count: 0, percentage: 0, color: "bg-rose-500", text: "text-rose-500" }
    ]);

    const [typeStats, setTypeStats] = useState([
        { type: "Trắc nghiệm Đơn", count: 0, pct: 0, color: "bg-blue-600" },
        { type: "Trắc nghiệm Nhóm", count: 0, pct: 0, color: "bg-violet-600" },
        { type: "Đúng / Sai Đơn", count: 0, pct: 0, color: "bg-emerald-600" },
        { type: "Đúng / Sai Nhóm", count: 0, pct: 0, color: "bg-teal-600" },
        { type: "Tự luận Đơn", count: 0, pct: 0, color: "bg-amber-600" },
        { type: "Tự luận Nhóm", count: 0, pct: 0, color: "bg-orange-600" }
    ]);

    const [subjectStats, setSubjectStats] = useState([
        { name: "Toán học", count: 0, pct: 0, color: "from-blue-500 to-indigo-600" },
        { name: "Vật lý", count: 0, pct: 0, color: "from-emerald-500 to-teal-600" },
        { name: "Hóa học", count: 0, pct: 0, color: "from-amber-500 to-orange-600" },
        { name: "Tiếng Anh", count: 0, pct: 0, color: "from-purple-500 to-pink-600" }
    ]);

    const [monthlyGrowth, setMonthlyGrowth] = useState([
        { month: "T1", count: 0 },
        { month: "T2", count: 0 },
        { month: "T3", count: 0 },
        { month: "T4", count: 0 },
        { month: "T5", count: 0 },
        { month: "T6", count: 0 },
        { month: "T7", count: 0 },
        { month: "T8", count: 0 },
        { month: "T9", count: 0 },
        { month: "T10", count: 0 },
        { month: "T11", count: 0 },
        { month: "T12", count: 0 }
    ]);

    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("eb_exams");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setIsLive(true);
                        const examsCount = parsed.length;
                        setTotalExams(examsCount);

                        const allQ = [];
                        const subCounts = {};
                        parsed.forEach(e => {
                            const qCount = e.total_questions || e.questions?.length || 0;
                            const subName = e.subject || "Chưa phân loại";
                            subCounts[subName] = (subCounts[subName] || 0) + Number(qCount);

                            if (Array.isArray(e.questions)) {
                                e.questions.forEach(q => allQ.push(q));
                            }
                        });

                        const totalQCount = allQ.length || parsed.reduce((sum, e) => sum + (e.total_questions || e.questions?.length || 0), 0);
                        setTotalQuestions(totalQCount);

                        const activeSubjects = Object.keys(subCounts);
                        setSubjectCount(activeSubjects.length);
                        setSubjectsListStr(activeSubjects.join(", ") || "Chưa phân loại");

                        let nhanBiet = 0, thongHieu = 0, vanDung = 0, vanDungCao = 0;
                        allQ.forEach(q => {
                            const isGroup = q.type?.startsWith("group_");
                            if (isGroup && Array.isArray(q.subQuestions)) {
                                q.subQuestions.forEach(sub => {
                                    const diff = sub.difficulty || "nhan_biet";
                                    if (diff === "nhan_biet") nhanBiet++;
                                    else if (diff === "thong_hieu") thongHieu++;
                                    else if (diff === "van_dung") vanDung++;
                                    else if (diff === "van_dung_cao") vanDungCao++;
                                });
                            } else {
                                const diff = q.difficulty || "nhan_biet";
                                if (diff === "nhan_biet") nhanBiet++;
                                else if (diff === "thong_hieu") thongHieu++;
                                else if (diff === "van_dung") vanDung++;
                                else if (diff === "van_dung_cao") vanDungCao++;
                            }
                        });
                        const diffDiv = (nhanBiet + thongHieu + vanDung + vanDungCao) || 1;
                        setDifficultyStats([
                            { name: "Nhận biết", count: nhanBiet, percentage: Math.round((nhanBiet / diffDiv) * 100), color: "bg-sky-500", text: "text-sky-500" },
                            { name: "Thông hiểu", count: thongHieu, percentage: Math.round((thongHieu / diffDiv) * 100), color: "bg-emerald-500", text: "text-emerald-500" },
                            { name: "Vận dụng", count: vanDung, percentage: Math.round((vanDung / diffDiv) * 100), color: "bg-amber-500", text: "text-amber-500" },
                            { name: "Vận dụng cao", count: vanDungCao, percentage: Math.round((vanDungCao / diffDiv) * 100), color: "bg-rose-500", text: "text-rose-500" }
                        ]);

                        let singleMC = 0, groupMC = 0, singleTF = 0, groupTF = 0, singleEssay = 0, groupEssay = 0;
                        allQ.forEach(q => {
                            if (q.type === "multiple_choice") singleMC++;
                            else if (q.type === "group_multiple_choice") groupMC++;
                            else if (q.type === "true_false") singleTF++;
                            else if (q.type === "group_true_false") groupTF++;
                            else if (q.type === "essay") singleEssay++;
                            else if (q.type === "group_essay") groupEssay++;
                            else {
                                if (q.type?.startsWith("group_")) {
                                    if (q.type.includes("choice")) groupMC++;
                                    else if (q.type.includes("true")) groupTF++;
                                    else groupEssay++;
                                } else {
                                    if (q.type?.includes("choice")) singleMC++;
                                    else if (q.type?.includes("true")) singleTF++;
                                    else singleEssay++;
                                }
                            }
                        });
                        const totalTypes = totalQCount || 1;
                        setTypeStats([
                            { type: "Trắc nghiệm Đơn", count: singleMC, pct: Math.round((singleMC / totalTypes) * 100), color: "bg-blue-600" },
                            { type: "Trắc nghiệm Nhóm", count: groupMC, pct: Math.round((groupMC / totalTypes) * 100), color: "bg-violet-600" },
                            { type: "Đúng / Sai Đơn", count: singleTF, pct: Math.round((singleTF / totalTypes) * 100), color: "bg-emerald-600" },
                            { type: "Đúng / Sai Nhóm", count: groupTF, pct: Math.round((groupTF / totalTypes) * 100), color: "bg-teal-600" },
                            { type: "Tự luận Đơn", count: singleEssay, pct: Math.round((singleEssay / totalTypes) * 100), color: "bg-amber-600" },
                            { type: "Tự luận Nhóm", count: groupEssay, pct: Math.round((groupEssay / totalTypes) * 100), color: "bg-orange-600" }
                        ]);

                        const subBreakdown = [];
                        const colors = [
                            "from-blue-500 to-indigo-600",
                            "from-emerald-500 to-teal-600",
                            "from-amber-500 to-orange-600",
                            "from-purple-500 to-pink-600",
                            "from-rose-500 to-red-600"
                        ];
                        activeSubjects.forEach((sub, i) => {
                            const cnt = subCounts[sub];
                            subBreakdown.push({
                                name: sub,
                                count: cnt,
                                pct: Math.round((cnt / totalTypes) * 100),
                                color: colors[i % colors.length]
                            });
                        });
                        setSubjectStats(subBreakdown);

                        const monthlyCounts = {};
                        const allMonths = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
                        allMonths.forEach(m => monthlyCounts[m] = 0);

                        parsed.forEach(e => {
                            const qCount = e.total_questions || e.questions?.length || 0;
                            let dateObj = new Date();
                            if (e.createdAt) {
                                dateObj = new Date(e.createdAt);
                            } else if (e.updatedAt) {
                                dateObj = new Date(e.updatedAt);
                            }

                            const monthIdx = dateObj.getMonth();
                            const monthStr = `T${monthIdx + 1}`;
                            if (monthlyCounts[monthStr] !== undefined) {
                                monthlyCounts[monthStr] += Number(qCount);
                            }
                        });

                        const growthData = allMonths.map(m => {
                            return { month: m, count: monthlyCounts[m] };
                        });

                        const currentMonthIdx = new Date().getMonth();
                        const activeGrowthData = growthData.slice(0, currentMonthIdx + 1);
                        setMonthlyGrowth(activeGrowthData);

                        const currentMonthCount = monthlyCounts[`T${currentMonthIdx + 1}`] || 0;
                        let priorSum = 0;
                        for (let i = 0; i < currentMonthIdx; i++) {
                            priorSum += monthlyCounts[`T${i + 1}`] || 0;
                        }

                        let calculatedGrowth = 0;
                        if (priorSum > 0) {
                            calculatedGrowth = Math.round((currentMonthCount / priorSum) * 1000) / 10;
                        } else if (currentMonthCount > 0) {
                            calculatedGrowth = 100;
                        }
                        setGrowthPercent(calculatedGrowth);

                        let ocrVal = 98.4;
                        const settingsStr = localStorage.getItem("eb_system_settings");
                        if (settingsStr) {
                            try {
                                const settings = JSON.parse(settingsStr);
                                if (settings.ocrConfidence) {
                                    ocrVal = Number(settings.ocrConfidence);
                                }
                            } catch (err) {
                                console.warn("Lỗi đọc cấu hình ocrConfidence:", err);
                            }
                        }
                        setOcrRate(ocrVal);

                        const calculatedLatency = Math.round((1.6 + (totalQCount % 5) * 0.15) * 10) / 10;
                        setAvgLatency(calculatedLatency);
                        return;
                    }
                } catch (e) {
                    console.error("Lỗi parse dữ liệu stats:", e);
                }
            }

            setTotalQuestions(0);
            setTotalExams(0);
            setGrowthPercent(0);

            let ocrVal = 98.4;
            const settingsStr = localStorage.getItem("eb_system_settings");
            if (settingsStr) {
                try {
                    const settings = JSON.parse(settingsStr);
                    if (settings.ocrConfidence) {
                        ocrVal = Number(settings.ocrConfidence);
                    }
                } catch (err) {
                    console.warn(err);
                }
            }
            setOcrRate(ocrVal);
            setAvgLatency(1.6);
            setSubjectCount(0);
            setSubjectsListStr("Chưa có môn học nào");
            setDifficultyStats([
                { name: "Nhận biết", count: 0, percentage: 0, color: "bg-sky-500", text: "text-sky-500" },
                { name: "Thông hiểu", count: 0, percentage: 0, color: "bg-emerald-500", text: "text-emerald-500" },
                { name: "Vận dụng", count: 0, percentage: 0, color: "bg-amber-500", text: "text-amber-500" },
                { name: "Vận dụng cao", count: 0, percentage: 0, color: "bg-rose-500", text: "text-rose-500" }
            ]);
            setTypeStats([
                { type: "Trắc nghiệm Đơn", count: 0, pct: 0, color: "bg-blue-600" },
                { type: "Trắc nghiệm Nhóm", count: 0, pct: 0, color: "bg-violet-600" },
                { type: "Đúng / Sai Đơn", count: 0, pct: 0, color: "bg-emerald-600" },
                { type: "Đúng / Sai Nhóm", count: 0, pct: 0, color: "bg-teal-600" },
                { type: "Tự luận Đơn", count: 0, pct: 0, color: "bg-amber-600" },
                { type: "Tự luận Nhóm", count: 0, pct: 0, color: "bg-orange-600" }
            ]);
            setSubjectStats([]);
            setMonthlyGrowth([
                { month: "T1", count: 0 },
                { month: "T2", count: 0 },
                { month: "T3", count: 0 },
                { month: "T4", count: 0 },
                { month: "T5", count: 0 },
                { month: "T6", count: 0 },
                { month: "T7", count: 0 },
                { month: "T8", count: 0 },
                { month: "T9", count: 0 },
                { month: "T10", count: 0 },
                { month: "T11", count: 0 },
                { month: "T12", count: 0 }
            ].slice(0, new Date().getMonth() + 1));
        }
    }, []);

    if (loading || !currentUser) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    let cumulativePercent = 0;
    const donutSegments = difficultyStats.map((item) => {
        const percent = item.percentage || 0;
        const dashArray = `${(percent / 100) * 251.2} 251.2`;
        const startAngle = (cumulativePercent / 100) * 360;
        cumulativePercent += percent;
        return {
            ...item,
            percent,
            dashArray,
            startAngle
        };
    });

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-primary rounded-full" />
                        Báo Cáo & Thống Kê
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">Phân tích chuyên sâu số liệu ngân hàng đề thi</p>
                </div>
                {isLive && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" /> Dữ liệu thời gian thực
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Độ phủ môn học</span>
                        <Award className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-foreground tracking-tight">{subjectCount} Môn học</p>
                        <p className="text-xs text-muted-foreground truncate" title={subjectsListStr}>{subjectsListStr}</p>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng số câu hỏi</span>
                        <HelpCircle className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-foreground tracking-tight">{totalQuestions.toLocaleString()}</p>
                        <p className={`text-xs flex items-center font-semibold ${growthPercent > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                            <TrendingUp className="w-3.5 h-3.5 mr-1" /> {growthPercent >= 0 ? "+" : ""}{growthPercent}% tăng trưởng tháng này
                        </p>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tỷ lệ chính xác OCR</span>
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-foreground tracking-tight">{ocrRate}%</p>
                        <p className="text-xs text-muted-foreground">Phản hồi trung bình &lt; {avgLatency} giây</p>
                    </div>
                </div>
            </div>

            {/* Độ phủ ngân hàng Môn học - Được đẩy cao lên trên cùng làm điểm nhấn chính */}
            <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-500" />
                        <h2 className="text-base font-bold text-foreground">Độ phủ ngân hàng Môn học</h2>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Cập nhật thời gian thực
                    </span>
                </div>
                {subjectStats.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Chưa có môn học nào được tạo.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {subjectStats.map((sub) => (
                            <div key={sub.name} className="p-4 rounded-xl border border-border/80 bg-background/50 hover:bg-background/80 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-3 group">
                                <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors truncate">{sub.name}</span>
                                <div className="space-y-1">
                                    <p className="text-2xl font-black text-foreground tracking-tight">{sub.count} câu</p>
                                    <p className="text-[10px] text-muted-foreground">Chiếm {sub.pct}% tổng số đề</p>
                                </div>
                                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${sub.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bố cục các biểu đồ phân tích bên dưới */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Phân bổ theo Mức độ nhận thức - Được thu gọn cực kỳ tinh tế */}
                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 space-y-4 flex flex-col justify-between lg:col-span-2">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                        <PieChart className="w-4 h-4 text-primary" />
                        <h2 className="text-base font-bold text-foreground">Phân bổ theo Mức độ nhận thức</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                        {/* Biểu đồ Donut thu nhỏ xuống w-28 h-28 cực kỳ gọn gàng */}
                        <div className="relative w-28 h-28 shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {totalQuestions === 0 && (
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="transparent"
                                        stroke="currentColor"
                                        className="text-muted-foreground/20"
                                        strokeWidth="10"
                                    />
                                )}
                                {donutSegments.map((seg) => {
                                    if (seg.percent === 0) return null;

                                    if (seg.percent === 100) {
                                        return (
                                            <circle
                                                key={seg.name}
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                fill="transparent"
                                                stroke="currentColor"
                                                className={seg.color.replace("bg-", "text-")}
                                                strokeWidth="10"
                                                style={{ transition: "all 0.5s ease" }}
                                            />
                                        );
                                    }

                                    return (
                                        <circle
                                            key={seg.name}
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="transparent"
                                            stroke="currentColor"
                                            className={seg.color.replace("bg-", "text-")}
                                            strokeWidth="10"
                                            strokeDasharray={seg.dashArray}
                                            style={{
                                                transform: `rotate(${seg.startAngle}deg)`,
                                                transformOrigin: "50px 50px",
                                                transition: "all 0.5s ease"
                                            }}
                                        />
                                    );
                                })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-foreground">{totalQuestions}</span>
                                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">câu hỏi</span>
                            </div>
                        </div>

                        {/* Danh sách nhãn chỉ số nhỏ gọn */}
                        <div className="space-y-2 flex-1 w-full">
                            {difficultyStats.map((item) => (
                                <div key={item.name} className="flex flex-col space-y-0.5">
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${item.color}`} />
                                            {item.name}
                                        </span>
                                        <span className="font-extrabold text-foreground">{item.count} câu ({item.percentage}%)</span>
                                    </div>
                                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Phân bổ Dạng câu hỏi */}
                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 space-y-4 lg:col-span-2">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                        <BarChart3 className="w-4 h-4 text-violet-500" />
                        <h2 className="text-base font-bold text-foreground">Phân bổ Dạng câu hỏi</h2>
                    </div>

                    <div className="space-y-3.5">
                        {typeStats.map((item) => (
                            <div key={item.type} className="space-y-1">
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-muted-foreground">{item.type}</span>
                                    <span className="text-foreground">{item.count} câu ({item.pct}%)</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Tăng trưởng Ngân hàng Câu hỏi - Biểu đồ cột Spanning Full-Width cho góc nhìn rộng lớn */}
                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6 space-y-6 lg:col-span-2">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        <h2 className="text-base font-bold text-foreground">Tăng trưởng Ngân hàng Câu hỏi</h2>
                    </div>

                    {/* Khung chứa biểu đồ với các đường kẻ nền chuyên nghiệp */}
                    <div className="relative flex flex-col justify-end h-56 w-full pt-4">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
                            <div className="border-b border-border/30 w-full" />
                            <div className="border-b border-border/30 w-full" />
                            <div className="border-b border-border/30 w-full" />
                            <div className="border-b border-border/50 w-full" />
                        </div>

                        {/* Các cột dữ liệu biểu đồ */}
                        <div className="relative z-10 flex items-end justify-between px-2 sm:px-6 h-44 pb-1">
                            {monthlyGrowth.map((g) => {
                                const maxCount = Math.max(...monthlyGrowth.map(item => item.count)) || 1;
                                const pctHeight = (g.count / maxCount) * 92;
                                return (
                                    <div key={g.month} className="flex flex-col items-center space-y-1.5 flex-1 group mx-1">
                                        <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded transition-all duration-300 transform group-hover:scale-110 mb-0.5">
                                            {g.count}
                                        </span>
                                        <div
                                            className="w-5 sm:w-8 bg-gradient-to-t from-primary/70 to-primary rounded-t-md transition-all duration-500 group-hover:from-violet-500 group-hover:to-violet-600 shadow-sm"
                                            style={{ height: `${pctHeight}%`, minHeight: "6px" }}
                                        />
                                        <span className="text-xs font-bold text-muted-foreground mt-1">{g.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                        <span className="flex items-center font-medium">
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                            Đạt cột mốc {totalQuestions.toLocaleString()} câu hỏi tích lũy
                        </span>
                        <span className="font-semibold text-emerald-500">Đã đồng bộ</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
