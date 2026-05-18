"use client";

import {
    BarChart3,
    HelpCircle,
    TrendingUp,
    PieChart,
    Calendar,
    ArrowUpRight,
    Award
} from "lucide-react";

// Mock stats calculations
const difficultyStats = [
    { name: "Nhận biết (Dễ)", count: 480, percentage: 38.5, color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "Thông hiểu (Trung bình)", count: 520, percentage: 41.7, color: "bg-blue-500", text: "text-blue-500" },
    { name: "Vận dụng (Khó)", count: 248, percentage: 19.8, color: "bg-amber-500", text: "text-amber-500" }
];

const typeStats = [
    { type: "Trắc nghiệm Đơn", count: 620, pct: 49.7, color: "bg-blue-600" },
    { type: "Trắc nghiệm Nhóm", count: 180, pct: 14.4, color: "bg-violet-600" },
    { type: "Đúng / Sai", count: 288, pct: 23.1, color: "bg-emerald-600" },
    { type: "Tự luận", count: 160, pct: 12.8, color: "bg-amber-600" }
];

const subjectStats = [
    { name: "Toán học", count: 412, pct: 33, color: "from-blue-500 to-indigo-600" },
    { name: "Vật lý", count: 298, pct: 24, color: "from-emerald-500 to-teal-600" },
    { name: "Hóa học", count: 218, pct: 17, color: "from-amber-500 to-orange-600" },
    { name: "Tiếng Anh", count: 320, pct: 26, color: "from-purple-500 to-pink-600" }
];

const monthlyGrowth = [
    { month: "T1", count: 180 },
    { month: "T2", count: 320 },
    { month: "T3", count: 480 },
    { month: "T4", count: 760 },
    { month: "T5", count: 1248 }
];

export default function StatisticsPage() {
    const totalQuestions = 1248;

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-6 bg-primary rounded-full" />
                    Báo Cáo & Thống Kê
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Phân tích chuyên sâu số liệu ngân hàng đề thi</p>
            </div>

            {/* Top Cards (Quick Overview) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Độ phủ môn học</span>
                        <Award className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-foreground tracking-tight">4 Môn học chính</p>
                        <p className="text-xs text-muted-foreground">Toán, Vật lý, Hóa học, Tiếng Anh</p>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng số câu hỏi</span>
                        <HelpCircle className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-foreground tracking-tight">{totalQuestions.toLocaleString()}</p>
                        <p className="text-xs text-emerald-500 flex items-center font-semibold">
                            <TrendingUp className="w-3.5 h-3.5 mr-1" /> +15.4% tăng trưởng tháng này
                        </p>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tỷ lệ chính xác OCR</span>
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-foreground tracking-tight">98.4%</p>
                        <p className="text-xs text-muted-foreground">Phản hồi trung bình &lt; 2.5 giây</p>
                    </div>
                </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Difficulty distribution */}
                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6 space-y-6">
                    <div className="flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-primary" />
                        <h2 className="text-base font-bold text-foreground">Phân bổ theo Mức độ nhận thức</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                        {/* Custom Circular SVG Donut Chart */}
                        <div className="relative w-40 h-40 shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* Easy 38.5% */}
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="transparent"
                                    stroke="currentColor"
                                    className="text-emerald-500"
                                    strokeWidth="10"
                                    strokeDasharray="251.2"
                                    strokeDashoffset="96.7" // 251.2 * (1 - 0.385)
                                />
                                {/* Medium 41.7% */}
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="transparent"
                                    stroke="currentColor"
                                    className="text-blue-500"
                                    strokeWidth="10"
                                    strokeDasharray="251.2"
                                    strokeDashoffset="104.7"
                                    style={{ transform: "rotate(138.6deg)", transformOrigin: "50px 50px" }}
                                />
                                {/* Hard 19.8% */}
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="transparent"
                                    stroke="currentColor"
                                    className="text-amber-500"
                                    strokeWidth="10"
                                    strokeDasharray="251.2"
                                    strokeDashoffset="201.4"
                                    style={{ transform: "rotate(288.7deg)", transformOrigin: "50px 50px" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-foreground">{totalQuestions}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">câu hỏi</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="space-y-3 flex-1 w-full">
                            {difficultyStats.map((item) => (
                                <div key={item.name} className="flex flex-col space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                            {item.name}
                                        </span>
                                        <span className="font-bold text-foreground">{item.count} câu ({item.percentage}%)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Question type breakdown */}
                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6 space-y-6">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-violet-500" />
                        <h2 className="text-base font-bold text-foreground">Phân bổ Dạng câu hỏi</h2>
                    </div>

                    <div className="space-y-4">
                        {typeStats.map((item) => (
                            <div key={item.type} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-muted-foreground">{item.type}</span>
                                    <span className="text-foreground">{item.count} câu ({item.pct}%)</span>
                                </div>
                                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Subject coverage */}
                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6 space-y-6">
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-500" />
                        <h2 className="text-base font-bold text-foreground">Độ phủ ngân hàng Môn học</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {subjectStats.map((sub) => (
                            <div key={sub.name} className="p-4 rounded-xl border border-border/80 bg-background/50 hover:bg-background/80 transition-colors flex flex-col justify-between space-y-2">
                                <span className="text-xs font-bold text-muted-foreground">{sub.name}</span>
                                <div className="space-y-1">
                                    <p className="text-2xl font-black text-foreground">{sub.count}</p>
                                    <p className="text-[10px] text-muted-foreground">Chiếm {sub.pct}% tổng số đề</p>
                                </div>
                                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${sub.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Monthly Growth (SVG Line/Bar Chart) */}
                <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6 space-y-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        <h2 className="text-base font-bold text-foreground">Tăng trưởng Ngân hàng Câu hỏi</h2>
                    </div>

                    {/* Highly responsive simulated bar graph */}
                    <div className="flex items-end justify-between h-44 px-4 pt-4 border-b border-border/60 pb-1">
                        {monthlyGrowth.map((g) => {
                            const pctHeight = (g.count / 1248) * 100;
                            return (
                                <div key={g.month} className="flex flex-col items-center space-y-2 flex-1 group">
                                    <span className="text-[9px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {g.count}
                                    </span>
                                    <div
                                        className="w-8 bg-gradient-to-t from-primary/60 to-primary rounded-t-lg transition-all duration-500 group-hover:to-violet-500"
                                        style={{ height: `${pctHeight}%`, minHeight: "10%" }}
                                    />
                                    <span className="text-xs font-bold text-muted-foreground">{g.month}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span className="flex items-center">
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                            Đạt cột mốc 1,200+ trong T5
                        </span>
                        <span>Cập nhật 5 phút trước</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
