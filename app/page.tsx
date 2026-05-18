"use client";

import Link from "next/link";
import {
    FilePlus2,
    Library,
    BarChart3,
    Settings,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Clock,
    UserCheck,
    Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const stats = [
    { label: "Tổng số câu hỏi", value: "1,248", change: "+12% tháng này", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Đề thi đã xuất bản", value: "48", change: "+6 tuần này", color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Quét đề bằng AI (OCR)", value: "3,892", change: "Độ chính xác 98.4%", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Tài khoản giáo viên", value: "12", change: "Hoạt động tích cực", color: "text-amber-500", bg: "bg-amber-500/10" },
];

const quickActions = [
    {
        href: "/create-question",
        icon: FilePlus2,
        title: "Tạo Đề Thi Mới",
        desc: "Soạn thảo đề thi trắc nghiệm, tự luận bằng AI.",
        btnText: "Bắt đầu soạn",
        color: "from-blue-600 to-indigo-600 shadow-blue-500/10"
    },
    {
        href: "/questions",
        icon: Library,
        title: "Ngân Hàng Câu Hỏi",
        desc: "Duyệt tìm, sắp xếp, lọc và chỉnh sửa kho câu hỏi.",
        btnText: "Mở kho câu hỏi",
        color: "from-purple-600 to-pink-600 shadow-purple-500/10"
    },
    {
        href: "/statistics",
        icon: BarChart3,
        title: "Báo Cáo Thống Kê",
        desc: "Xem biểu đồ phân tích số liệu, tỉ lệ câu hỏi.",
        btnText: "Xem báo cáo",
        color: "from-emerald-600 to-teal-600 shadow-emerald-500/10"
    },
    {
        href: "/settings",
        icon: Settings,
        title: "Cấu Hình Hệ Thống",
        desc: "Thiết lập điểm mặc định, thông số AI và OCR.",
        btnText: "Vào cài đặt",
        color: "from-amber-600 to-orange-600 shadow-amber-500/10"
    }
];

const recentActivities = [
    { title: "Đã thêm câu hỏi Trắc nghiệm Toán 12", type: "Toán học", date: "10 phút trước", user: "Thầy Nguyễn Hữu Hoàng" },
    { title: "Đã trích xuất thành công 5 câu tự luận Lý bằng AI", type: "Vật lý", date: "45 phút trước", user: "Cô Lê Thị Thanh" },
    { title: "Xuất bản đề thi kiểm tra giữa kỳ 1 Hóa 11", type: "Hóa học", date: "2 giờ trước", user: "Thầy Trần Minh Đức" },
    { title: "Đã hiệu chỉnh nhãn câu hỏi đề cương Sử 10", type: "Lịch sử", date: "1 ngày trước", user: "Cô Nguyễn An Bình" }
];

export default function Home() {
    const { currentUser } = useAuth();

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Welcoming Banner Card */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-violet-950 to-indigo-950 text-white p-6 sm:p-8 md:p-10 shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 max-w-2xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs text-primary-foreground font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        Hỗ trợ Trí tuệ Nhân tạo Gemini 2.5 Flash
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                        Hệ Thống Ngân Hàng <br className="hidden sm:inline" /> Câu Hỏi & Đề Thi Thông Minh
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 max-w-md leading-relaxed">
                        Chào mừng {currentUser ? <span className="font-bold text-white">{currentUser.name}</span> : "bạn"} đến với hệ thống quản lý, biên soạn đề thi chuyên nghiệp tích hợp OCR quét đề nhanh bằng AI hàng đầu.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3">
                        <Link href="/create-question">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-xl">
                                Soạn Đề Ngay
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        {!currentUser && (
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="bg-white/5 border-white/20 hover:bg-white/10 text-white hover:text-white rounded-xl">
                                    Đăng nhập dùng thử
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-card hover:bg-card/85 transition-colors border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                <Cpu className="w-4 h-4" />
                            </span>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1 shrink-0" />
                                {stat.change}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-5 bg-primary rounded-full" />
                    Hành Động Nhanh
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickActions.map((action) => (
                        <div key={action.title} className="bg-card hover:bg-card/80 transition-all duration-300 border border-border/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg shadow-sm group">
                            <div className="space-y-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center shadow-md`}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{action.desc}</p>
                            </div>
                            <Link href={action.href} className="mt-5">
                                <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground">
                                    {action.btnText}
                                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* bottom content section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent activity log */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-5 bg-violet-600 rounded-full" />
                        Hoạt Động Gần Đây
                    </h2>
                    <div className="bg-card border border-border shadow-sm rounded-2xl p-5 divide-y divide-border/60">
                        {recentActivities.map((act, index) => (
                            <div key={index} className={`flex items-start justify-between gap-4 py-3.5 ${index === 0 ? "pt-0" : ""} ${index === recentActivities.length - 1 ? "pb-0" : ""}`}>
                                <div className="flex gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">{act.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center">
                                            <UserCheck className="w-3.5 h-3.5 mr-1 text-primary shrink-0" />
                                            {act.user}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-accent text-accent-foreground">
                                        {act.type}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground mt-1">{act.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI capabilities showcase */}
                <div className="space-y-4">
                    <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-5 bg-emerald-600 rounded-full" />
                        Trợ Lý Soạn Đề AI
                    </h2>
                    <div className="bg-gradient-to-b from-card to-emerald-950/5 border border-emerald-500/10 dark:border-emerald-500/20 shadow-sm rounded-2xl p-5 space-y-4">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Nhập liệu thủ công mất quá nhiều thời gian? Hệ thống tích hợp **AI OCR** và **Gemini Vision** siêu mạnh mẽ.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-foreground font-semibold">Nhận diện công thức toán học LaTeX chuẩn xác</p>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-foreground font-semibold">Tự động bóc tách Đề bài & Lời giải mẫu</p>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-foreground font-semibold">Nhận diện các loại câu hỏi nhóm phức tạp</p>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Link href="/create-question">
                                <Button className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-600/90 text-white rounded-xl shadow-md shadow-emerald-500/10">
                                    Thử ngay với Trợ Lý AI
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
