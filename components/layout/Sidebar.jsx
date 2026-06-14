"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
    Home,
    FilePlus2,
    Library,
    BarChart2,
    Settings,
    ChevronRight,
    FileText,
    Users,
    Building2,
    Trash2,
    GraduationCap,
    Bot,
    PenTool,
    BookOpen,
    Globe,
    Gamepad2
} from "lucide-react";

const navGroups = [
    {
        label: "Chính",
        items: [
            { href: "/", icon: Home, label: "Trang Chủ" },
            { href: "/community", icon: Globe, label: "Cộng Đồng" },
            { href: "/create-question", icon: FilePlus2, label: "Tạo Đề Thi" },
            { href: "/my-exams", icon: FileText, label: "Đề Thi Của Tôi" },
            { href: "/questions", icon: Library, label: "Ngân Hàng Câu Hỏi" },
        ],
    },
    {
        label: "Trường Học",
        items: [
            { href: "/classes", icon: GraduationCap, label: "Lớp Thi" },
            { href: "/my-exams/live", icon: Gamepad2, label: "Live Quiz" },
            { href: "/subjects", icon: BookOpen, label: "Môn Học" },
        ],
    },
    {
        label: "Phân Tích",
        items: [
            { href: "/statistics", icon: BarChart2, label: "Thống Kê" },
        ],
    },
    {
        label: "Hệ Thống",
        items: [
            { href: "/settings", icon: Settings, label: "Cài Đặt" },
            { href: "/recycle-bin", icon: Trash2, label: "Thùng Rác" },
        ],
    },
    {
        label: "Quản trị",
        items: [
            { href: "/admin/users", icon: Users, label: "Quản Lý Thành Viên" },
        ],
    },
];

/**
 * Component Sidebar
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  isOpen - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function Sidebar({ isOpen, isMobile = false }) {
    const pathname = usePathname();
    const { currentUser } = useAuth();
    
    // RBAC Logic: Filter nav items based on role
    const userRole = currentUser?.role || "teacher";
    
    const filteredNavGroups = navGroups.map(group => {
        let filteredItems = group.items;
        
        // Admin has access to everything
        if (userRole === "admin") return group;
        
        // Hide Admin groups from non-admin users
        if (group.label === "Quản trị" && userRole !== "admin") {
            filteredItems = [];
        }
        
        // Student role (demo) - only sees their classes and exams
        if (userRole === "student") {
            if (group.label === "Phân Tích") {
                filteredItems = [];
            }
            if (group.label === "Chính") {
                filteredItems = filteredItems.filter(i => i.href === "/" || i.href === "/my-exams");
            }
        }
        
        // Teacher role
        if (userRole === "teacher") {
            if (group.label === "Hệ Thống") {
                // Teachers might not see full system settings
                // But for now we let them see settings and recycle bin
            }
        }
        
        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);

    return (
        <aside
            className={cn(
                "fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] border-r border-border bg-sidebar overflow-hidden transition-all duration-300 ease-in-out",
                isMobile
                    ? isOpen ? "w-64 shadow-2xl" : "w-0"
                    : isOpen ? "w-60" : "w-16"
            )}
        >
            <div className="h-full flex flex-col w-full overflow-x-hidden">

                <nav className="flex flex-col gap-5 px-2 py-4 flex-1 overflow-y-auto overflow-x-hidden">
                    {filteredNavGroups.map((group) => (
                        <div key={group.label}>
                            <p className={cn(
                                "px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden",
                                (isOpen || isMobile) ? "opacity-100 h-4 mb-1.5" : "opacity-0 h-0 mb-0"
                            )}>
                                {group.label}
                            </p>

                            <div className="flex flex-col gap-0.5">
                                {group.items.map((item) => {
                                    const isQuizSession = pathname?.startsWith("/create-question") || pathname?.startsWith("/my-exams/live");
                                    const targetHref = (item.href === "/" && isQuizSession) ? "/my-exams" : item.href;
                                    
                                    // Kiểm tra xem có mục nào trong sidebar khớp chính xác với pathname hiện tại không
                                    const hasExactMatch = filteredNavGroups.some(g =>
                                        g.items.some(i => pathname === i.href)
                                    );

                                    const isExactActive = pathname === item.href;
                                    const isParentActive = item.href !== '/' && 
                                                           pathname.startsWith(item.href + '/') &&
                                                           !(item.href === '/my-exams' && pathname?.startsWith('/my-exams/live'));
                                    
                                    const isFullyActive = isExactActive || (isParentActive && !hasExactMatch);
                                    const isPartiallyActive = isParentActive && hasExactMatch;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={targetHref}
                                            title={(!isOpen && !isMobile) ? item.label : undefined}
                                            className={cn(
                                                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                                isFullyActive
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : isPartiallyActive
                                                        ? "text-primary bg-primary/10 dark:bg-primary/20"
                                                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" />

                                            {(isOpen || isMobile) && (
                                                <>
                                                    <span className="flex-1 truncate">{item.label}</span>
                                                    {isFullyActive && (
                                                        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                                    )}
                                                </>
                                            )}

                                            {!isOpen && !isMobile && (
                                                <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-md border border-border whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                                                    {item.label}
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className={cn(
                    "px-3 pb-4 shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
                    (isOpen || isMobile) ? "opacity-100 h-[64px]" : "opacity-0 h-0"
                )}>
                    <div className="rounded-lg bg-sidebar-accent/50 p-3 text-center whitespace-nowrap">
                        <p className="text-[10px] text-sidebar-foreground/50 leading-relaxed">
                            Ngân Hàng Câu Hỏi<br />
                            <span className="font-semibold">v1.5.1</span>
                        </p>
                    </div>
                </div>

            </div>
        </aside>
    );
}
