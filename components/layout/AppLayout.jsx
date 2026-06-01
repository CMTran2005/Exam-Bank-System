"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";

/**
 * Component AppLayout
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  children  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [zenMode, setZenMode] = useState(false);
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && currentUser && currentUser.role === "student") {
            router.replace("/student");
        }
    }, [currentUser, loading, router]);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setSidebarOpen(!mobile);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        
        const handleZenMode = (e) => setZenMode(e.detail);
        window.addEventListener("toggle-zen-mode", handleZenMode);
        
        return () => {
            window.removeEventListener("resize", checkMobile);
            window.removeEventListener("toggle-zen-mode", handleZenMode);
        };
    }, []);

    const handleMenuToggle = () => setSidebarOpen((prev) => !prev);

    if (loading || (currentUser && currentUser.role === "student")) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground font-medium animate-pulse">Đang tải không gian làm việc...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">

            {!zenMode && <Header onMenuToggle={handleMenuToggle} />}

            <div className="flex flex-1 relative">

                {isMobile && sidebarOpen && !zenMode && (
                    <div
                        className="fixed inset-0 z-20 bg-black/40 top-16"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Đóng sidebar"
                    />
                )}

                {!zenMode && <Sidebar isOpen={sidebarOpen} isMobile={isMobile} />}

                <main
                    className={cn(
                        "flex flex-col flex-1 min-h-0 transition-all duration-300 ease-in-out overflow-x-hidden",
                        zenMode 
                            ? "ml-0" 
                            : (isMobile ? "ml-0" : sidebarOpen ? "ml-60" : "ml-16")
                    )}
                >
                    <div className="flex-1">
                        {children}
                    </div>
                    <Footer />
                </main>

            </div>
        </div>
    );
}
