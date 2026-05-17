"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    FilePlus2,
    Library,
    BarChart2,
    Settings,
    ChevronRight,
} from "lucide-react";

const navGroups = [
    {
        label: "Chính",
        items: [
            { href: "/", icon: Home, label: "Trang Chủ" },
            { href: "/create-question", icon: FilePlus2, label: "Tạo Đề Thi" },
            { href: "/questions", icon: Library, label: "Ngân Hàng Câu Hỏi" },
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
        ],
    },
];

export default function Sidebar({ isOpen, isMobile = false }) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                "fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] border-r border-border bg-sidebar overflow-hidden transition-all duration-300 ease-in-out",
                isMobile
                    ? isOpen ? "w-64 shadow-2xl" : "w-0"
                    : isOpen ? "w-60" : "w-16"
            )}
        >
            <div className={cn(
                "h-full flex flex-col",
                isMobile ? "w-64" : isOpen ? "w-60" : "w-16"
            )}>

                <nav className="flex flex-col gap-5 px-2 py-4 flex-1 overflow-y-auto">
                    {navGroups.map((group) => (
                        <div key={group.label}>
                            {(isOpen || isMobile) && (
                                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none">
                                    {group.label}
                                </p>
                            )}

                            <div className="flex flex-col gap-0.5">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            title={(!isOpen && !isMobile) ? item.label : undefined}
                                            className={cn(
                                                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" />

                                            {(isOpen || isMobile) && (
                                                <>
                                                    <span className="flex-1 truncate">{item.label}</span>
                                                    {isActive && (
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

                {(isOpen || isMobile) && (
                    <div className="px-3 pb-4 shrink-0">
                        <div className="rounded-lg bg-sidebar-accent/50 p-3 text-center">
                            <p className="text-[10px] text-sidebar-foreground/50 leading-relaxed">
                                Ngân Hàng Câu Hỏi<br />
                                <span className="font-semibold">v1.0.0</span>
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </aside>
    );
}
