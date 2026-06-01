"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FilePlus2,
    Library,
    BarChart3,
    Settings,
} from "lucide-react";
import TeacherHeroSection from "@/components/teacher/dashboard/TeacherHeroSection";
import TeacherStatsCards from "@/components/teacher/dashboard/TeacherStatsCards";
import TeacherQuickActions from "@/components/teacher/dashboard/TeacherQuickActions";
import TeacherRecentActivities from "@/components/teacher/dashboard/TeacherRecentActivities";
import AIAssistantBanner from "@/components/teacher/dashboard/AIAssistantBanner";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const runWithTimeout = (promise, ms = 1000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

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

/**
 * Component Home
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function Home() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState([
        { label: "Tổng số câu hỏi", value: "0", change: "Hệ thống thời gian thực", color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Đề thi đã lưu trữ", value: "0", change: "Hệ thống thời gian thực", color: "text-violet-500", bg: "bg-violet-500/10" },
        { label: "Môn học hoạt động", value: "0", change: "Hệ thống thời gian thực", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Tài khoản giáo viên", value: "0", change: "Hệ thống thời gian thực", color: "text-amber-500", bg: "bg-amber-500/10" },
    ]);
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        if (!loading) {
            if (!currentUser) {
                router.push("/login");
            } else if (currentUser.role === "student") {
                router.push("/student");
            }
        }
    }, [currentUser, loading, router]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (typeof window !== "undefined") {
                let liveExamsCount = 0;
                let teachersCount = 1;
                let recentExams = [];
                let liveQCount = 0;
                let subjectsCount = 0;

                try {
                    const { getCountFromServer, orderBy, limit } = await import("firebase/firestore");
                    const examsRef = collection(db, "exams");
                    const usersRef = collection(db, "users");
                    const teachersQuery = query(usersRef, where("role", "==", "teacher"));

                    // Chạy song song các truy vấn để tối ưu thời gian (sử dụng getCountFromServer rất nhẹ và không tốn nhiều tiền Firebase)
                    const [examsCountSnap, usersCountSnap, recentExamsSnap] = await Promise.all([
                        runWithTimeout(getCountFromServer(examsRef), 2000).catch(() => ({ data: () => ({ count: 0 }) })),
                        runWithTimeout(getCountFromServer(teachersQuery), 2000).catch(() => ({ data: () => ({ count: 1 }) })),
                        runWithTimeout(getDocs(query(examsRef, orderBy("updatedAt", "desc"), limit(4))), 2000).catch(() => ({ docs: [] }))
                    ]);

                    liveExamsCount = examsCountSnap.data().count;
                    teachersCount = usersCountSnap.data().count || 1;
                    recentExams = recentExamsSnap.docs.map((doc) => doc.data());

                    // Để có số lượng câu hỏi và môn học chính xác cần có logic thống kê riêng trên backend, 
                    // tạm thời lấy dữ liệu ước tính từ cache nếu không thể tính từ toàn bộ collection.
                    const saved = localStorage.getItem("eb_exams");
                    if (saved) {
                        try {
                            const cachedExams = JSON.parse(saved);
                            liveQCount = cachedExams.reduce((sum, e) => sum + Number(e.total_questions || e.questions?.length || 0), 0);
                            const uniqueSubjects = new Set(cachedExams.map((e) => e.subject).filter(Boolean));
                            subjectsCount = uniqueSubjects.size || 0;
                        } catch (e) { }
                    }
                } catch (e) {
                    console.warn("Lỗi tải dữ liệu Dashboard:", e.message);
                }

                setStats([
                    { label: "Tổng số câu hỏi", value: String(liveQCount > 0 ? liveQCount : "---"), change: "Tự động ước lượng", color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Đề thi đã lưu trữ", value: String(liveExamsCount), change: "Xuất bản toàn hệ thống", color: "text-violet-500", bg: "bg-violet-500/10" },
                    { label: "Môn học hoạt động", value: String(subjectsCount > 0 ? subjectsCount : "---"), change: "Các môn học hiện có", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { label: "Tài khoản giáo viên", value: String(teachersCount), change: "Trên hệ thống", color: "text-amber-500", bg: "bg-amber-500/10" },
                ]);

                if (recentExams.length > 0) {
                    const formattedActs = recentExams.map((exam) => {
                        const qCount = exam.total_questions || exam.questions?.length || 0;
                        let dateStr = "Gần đây";
                        if (exam.updatedAt) {
                            try {
                                dateStr = new Date(exam.updatedAt).toLocaleDateString("vi-VN");
                            } catch (err) { }
                        }
                        return {
                            title: `Đã xuất bản đề thi ${exam.title || "Chưa đặt tên"} (${qCount} câu hỏi)`,
                            type: exam.subject || "Chuyên ngành",
                            date: dateStr,
                            user: exam.author || "Giáo viên hệ thống"
                        };
                    });
                    setActivities(formattedActs);
                } else {
                    setActivities([
                        { title: "Hệ thống sẵn sàng đón nhận câu hỏi mới", type: "Hệ thống", date: "Hôm nay", user: "Admin" }
                    ]);
                }
            }
        };

        fetchDashboardData();
    }, [currentUser]);

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            <TeacherHeroSection currentUser={currentUser} />
            <TeacherStatsCards stats={stats} />
            <TeacherQuickActions quickActions={quickActions} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <TeacherRecentActivities activities={activities} />
                <AIAssistantBanner />
            </div>
        </div>
    );
}
