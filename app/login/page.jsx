"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            router.push("/");
        } catch (err) {
            setError(err.message || "Đăng nhập thất bại, vui lòng thử lại!");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
            {/* Background Decorative Gradients */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 relative z-10 transition-all duration-300 hover:shadow-primary/5">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-3">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Đăng Nhập</h2>
                    <p className="text-xs text-muted-foreground mt-1">Hệ thống quản lý Ngân hàng Câu hỏi nâng cao</p>
                </div>

                {error && (
                    <div className="mb-5 p-3 rounded-lg border border-red-200 dark:border-red-950/40 bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                                placeholder="name@school.edu.vn"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-muted-foreground">Mật khẩu</label>
                        </div>
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

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-primary/10 mt-6"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang xác thực...
                            </>
                        ) : (
                            <>
                                Tiếp tục
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </form>

                {/* Simulated Account Information note */}
                <div className="mt-6 pt-4 border-t border-border/60 text-center">
                    <p className="text-xs text-muted-foreground">
                        Chưa có tài khoản?{" "}
                        <Link href="/register" className="font-bold text-primary hover:underline">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border/50 text-[10px] text-muted-foreground space-y-1">
                    <p className="font-bold text-foreground">💡 Tài khoản mẫu dùng thử:</p>
                    <p>• Email: <span className="font-semibold text-foreground">admin@test.com</span></p>
                    <p>• Mật khẩu: <span className="font-semibold text-foreground">admin123</span></p>
                </div>
            </div>
        </div>
    );
}
