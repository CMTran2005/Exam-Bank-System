"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, LogOut, LayoutDashboard, Settings, BookOpen, Medal } from "lucide-react";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function StudentLayout({ children }) {
    const { currentUser, logout, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && isMounted) {
            if (!currentUser) {
                router.push("/login");
            } else if (currentUser.role !== "student") {
                router.push("/"); // Nếu là giáo viên thì đẩy về dashboard giáo viên
            }
        }
    }, [currentUser, loading, router, isMounted]);

    if (loading || !isMounted || !currentUser || currentUser.role !== "student") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground font-medium animate-pulse">Đang tải không gian học tập...</p>
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-6">
                        <Link href="/student" className="flex items-center gap-2 group">
                            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                                <GraduationCap className="h-6 w-6 text-primary" />
                            </div>
                            <span className="font-black text-xl tracking-tight hidden sm:inline-block">
                                E-Learning
                            </span>
                        </Link>
                        
                        <nav className="hidden md:flex items-center gap-1">
                            <Link 
                                href="/student" 
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    pathname === "/student" 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <LayoutDashboard className="h-4 w-4" /> Lớp thi
                            </Link>
                            <Link 
                                href="/student/practice" 
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    pathname === "/student/practice" 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <BookOpen className="h-4 w-4" /> Luyện thi
                            </Link>
                            <Link 
                                href="/student/badges" 
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    pathname === "/student/badges" 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <Medal className="h-4 w-4" /> Huy hiệu
                            </Link>
                            <Link 
                                href="/student/settings" 
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    pathname === "/student/settings" 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <Settings className="h-4 w-4" /> Cài đặt
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        
                        <div className="h-8 w-px bg-border mx-1"></div>
                        
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-bold leading-none">{currentUser.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">Học sinh</p>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                                title="Đăng xuất"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
                {children}
            </main>
        </div>
    );
}
