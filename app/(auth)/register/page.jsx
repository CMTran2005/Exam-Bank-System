"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, User, Mail, Lock, Loader2, ArrowRight, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Component RegisterPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function RegisterPage() {
    const { register, loginWithGoogle } = useAuth();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("student"); // Mặc định là học sinh
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không trùng khớp!");
            return;
        }

        setLoading(true);

        try {
            await register(name, email, password, role);
            if (role === "student") {
                router.push("/student");
            } else if (role === "parent") {
                router.push("/parent");
            } else {
                router.push("/");
            }
        } catch (err) {
            setError(err.message || "Đăng ký thất bại, vui lòng thử lại!");
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setError("");
        setLoading(true);
        try {
            await loginWithGoogle(role);
            if (role === "student") {
                router.push("/student");
            } else if (role === "parent") {
                router.push("/parent");
            } else {
                router.push("/");
            }
        } catch (err) {
            setError(err.message || "Đăng ký bằng Google thất bại, vui lòng thử lại!");
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-background">
            {/* Background Decorative Gradients */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 relative z-10 transition-all duration-300 hover:shadow-primary/5">
                <div className="flex flex-col items-center mb-4 text-center">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-primary/20 mb-2">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-lg font-black text-foreground tracking-tight">Tạo Tài Khoản</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Đăng ký tham gia hệ thống soạn thảo đề thi</p>
                </div>

                {error && (
                    <div className="mb-5 p-3 rounded-lg border border-red-200 dark:border-red-950/40 bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 animate-fade-in">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 mb-1">
                        <button
                            type="button"
                            onClick={() => setRole("student")}
                            className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border-2 transition-all ${role === "student"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                                }`}
                        >
                            <GraduationCap className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">Học sinh</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("teacher")}
                            className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border-2 transition-all ${role === "teacher"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                                }`}
                        >
                            <User className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">Giáo viên</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("parent")}
                            className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border-2 transition-all ${role === "parent"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                                }`}
                        >
                            <User className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">Phụ huynh</span>
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground">Họ và Tên</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-9 h-9 text-sm border-border bg-background/50 focus-visible:ring-primary rounded-lg"
                                placeholder={role === "student" ? "Nguyễn Văn A" : "Thầy/Cô Nguyễn Văn A"}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground">Địa chỉ Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-9 h-9 text-sm border-border bg-background/50 focus-visible:ring-primary rounded-lg"
                                placeholder="teacher@school.edu.vn"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 h-9 text-sm border-border bg-background/50 focus-visible:ring-primary rounded-lg"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground">Xác nhận</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-9 h-9 text-sm border-border bg-background/50 focus-visible:ring-primary rounded-lg"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-9 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg shadow-primary/10 mt-3"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang tạo tài khoản...
                            </>
                        ) : (
                            <>
                                Đăng ký
                            </>
                        )}
                    </Button>
                </form>

                <div className="relative my-3 flex items-center justify-center">
                    <span className="absolute inset-x-0 h-px bg-border/60" />
                    <span className="relative bg-card/60 px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                        Hoặc đăng ký bằng
                    </span>
                </div>

                <Button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-9 text-[13px] border-border hover:bg-accent font-bold rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm"
                >
                    <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24">
                        <path
                            fill="#EA4335"
                            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.23 2.67 1.24 6.6L5.266 9.765z"
                        />
                        <path
                            fill="#34A853"
                            d="M16.04 15.342c-1.044.697-2.38 1.112-4.04 1.112a7.042 7.042 0 0 1-6.733-4.855L1.24 14.765C3.23 18.724 7.27 21.393 12 21.393c3.127 0 6.012-1.066 8.163-2.909l-4.123-3.142z"
                        />
                        <path
                            fill="#4285F4"
                            d="M23.49 12.273c0-.818-.08-1.609-.218-2.373H12v4.582h6.44c-.29 1.528-1.145 2.822-2.4 3.664l4.122 3.14c2.4-2.218 3.328-5.485 3.328-9.013z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.267 9.765L1.24 6.6A11.968 11.968 0 0 0 0 12c0 1.927.458 3.742 1.24 5.365l4.027-3.165A7.042 7.042 0 0 1 4.909 12c0-.793.13-1.558.358-2.235z"
                        />
                    </svg>
                    Đăng ký bằng Google
                </Button>

                <div className="mt-4 pt-3 border-t border-border/60 text-center">
                    <p className="text-xs text-muted-foreground">
                        Đã có tài khoản?{" "}
                        <Link href="/login" className="font-bold text-primary hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
