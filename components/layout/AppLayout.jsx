"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";

export default function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [zenMode, setZenMode] = useState(false);

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
