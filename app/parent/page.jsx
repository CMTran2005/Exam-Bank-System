"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useChildren } from "@/hooks/parent/useChildren";
import { db } from "@/lib/firebase";
import { encouragementService } from "@/services/encouragementService";
import { Loader2, Plus, UserPlus, GraduationCap, Clock, Award, Activity, Search, ShieldCheck, Heart, Star, Trophy, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

import { ChildCard } from "@/components/parent/ChildCard";
import { LinkStudentModal } from "@/components/parent/LinkStudentModal";
import { EncourageModal } from "@/components/parent/EncourageModal";

/**
 * Component ParentDashboard
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function ParentDashboard() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const { childrenData, loading, linkStudent } = useChildren(currentUser);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [studentEmailOrId, setStudentEmailOrId] = useState("");
    const [linking, setLinking] = useState(false);

    // Encouragement Modal State
    const [isEncourageModalOpen, setIsEncourageModalOpen] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [encouragementMessage, setEncouragementMessage] = useState("Bố mẹ rất tự hào về con! Tiếp tục phát huy nhé!");
    const [selectedSticker, setSelectedSticker] = useState("trophy");
    const [sending, setSending] = useState(false);

    const STICKERS = [
        { id: "trophy", icon: Trophy, label: "Cúp Vàng", color: "text-yellow-500", bg: "bg-yellow-100" },
        { id: "star", icon: Star, label: "Ngôi Sao", color: "text-amber-500", bg: "bg-amber-100" },
        { id: "heart", icon: Heart, label: "Thương Yêu", color: "text-red-500", bg: "bg-red-100" },
        { id: "sparkles", icon: Sparkles, label: "Phép Màu", color: "text-indigo-500", bg: "bg-indigo-100" },
    ];

    const handleLinkStudent = async () => {
        setLinking(true);
        const success = await linkStudent(studentEmailOrId);
        setLinking(false);
        if (success) {
            setIsLinkModalOpen(false);
            setStudentEmailOrId("");
        }
    };

    const handleSendEncouragement = async () => {
        if (!selectedChild) return;
        setSending(true);
        try {
            await encouragementService.sendEncouragement(
                selectedChild.id, 
                currentUser.displayName || "Phụ huynh", 
                encouragementMessage, 
                selectedSticker
            );
            toast.success("Đã gửi lời chúc đến con thành công! 💌");
            setIsEncourageModalOpen(false);
            setEncouragementMessage("Bố mẹ rất tự hào về con! Tiếp tục phát huy nhé!");
        } catch (error) {
            toast.error("Không thể gửi lời chúc, vui lòng thử lại sau.");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        Trang chủ Phụ Huynh
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý và theo dõi tiến độ học tập của các con.</p>
                </div>
                <Button onClick={() => setIsLinkModalOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 rounded-xl gap-2 font-bold">
                    <UserPlus className="w-4 h-4" /> Liên kết Tài khoản Con
                </Button>
            </div>

            {childrenData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {childrenData.map(child => (
                        <ChildCard 
                            key={child.id}
                            child={child}
                            router={router}
                            onEncourage={(childData) => {
                                setSelectedChild(childData);
                                setIsEncourageModalOpen(true);
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Chưa có học sinh nào được liên kết</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                            Bạn cần liên kết tài khoản với con mình để có thể theo dõi biểu đồ điểm số, số giờ làm bài và nhận báo cáo học tập định kỳ.
                        </p>
                    </div>
                    <Button onClick={() => setIsLinkModalOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white mt-4 rounded-xl">
                        Liên kết ngay
                    </Button>
                </div>
            )}

            <LinkStudentModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                studentEmailOrId={studentEmailOrId}
                setStudentEmailOrId={setStudentEmailOrId}
                linking={linking}
                handleLinkStudent={handleLinkStudent}
            />

            <EncourageModal
                isOpen={isEncourageModalOpen}
                onClose={() => setIsEncourageModalOpen(false)}
                selectedChild={selectedChild}
                encouragementMessage={encouragementMessage}
                setEncouragementMessage={setEncouragementMessage}
                selectedSticker={selectedSticker}
                setSelectedSticker={setSelectedSticker}
                stickers={STICKERS}
                sending={sending}
                handleSendEncouragement={handleSendEncouragement}
            />
        </div>
    );
}
