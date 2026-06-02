"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Menu, User, LogOut, Settings2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

/**
 * Component Header
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  onMenuToggle  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function Header({ onMenuToggle }) {
    const { currentUser, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center gap-3 px-4">

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuToggle}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-bold text-foreground leading-tight">Exam Bank</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Hệ thống quản lý đề thi</p>
                    </div>
                </Link>

                <div className="flex-1" />

                <div className="flex items-center gap-3">
                    {mounted && currentUser ? (
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-accent transition-colors focus:outline-none"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-violet-600 text-xs font-bold text-primary-foreground shadow-sm overflow-hidden shrink-0">
                                    {currentUser.avatarUrl ? (
                                        <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        getInitials(currentUser.name)
                                    )}
                                </div>
                                <span className="hidden md:block text-sm font-semibold text-foreground max-w-[120px] truncate">
                                    {currentUser.name}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                                        <div className="px-3 py-2 border-b border-border/60">
                                            <p className="text-xs font-semibold text-muted-foreground">Tài khoản</p>
                                            <p className="text-sm font-bold text-foreground truncate">{currentUser.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300">
                                                {currentUser.role === "admin" ? "Quản trị viên" : (currentUser.degree || "Giáo viên")}
                                            </span>
                                        </div>
                                        <div className="mt-1 space-y-0.5">
                                            <Link
                                                href="/settings"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                                            >
                                                <Settings2 className="h-4 w-4" />
                                                <span>Cài đặt hệ thống</span>
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>Đăng xuất</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="text-xs font-semibold text-foreground">
                                    Đăng nhập
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm" className="text-xs font-bold shadow-sm bg-primary text-primary-foreground hover:bg-primary/95">
                                    Đăng ký
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
