"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, LogOut, LayoutDashboard, Settings, BookOpen, Medal, UserCircle, Brain, Menu, X, Gamepad2, BookMarked, ChevronDown, Trophy } from "lucide-react";
import ThemeToggle from "@/components/shared/ThemeToggle";
import Footer from "@/components/layout/Footer";
import BlockedAccountScreen from "@/components/shared/BlockedAccountScreen";
import EncouragementPopup from "@/components/student/EncouragementPopup";

/**
 * Component StudentLayout
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  children  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function StudentLayout({ children }) {
    const { currentUser, logout, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

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

    // Không render chặn toàn trang ở đây nữa, chuyển xuống phần main content để thanh header và footer hiển thị ngay lập tức

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    if (currentUser && currentUser.status === "suspended") {
        return <BlockedAccountScreen status="suspended" />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-6">
                        <Link href="/student" className="flex items-center gap-2 group">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-sm transition-colors">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-black text-xl tracking-tight hidden sm:inline-block">
                                E-Learning
                            </span>
                        </Link>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
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
                                href="/student/live" 
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    pathname.startsWith("/student/live") 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <Gamepad2 className="h-4 w-4" /> Live Quiz
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
                                href="/student/error-notebook" 
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    pathname.startsWith("/student/error-notebook") 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <BookMarked className="h-4 w-4" /> Sổ tay câu sai
                            </Link>
                            <Link 
                                href="/student/flashcards" 
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    pathname === "/student/flashcards" 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <Brain className="h-4 w-4" /> Thẻ ghi nhớ
                            </Link>
                            <Link 
                                href="/student/leagues" 
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    pathname.startsWith("/student/leagues") 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <Trophy className="h-4 w-4" /> Giải đấu
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <ThemeToggle />
                        
                        <div className="hidden sm:block h-8 w-px bg-border mx-1"></div>
                        
                        <div className="hidden sm:flex items-center gap-3">
                            {(!loading && currentUser) ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setUserDropdownOpen((prev) => !prev)}
                                        className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-accent transition-colors focus:outline-none"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-violet-600 text-xs font-bold text-primary-foreground shadow-sm overflow-hidden shrink-0">
                                            {currentUser.avatarUrl ? (
                                                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                getInitials(currentUser.name)
                                            )}
                                        </div>
                                        <div className="hidden md:block text-left max-w-[120px]">
                                            <p className="text-sm font-bold leading-none truncate">{currentUser.name}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">Học sinh</p>
                                        </div>
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>

                                    {userDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setUserDropdownOpen(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                                                <div className="px-3 py-2 border-b border-border/60">
                                                    <p className="text-xs font-semibold text-muted-foreground">Tài khoản</p>
                                                    <p className="text-sm font-bold text-foreground truncate">{currentUser.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                                                </div>
                                                <div className="mt-1 space-y-0.5">
                                                    <Link
                                                        href="/student/profile"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                                            pathname === "/student/profile"
                                                            ? "bg-primary/10 text-primary font-bold"
                                                            : "text-foreground hover:bg-accent"
                                                        }`}
                                                    >
                                                        <UserCircle className="h-4 w-4" />
                                                        <span>Cá nhân</span>
                                                    </Link>
                                                    <Link
                                                        href="/student/badges"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                                            pathname === "/student/badges"
                                                            ? "bg-primary/10 text-primary font-bold"
                                                            : "text-foreground hover:bg-accent"
                                                        }`}
                                                    >
                                                        <Medal className="h-4 w-4" />
                                                        <span>Huy hiệu</span>
                                                    </Link>
                                                    <Link
                                                        href="/student/settings"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                                            pathname === "/student/settings"
                                                            ? "bg-primary/10 text-primary font-bold"
                                                            : "text-foreground hover:bg-accent"
                                                        }`}
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                        <span>Cài đặt</span>
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
                                <div className="w-24 h-8 bg-muted animate-pulse rounded-lg"></div>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button 
                            className="lg:hidden p-2 ml-1 text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-border/40 bg-background shadow-lg absolute w-full left-0 animate-in slide-in-from-top-2">
                        <nav className="flex flex-col p-4 gap-2">
                            {[
                                { href: "/student", icon: LayoutDashboard, label: "Lớp thi" },
                                { href: "/student/live", icon: Gamepad2, label: "Live Quiz" },
                                { href: "/student/practice", icon: BookOpen, label: "Luyện thi" },
                                { href: "/student/error-notebook", icon: BookMarked, label: "Sổ tay câu sai" },
                                { href: "/student/flashcards", icon: Brain, label: "Thẻ ghi nhớ" },
                                { href: "/student/leagues", icon: Trophy, label: "Giải đấu" },
                                { href: "/student/profile", icon: UserCircle, label: "Cá nhân" },
                                { href: "/student/badges", icon: Medal, label: "Huy hiệu" },
                                { href: "/student/settings", icon: Settings, label: "Cài đặt" },
                            ].map((item) => (
                                <Link 
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                                        pathname === item.href 
                                        ? "bg-primary/10 text-primary" 
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" /> {item.label}
                                </Link>
                            ))}
                            <button 
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-sm font-bold text-red-500 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 transition-colors"
                            >
                                <LogOut className="h-5 w-5" /> Đăng xuất
                            </button>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
                {(loading || !isMounted || !currentUser || currentUser.role !== "student") ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-muted-foreground font-medium animate-pulse">Đang tải không gian học tập...</p>
                    </div>
                ) : (
                    <>
                        {children}
                        <EncouragementPopup />
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
