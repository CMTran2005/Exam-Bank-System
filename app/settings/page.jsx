"use client";

import { useState } from "react";
import {
    Settings,
    User,
    Sliders,
    Cpu,
    Eye,
    EyeOff,
    CheckCircle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
    const { currentUser } = useAuth();

    // Tab state
    const [activeTab, setActiveTab] = useState("profile");

    // Profile state
    const [name, setName] = useState(currentUser?.name || "Nguyễn Văn Admin");
    const [email, setEmail] = useState(currentUser?.email || "admin@test.com");
    const [school, setSchool] = useState("Trường THPT Chuyên Quốc Học");

    // Exam defaults
    const [defaultPoints, setDefaultPoints] = useState("1.0");
    const [pointsStep, setPointsStep] = useState("0.25");
    const [autoNumbering, setAutoNumbering] = useState(true);

    // AI settings
    const [geminiKey, setGeminiKey] = useState("••••••••••••••••••••••••••••••••••••");
    const [showKey, setShowKey] = useState(false);
    const [ocrConfidence, setOcrConfidence] = useState("95");

    // Button status
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);
        setSavedSuccess(false);

        // Simulate save latency
        setTimeout(() => {
            setSaving(false);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
        }, 1000);
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-primary rounded-full" />
                        Cấu Hình Hệ Thống
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">Cá nhân hóa tài khoản và thiết lập đề thi</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {/* Tab selector menu */}
                <div className="md:col-span-1 bg-card border border-border/80 shadow-sm rounded-2xl p-2 flex flex-row md:flex-col gap-1 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                            activeTab === "profile"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <User className="w-4 h-4 shrink-0" />
                        <span>Hồ sơ cá nhân</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("exam")}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                            activeTab === "exam"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <Sliders className="w-4 h-4 shrink-0" />
                        <span>Mặc định đề thi</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("ai")}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                            activeTab === "ai"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <Cpu className="w-4 h-4 shrink-0" />
                        <span>Trợ lý AI & OCR</span>
                    </button>
                </div>

                {/* Tab body content */}
                <div className="md:col-span-3 bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6">
                    <form onSubmit={handleSave} className="space-y-6">
                        {activeTab === "profile" && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                                    Thông tin giáo viên
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Họ và tên</label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-10 border-border"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Địa chỉ Email</label>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-10 border-border bg-muted/30"
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground">Tên trường học / Đơn vị công tác</label>
                                    <Input
                                        value={school}
                                        onChange={(e) => setSchool(e.target.value)}
                                        className="h-10 border-border"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "exam" && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                                    Tham số mặc định đề thi
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Điểm mặc định mỗi câu hỏi</label>
                                        <Input
                                            type="number"
                                            step="0.25"
                                            value={defaultPoints}
                                            onChange={(e) => setDefaultPoints(e.target.value)}
                                            className="h-10 border-border"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Bước nhảy tăng điểm (step)</label>
                                        <Input
                                            type="number"
                                            step="0.05"
                                            value={pointsStep}
                                            onChange={(e) => setPointsStep(e.target.value)}
                                            className="h-10 border-border"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Tự động điền ký hiệu số câu</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Tự sinh nhãn "CÂU 1", "CÂU 2" khi thêm mới câu hỏi.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={autoNumbering}
                                        onChange={(e) => setAutoNumbering(e.target.checked)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "ai" && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                                    Cấu hình Google Gemini & Trợ lý OCR
                                </h2>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground">Gemini API Key</label>
                                    <div className="relative">
                                        <Input
                                            type={showKey ? "text" : "password"}
                                            value={geminiKey}
                                            onChange={(e) => setGeminiKey(e.target.value)}
                                            className="h-10 border-border pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                                        >
                                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Key được lưu trữ cục bộ bảo mật, phục vụ việc phân tích đề bài từ hình ảnh.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground">Ngưỡng chính xác nhận diện tối thiểu (%)</label>
                                    <Input
                                        type="number"
                                        value={ocrConfidence}
                                        onChange={(e) => setOcrConfidence(e.target.value)}
                                        className="h-10 border-border"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Save Action Buttons & Success Toast */}
                        <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
                            {savedSuccess ? (
                                <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="w-4 h-4 mr-1.5 shrink-0" />
                                    Cập nhật thành công!
                                </div>
                            ) : (
                                <div />
                            )}
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl h-10 px-6 shrink-0"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu lại...
                                    </>
                                ) : (
                                    "Lưu cấu hình"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
