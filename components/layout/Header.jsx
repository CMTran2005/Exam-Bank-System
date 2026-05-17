"use client";

import Link from "next/link";
import { BookOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function Header({ onMenuToggle }) {
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm group-hover:shadow-md transition-shadow">
                        <BookOpen className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-bold text-foreground leading-tight">Ngân Hàng Câu Hỏi</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Hệ thống quản lý đề thi</p>
                    </div>
                </Link>

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                    <span className="hidden md:block text-xs text-muted-foreground">
                        Chào mừng bạn đến với hệ thống
                    </span>
                    <div className="h-5 w-px bg-border hidden md:block" />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
