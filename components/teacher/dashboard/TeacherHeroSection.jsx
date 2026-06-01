import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Component TeacherHeroSection
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  currentUser  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function TeacherHeroSection({ currentUser }) {
    return (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-violet-950 to-indigo-950 text-white p-6 sm:p-8 md:p-10 shadow-2xl border border-white/10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs text-white font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    Hỗ trợ Trí tuệ Nhân tạo Gemini 2.5 Flash
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    Hệ Thống Ngân Hàng <br className="hidden sm:inline" /> Câu Hỏi & Đề Thi
                </h1>
                <p className="text-sm sm:text-base text-slate-300 max-w-md leading-relaxed">
                    Chào mừng {currentUser ? <span className="font-bold text-white">{currentUser.name}</span> : "bạn"} đến với hệ thống quản lý, biên soạn đề thi chuyên nghiệp tích hợp OCR quét đề nhanh bằng AI hàng đầu.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                    <Link href="/create-question">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-xl">
                            Soạn Đề Ngay
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                    {!currentUser && (
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="bg-white/5 border-white/20 hover:bg-white/10 text-white hover:text-white rounded-xl">
                                Đăng nhập dùng thử
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
