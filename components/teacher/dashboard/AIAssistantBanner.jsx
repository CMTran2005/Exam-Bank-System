import React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Component AIAssistantBanner
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function AIAssistantBanner() {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-5 bg-emerald-600 rounded-full" />
                Trợ Lý Soạn Đề AI
            </h2>
            <div className="bg-gradient-to-b from-card to-emerald-950/5 border border-emerald-500/10 dark:border-emerald-500/20 shadow-sm rounded-2xl p-5 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Nhập liệu thủ công mất quá nhiều thời gian? Hệ thống tích hợp <b>AI OCR</b> và <b>Gemini Vision</b> siêu mạnh mẽ.
                </p>
                <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground font-semibold">Nhận diện công thức toán học LaTeX chuẩn xác</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground font-semibold">Tự động bóc tách Đề bài & Lời giải mẫu</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground font-semibold">Nhận diện các loại câu hỏi nhóm phức tạp</p>
                    </div>
                </div>
                <div className="pt-2">
                    <Link href="/create-question">
                        <Button className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-600/90 text-white rounded-xl shadow-md shadow-emerald-500/10">
                            Thử ngay với Trợ Lý AI
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
