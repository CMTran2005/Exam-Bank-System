"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { studentService } from "@/services/studentService";
import { examAttemptService } from "@/services/examAttemptService";
import { Trophy, Medal, Flame, Star, Zap, ShieldCheck, Compass, MoonStar, Loader2, Crown, Target, Brain } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TIERS = {
    BRONZE: { label: "Đồng", color: "text-orange-700 dark:text-orange-500 bg-orange-700/10 border-orange-700/30" },
    SILVER: { label: "Bạc", color: "text-slate-500 dark:text-slate-300 bg-slate-500/10 border-slate-500/30" },
    GOLD: { label: "Vàng", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" },
    PLATINUM: { label: "Bạch Kim", color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30" },
    DIAMOND: { label: "Kim Cương", color: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/30" },
};

const ALL_BADGES = [
    { id: "first_blood", name: "Tân Binh Tích Cực", desc: "Hoàn thành bài thi đầu tiên", icon: Zap, tier: TIERS.BRONZE, condition: (a, c) => a.length >= 1 },
    
    // Người Chăm Chỉ Tiers
    { id: "hardworker_bronze", name: "Người Chăm Chỉ", desc: "Hoàn thành 5 bài thi", icon: Flame, tier: TIERS.BRONZE, condition: (a) => a.length >= 5 },
    { id: "hardworker_silver", name: "Người Chăm Chỉ", desc: "Hoàn thành 15 bài thi", icon: Flame, tier: TIERS.SILVER, condition: (a) => a.length >= 15 },
    { id: "hardworker_gold", name: "Người Chăm Chỉ", desc: "Hoàn thành 30 bài thi", icon: Flame, tier: TIERS.GOLD, condition: (a) => a.length >= 30 },
    { id: "hardworker_diamond", name: "Kẻ Cuồng Học", desc: "Hoàn thành 100 bài thi", icon: Flame, tier: TIERS.DIAMOND, condition: (a) => a.length >= 100 },
    
    // Thợ Săn Điểm Tốt Tiers
    { id: "excellent_bronze", name: "Thợ Săn Điểm", desc: "Đạt 1 bài thi >= 8 điểm", icon: Star, tier: TIERS.BRONZE, condition: (a) => a.filter(x => x.score >= 8).length >= 1 },
    { id: "excellent_silver", name: "Thợ Săn Điểm", desc: "Đạt 5 bài thi >= 8 điểm", icon: Star, tier: TIERS.SILVER, condition: (a) => a.filter(x => x.score >= 8).length >= 5 },
    { id: "excellent_gold", name: "Thợ Săn Điểm", desc: "Đạt 15 bài thi >= 8 điểm", icon: Star, tier: TIERS.GOLD, condition: (a) => a.filter(x => x.score >= 8).length >= 15 },
    
    // Thủ Khoa Tiers
    { id: "perfect_bronze", name: "Thủ Khoa", desc: "Đạt 1 bài thi >= 9.5 điểm", icon: Trophy, tier: TIERS.BRONZE, condition: (a) => a.filter(x => x.score >= 9.5).length >= 1 },
    { id: "perfect_gold", name: "Thủ Khoa Tuyệt Đối", desc: "Đạt 5 bài thi >= 9.5 điểm", icon: Trophy, tier: TIERS.GOLD, condition: (a) => a.filter(x => x.score >= 9.5).length >= 5 },
    { id: "perfect_diamond", name: "Thủ Khoa Huyền Thoại", desc: "Đạt 10 bài thi >= 9.5 điểm", icon: Crown, tier: TIERS.DIAMOND, condition: (a) => a.filter(x => x.score >= 9.5).length >= 10 },
    
    // Nhà Thám Hiểm
    { id: "explorer_bronze", name: "Nhà Thám Hiểm", desc: "Tham gia 3 lớp thi", icon: Compass, tier: TIERS.BRONZE, condition: (a, c) => c.length >= 3 },
    { id: "explorer_gold", name: "Chúa Tể Lớp Học", desc: "Tham gia 10 lớp thi", icon: Compass, tier: TIERS.GOLD, condition: (a, c) => c.length >= 10 },

    // Special
    { id: "flawless", name: "Xạ Thủ Hoàn Hảo", desc: "Đạt điểm 10 tròn trịa", icon: Target, tier: TIERS.PLATINUM, condition: (a) => a.some(x => x.score === 10) },
    { id: "night_owl", name: "Cú Đêm", desc: "Làm bài thi vào lúc 22h - 4h", icon: MoonStar, tier: TIERS.SILVER, condition: (a) => a.some(x => x.startTime && (new Date(x.startTime).getHours() >= 22 || new Date(x.startTime).getHours() <= 4)) },
];

export default function BadgesPage() {
    const { currentUser } = useAuth();
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ attempts: 0, classes: 0 });

    useEffect(() => {
        if (currentUser) {
            loadBadgesData();
        }
    }, [currentUser]);

    const loadBadgesData = async () => {
        setLoading(true);
        try {
            const [data, attempts] = await Promise.all([
                studentService.getJoinedClasses(currentUser.uid),
                examAttemptService.getStudentAttempts(currentUser.uid)
            ]);
            
            setStats({
                attempts: attempts.length,
                classes: data.length
            });

            // Tính toán huy hiệu thông minh
            const earnedBadgeIds = [];
            ALL_BADGES.forEach(badge => {
                try {
                    if (badge.condition(attempts, data)) {
                        earnedBadgeIds.push(badge.id);
                    }
                } catch (e) {
                    console.error("Lỗi tính badge", badge.id, e);
                }
            });
            
            setBadges(earnedBadgeIds);

            // Đồng bộ danh sách huy hiệu lên Firebase để giáo viên/hệ thống dễ truy xuất
            try {
                await updateDoc(doc(db, "users", currentUser.uid), {
                    badges: earnedBadgeIds,
                    lastBadgeSync: new Date().toISOString()
                });
            } catch (err) {
                console.warn("Không thể đồng bộ badges lên Firebase:", err);
            }
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải dữ liệu huy hiệu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-6 bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                            <Medal className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            Bộ sưu tập Huy Hiệu
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-medium max-w-2xl">
                        Khám phá và thu thập các danh hiệu độc quyền bằng cách tích cực hoàn thành bài thi và đạt điểm cao. Bạn đã thu thập được {badges.length}/{ALL_BADGES.length} huy hiệu!
                    </p>
                </div>
            </div>

            {/* Badges Grid */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {ALL_BADGES.map((b) => {
                            const isEarned = badges.includes(b.id);
                            const Icon = b.icon;
                            
                            if (isEarned) {
                                return (
                                    <div key={b.id} className={`p-6 rounded-3xl border ${b.tier.color} flex flex-col items-center justify-center text-center hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-md group relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 dark:bg-white/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                                        <div className="p-4 bg-background/50 rounded-2xl mb-3 backdrop-blur-sm border border-white/10 dark:border-white/5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                            <Icon className="w-10 h-10 drop-shadow-sm" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{b.tier.label}</span>
                                        <h3 className="font-black text-[15px] uppercase tracking-wide mb-1.5">{b.name}</h3>
                                        <p className="text-xs opacity-90 font-medium leading-tight px-2">{b.desc}</p>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={b.id} className={`p-6 rounded-3xl border border-border/40 bg-muted/10 flex flex-col items-center justify-center text-center opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 relative`}>
                                        <div className="p-4 bg-muted/50 rounded-2xl mb-3 border border-border/50">
                                            <Icon className="w-10 h-10 text-muted-foreground/50" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">{b.tier.label}</span>
                                        <h3 className="font-bold text-[15px] uppercase tracking-wide mb-1.5 text-muted-foreground">{b.name}</h3>
                                        <p className="text-xs font-medium leading-tight text-muted-foreground px-2">{b.desc}</p>
                                        <div className="absolute top-3 right-3 text-[10px] font-bold bg-background/50 text-muted-foreground px-2 py-1 rounded-md border border-border/50 backdrop-blur-sm shadow-sm">
                                            Khóa
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
