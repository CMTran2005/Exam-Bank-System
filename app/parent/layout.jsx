"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LogOut, User, Bell, Home, BookOpen, GraduationCap, Settings } from "lucide-react";
import ThemeToggle from "@/components/shared/ThemeToggle";
import Footer from "@/components/layout/Footer";

export default function ParentLayout({ children }) {
    const { currentUser, logout, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!currentUser || currentUser.role !== "parent")) {
            router.push("/login");
        }
    }, [currentUser, loading, router]);

    if (loading || !currentUser) return null;

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link href="/parent" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center shadow-md">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black text-foreground tracking-tight">
                                Parent<span className="text-sky-500">Portal</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <ThemeToggle />

                            <Link href="/parent/settings" className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Cài đặt">
                                <Settings className="w-5 h-5" />
                            </Link>

                            <div className="h-6 w-px bg-border hidden sm:block"></div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-bold">
                                    {currentUser.photoURL ? (
                                        <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        currentUser.name?.charAt(0) || "P"
                                    )}
                                </div>
                                <div className="hidden sm:block text-sm text-right">
                                    <p className="font-bold text-foreground leading-none">{currentUser.name}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">Phụ Huynh</p>
                                </div>
                                <button
                                    onClick={() => { logout(); router.push("/login"); }}
                                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                                    title="Đăng xuất"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                {children}
            </main>

            <Footer />
        </div>
    );
}
