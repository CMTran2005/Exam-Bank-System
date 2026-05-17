"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Tránh lỗi Hydration: Chỉ hiển thị sau khi trang đã load ở Client
    useEffect(() => setMounted(true), []);
    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full shadow-md transition-all duration-300 border-slate-200 dark:border-slate-700"
        >
            {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
            ) : (
                <Moon className="h-5 w-5 text-slate-700" />
            )}
        </Button>
    );
}
