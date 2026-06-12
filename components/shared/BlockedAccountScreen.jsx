"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Clock, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Component BlockedAccountScreen
 * Hiển thị thông báo khi tài khoản đang chờ duyệt (pending) hoặc bị khóa (suspended).
 *
 * @param {Object} props
 * @param {"pending" | "suspended"} props.status - Trạng thái của tài khoản
 * @returns {JSX.Element}
 */
export default function BlockedAccountScreen({ status }) {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const isPending = status === "pending";

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card border border-border/80 p-8 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-center">
                    {isPending ? (
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                            <Clock className="w-8 h-8 animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                            </span>
                        </div>
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                            <Lock className="w-8 h-8 animate-bounce" />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        {isPending ? "Tài Khoản Đang Chờ Phê Duyệt" : "Tài Khoản Đã Bị Khóa"}
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {isPending
                            ? "Tài khoản đăng ký vai trò Giáo viên của bạn đang đợi Quản trị viên phê duyệt. Vui lòng quay lại sau ít phút hoặc liên hệ quản trị viên."
                            : "Tài khoản của bạn đã bị khóa do vi phạm nội quy hệ thống hoặc chưa hoàn tất xác thực. Vui lòng liên hệ với quản trị viên để biết thêm chi tiết."}
                    </p>
                </div>

                <div className="pt-4 border-t border-border/60">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 border-border hover:bg-muted text-foreground"
                    >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất tài khoản
                    </Button>
                </div>
            </div>
        </div>
    );
}
