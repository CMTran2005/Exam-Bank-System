"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { encouragementService } from "@/services/encouragementService";
import confetti from "canvas-confetti";
import { Heart, Trophy, Star, Sparkles, X } from "lucide-react";

export default function EncouragementPopup() {
    const { currentUser } = useAuth();
    const [unreadList, setUnreadList] = useState([]);
    const [currentMessage, setCurrentMessage] = useState(null);

    const STICKER_MAP = {
        "trophy": { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-100" },
        "star": { icon: Star, color: "text-amber-500", bg: "bg-amber-100" },
        "heart": { icon: Heart, color: "text-red-500", bg: "bg-red-100" },
        "sparkles": { icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-100" },
    };

    useEffect(() => {
        if (!currentUser?.uid) return;

        const unsubscribe = encouragementService.listenForUnread(currentUser.uid, (list) => {
            if (list.length > 0) {
                // Chỉ hiển thị tin nhắn đầu tiên trong mảng
                setCurrentMessage(list[0]);
                setUnreadList(list);
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (currentMessage) {
            triggerConfetti();
        }
    }, [currentMessage]);

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    };

    const handleAcknowledge = async () => {
        if (!currentMessage || !currentUser?.uid) return;

        // Cập nhật lên DB
        await encouragementService.markAsRead(currentUser.uid, currentMessage.id);

        // Loại bỏ khỏi state
        setCurrentMessage(null);

        // Nếu còn tin nhắn khác, hiển thị tiếp
        const remaining = unreadList.filter(msg => msg.id !== currentMessage.id);
        setUnreadList(remaining);
        if (remaining.length > 0) {
            setTimeout(() => {
                setCurrentMessage(remaining[0]);
            }, 500);
        }
    };

    if (!currentMessage) return null;

    const StickerConfig = STICKER_MAP[currentMessage.sticker] || STICKER_MAP["heart"];
    const StickerIcon = StickerConfig.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border shadow-2xl rounded-3xl p-8 max-w-sm w-full text-center relative animate-in zoom-in-95 duration-500">
                <button
                    onClick={handleAcknowledge}
                    className="absolute right-4 top-4 text-muted-foreground hover:bg-muted rounded-full p-1 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className={`w-24 h-24 mx-auto rounded-full ${StickerConfig.bg} flex items-center justify-center mb-6 shadow-inner relative`}>
                    <div className="absolute inset-0 bg-white/20 dark:bg-black/20 rounded-full animate-ping opacity-75"></div>
                    <StickerIcon className={`w-12 h-12 ${StickerConfig.color} animate-bounce`} />
                </div>

                <h3 className="text-2xl font-black text-foreground mb-2">
                    Tin nhắn từ {currentMessage.parentName}!
                </h3>

                <p className="text-lg text-muted-foreground mb-8 italic">
                    "{currentMessage.message}"
                </p>

                <button
                    onClick={handleAcknowledge}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-rose-500/20 hover:-translate-y-1 transition-all"
                >
                    Tuyệt vời!
                </button>
            </div>
        </div>
    );
}
