"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, GraduationCap, Users, Loader2 } from "lucide-react";

export default function CompleteProfilePage() {
    const { currentUser, setCurrentUser } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Nếu không có user, hoặc user đã có role (không phải guest), chuyển hướng đi nơi khác
    useEffect(() => {
        if (!currentUser) {
            router.push("/login");
        } else if (currentUser.role && currentUser.role !== "guest") {
            if (currentUser.role === "student") router.push("/student");
            else if (currentUser.role === "parent") router.push("/parent");
            else router.push("/");
        }
    }, [currentUser, router]);

    const handleSelectRole = async (selectedRole) => {
        setLoading(true);
        setError("");
        try {
            // Cập nhật lên Firestore
            const userRef = doc(db, "users", currentUser.uid);
            const status = selectedRole === "teacher" ? "pending" : "active";
            await updateDoc(userRef, {
                role: selectedRole,
                status: status
            });

            // Cập nhật Context & LocalStorage
            const updatedUser = { ...currentUser, role: selectedRole, status: status };
            setCurrentUser(updatedUser);
            localStorage.setItem("eb_user", JSON.stringify(updatedUser));

            // Chuyển hướng
            if (selectedRole === "student") router.push("/student");
            else if (selectedRole === "parent") router.push("/parent");
            else router.push("/");
        } catch (err) {
            console.error("Lỗi cập nhật vai trò:", err);
            setError("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại!");
            setLoading(false);
        }
    };

    if (!currentUser || (currentUser.role !== "guest" && currentUser.role)) return null;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
            {/* Background Decorative Gradients */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-3xl bg-card/60 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 md:p-12 relative z-10 text-center animate-in zoom-in-95 duration-500">
                
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-primary/20 mx-auto mb-6">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-2">Hoàn thiện hồ sơ</h1>
                <p className="text-muted-foreground mb-8 text-sm md:text-base">Bạn tham gia Exam Bank với tư cách là gì?</p>

                {error && (
                    <div className="mb-6 p-3 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <p className="text-sm text-muted-foreground font-medium">Đang thiết lập tài khoản của bạn...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Option: Giáo viên */}
                        <button
                            onClick={() => handleSelectRole("teacher")}
                            className="group relative flex flex-col items-center p-6 bg-background border-2 border-border rounded-xl transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
                        >
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                                <User className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-foreground mb-1">Giáo viên</h3>
                            <p className="text-xs text-muted-foreground">Soạn đề thi, quản lý lớp học và câu hỏi</p>
                        </button>

                        {/* Option: Phụ huynh */}
                        <button
                            onClick={() => handleSelectRole("parent")}
                            className="group relative flex flex-col items-center p-6 bg-background border-2 border-border rounded-xl transition-all hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10"
                        >
                            <div className="h-14 w-14 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                                <Users className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-foreground mb-1">Phụ huynh</h3>
                            <p className="text-xs text-muted-foreground">Theo dõi tiến độ học tập và điểm số của con</p>
                        </button>

                        {/* Option: Học sinh */}
                        <button
                            onClick={() => handleSelectRole("student")}
                            className="group relative flex flex-col items-center p-6 bg-background border-2 border-border rounded-xl transition-all hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10"
                        >
                            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-foreground mb-1">Học sinh</h3>
                            <p className="text-xs text-muted-foreground">Tham gia thi, làm bài tập và theo dõi điểm số</p>
                        </button>
                        
                    </div>
                )}
            </div>
        </div>
    );
}
