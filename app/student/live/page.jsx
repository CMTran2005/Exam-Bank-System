"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { liveQuizService } from "@/services/liveQuizService";
import { Gamepad2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function StudentLivePinPage() {
    const { currentUser } = useAuth();
    const router = useRouter();

    const [pinValues, setPinValues] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const [loading, setLoading] = useState(false);

    const pin = pinValues.join("");

    const handleJoin = async (e) => {
        e.preventDefault();

        const cleanPin = pin.trim();
        if (cleanPin.length !== 6 || isNaN(cleanPin)) {
            toast.error("Vui lòng nhập mã PIN hợp lệ gồm 6 chữ số!");
            return;
        }

        if (!currentUser) {
            toast.error("Vui lòng đăng nhập trước khi tham gia đấu trường!");
            return;
        }

        setLoading(false);
        setLoading(true);

        try {
            const sessionData = await liveQuizService.joinSession(
                cleanPin,
                currentUser.uid,
                currentUser.name || "Học sinh"
            );

            toast.success(`Đã tham gia phòng chơi: ${sessionData.examTitle}`);
            router.push(`/student/live/${sessionData.id}`);
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Không thể tham gia phòng thi. Vui lòng kiểm tra lại mã PIN.");
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (index, value) => {
        const val = value.slice(-1).replace(/\D/g, "");
        const newVals = [...pinValues];
        newVals[index] = val;
        setPinValues(newVals);
        
        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !pinValues[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        if (!pastedData) return;
        
        const cleanData = pastedData.replace(/\D/g, '').slice(0, 6);
        if (!cleanData) return;
        
        const newVals = [...pinValues];
        for (let i = 0; i < cleanData.length; i++) {
            newVals[i] = cleanData[i];
        }
        setPinValues(newVals);
        
        const nextIndex = Math.min(cleanData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    return (
        <div className="flex flex-col items-center justify-center py-10 md:py-20 animate-in fade-in duration-500">
            <div className="max-w-md w-full space-y-8">
                {/* Logo and Intro */}
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary animate-pulse">
                        <Gamepad2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
                            Live Quiz
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            Nhập mã PIN do Giáo viên cung cấp để tham gia trận đấu
                        </p>
                    </div>
                </div>

                {/* PIN Form card */}
                <Card className="p-8 rounded-3xl border-border/80 shadow-lg bg-card/50 backdrop-blur-sm space-y-6">
                    <form onSubmit={handleJoin} className="space-y-5">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block text-center">
                                Mã PIN Trận Đấu (6 chữ số)
                            </label>
                            <div className="flex justify-center gap-2 sm:gap-3">
                                {pinValues.map((v, i) => (
                                    <Input 
                                        key={i}
                                        ref={el => inputRefs.current[i] = el}
                                        value={v}
                                        onChange={(e) => handleCodeChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        onPaste={handlePaste}
                                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-xl bg-background border-border shadow-sm focus-visible:ring-primary focus-visible:ring-offset-1 transition-all placeholder:opacity-40"
                                        maxLength={1}
                                        disabled={loading}
                                        placeholder="-"
                                    />
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || pin.length !== 6}
                            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-14 rounded-2xl text-base shadow-lg shadow-primary/20 flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Đang kết nối phòng chờ...
                                </>
                            ) : (
                                <>
                                    Vào Phòng Chờ <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="border-t border-border/60 pt-4 text-center">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Yêu cầu tài khoản học sinh đã đăng nhập. <br />
                            Điểm số và thành tích đấu trường sẽ được tích lũy vào giải đấu tuần.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
