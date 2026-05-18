"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, User, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
    const { register, loginWithGoogle } = useAuth();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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
            await register(name, email, password);
            router.push("/");
        } catch (err) {
            setError(err.message || "Đăng ký thất bại, vui lòng thử lại!");
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setError("");
        setLoading(true);
        try {
            await loginWithGoogle();
            router.push("/");
        } catch (err) {
            setError(err.message || "Đăng ký bằng Google thất bại, vui lòng thử lại!");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
            {/* Background Decorative Gradients */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 relative z-10 transition-all duration-300 hover:shadow-primary/5">
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-3">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Tạo Tài Khoản</h2>
                    <p className="text-xs text-muted-foreground mt-1">Đăng ký tham gia hệ thống soạn thảo đề thi</p>
                </div>

                {error && (
                    <div className="mb-5 p-3 rounded-lg border border-red-200 dark:border-red-950/40 bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 animate-fade-in">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Họ và Tên</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 h-10 border-border bg-background/50 focus-visible:ring-primary"
                                placeholder="Thầy/Cô Nguyễn Văn A"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Địa chỉ Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-10 border-border bg-background/50 focus-visible:ring-primary"
                                placeholder="teacher@school.edu.vn"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Mật khẩu</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 h-10 border-border bg-background/50 focus-visible:ring-primary"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Xác nhận mật khẩu</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 h-10 border-border bg-background/50 focus-visible:ring-primary"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-primary/10 mt-6"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang tạo tài khoản...
                            </>
                        ) : (
                            <>
                                Đăng ký
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </form>

                <div className="relative my-6 flex items-center justify-center">
                    <span className="absolute inset-x-0 h-px bg-border/60" />
                    <span className="relative bg-card/60 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Hoặc đăng ký bằng
                    </span>
                </div>

                <Button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-10 border-border hover:bg-accent font-bold rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm"
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

                <div className="mt-6 pt-4 border-t border-border/60 text-center">
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
