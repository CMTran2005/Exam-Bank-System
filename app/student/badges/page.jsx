"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { studentService } from "@/services/studentService";
import { examAttemptService } from "@/services/examAttemptService";
import { badgeService } from "@/services/badgeService";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Global cache để giữ dữ liệu khi chuyển trang (SWR pattern)
let badgesCache = null;

/**
 * Component BadgesPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function BadgesPage() {
    const { currentUser } = useAuth();
    const [allBadges, setAllBadges] = useState([]);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(!badgesCache);
    const [showLocked, setShowLocked] = useState(false);
    const [stats, setStats] = useState({ attempts: 0, classes: 0 });

    useEffect(() => {
        if (currentUser) {
            loadBadgesData();
        }
    }, [currentUser]);

    const loadBadgesData = async () => {
        if (badgesCache && badgesCache.uid === currentUser.uid) {
            setAllBadges(badgesCache.allBadges);
            setBadges(badgesCache.badges);
            setStats(badgesCache.stats);
            setLoading(false); // Hiện UI ngay lập tức
        } else {
            setLoading(true);
        }

        try {
            const [data, attempts, fetchedBadges] = await Promise.all([
                studentService.getJoinedClasses(currentUser.uid),
                examAttemptService.getStudentAttempts(currentUser.uid),
                badgeService.getBadges()
            ]);
            
            setAllBadges(fetchedBadges);

            setStats({
                attempts: attempts.length,
                classes: data.length
            });

            // Tính toán huy hiệu thông minh qua badgeService
            const earnedBadgeIds = [];
            fetchedBadges.forEach(badge => {
                try {
                    if (badgeService.evaluateCondition(badge, attempts, data)) {
                        earnedBadgeIds.push(badge.id);
                    }
                } catch (e) {
                    console.error("Lỗi tính badge", badge.id, e);
                }
            });
            
            setBadges(earnedBadgeIds);

            badgesCache = {
                uid: currentUser.uid,
                allBadges: fetchedBadges,
                badges: earnedBadgeIds,
                stats: { attempts: attempts.length, classes: data.length }
            };

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

    const getBadgeFamily = (id) => {
        if (id.startsWith("hardworker_")) return "hardworker";
        if (id.startsWith("excellent_")) return "excellent";
        if (id.startsWith("perfect_")) return "perfect";
        if (id.startsWith("explorer_")) return "explorer";
        if (id.startsWith("score_accumulator_")) return "score_accumulator";
        if (id.startsWith("consistent_")) return "consistent";
        if (id.startsWith("polymath_")) return "polymath";
        if (id.startsWith("streak_")) return "streak_days"; 
        return id; // single badges
    };

    const getTierLevel = (label) => {
        if (label === "Đồng") return 1;
        if (label === "Bạc") return 2;
        if (label === "Vàng") return 3;
        if (label === "Bạch Kim") return 4;
        if (label === "Kim Cương") return 5;
        return 0;
    };

    const processBadges = () => {
        const grouped = {};
        allBadges.forEach(b => {
            const family = getBadgeFamily(b.id);
            if (!grouped[family]) grouped[family] = [];
            grouped[family].push(b);
        });

        const displayList = [];
        let earnedFamiliesCount = 0;

        Object.values(grouped).forEach(familyBadges => {
            familyBadges.sort((a, b) => getTierLevel(a.tier?.label) - getTierLevel(b.tier?.label));
            
            let highestEarned = null;
            let nextLocked = null;
            
            for (const b of familyBadges) {
                if (badges.includes(b.id)) {
                    highestEarned = b;
                } else if (!nextLocked) {
                    nextLocked = b;
                }
            }
            
            if (highestEarned) {
                earnedFamiliesCount++;
                displayList.push({ ...highestEarned, isEarned: true, nextTarget: nextLocked });
            } else if (nextLocked) {
                displayList.push({ ...nextLocked, isEarned: false });
            }
        });

        // Ẩn huy hiệu khoá nếu showLocked = false
        const filteredList = showLocked ? displayList : displayList.filter(b => b.isEarned);

        // Sắp xếp displayList: Đã mở khóa lên trước, sau đó sắp xếp theo tier từ cao xuống thấp
        filteredList.sort((a, b) => {
            if (a.isEarned && !b.isEarned) return -1;
            if (!a.isEarned && b.isEarned) return 1;
            
            const tierA = getTierLevel(a.tier?.label);
            const tierB = getTierLevel(b.tier?.label);
            if (tierA !== tierB) return tierB - tierA;
            
            return a.name.localeCompare(b.name);
        });

        return { displayList: filteredList, totalFamilies: Object.keys(grouped).length, earnedFamiliesCount };
    };

    const { displayList, totalFamilies, earnedFamiliesCount } = processBadges();

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-6 bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                            <Icons.Medal className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            Bộ sưu tập Huy Hiệu
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-medium max-w-2xl">
                        Khám phá và thu thập các danh hiệu độc quyền bằng cách tích cực hoàn thành bài thi và đạt điểm cao. Bạn đã thu thập được {earnedFamiliesCount}/{totalFamilies} nhóm huy hiệu!
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <button 
                            onClick={() => setShowLocked(!showLocked)}
                            className="flex items-center gap-2 px-4 py-2 bg-background/50 hover:bg-background/80 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 backdrop-blur-sm shadow-sm"
                        >
                            {showLocked ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                            {showLocked ? "Ẩn danh hiệu chưa đạt" : "Hiển thị danh hiệu chưa đạt"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Badges Grid */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Icons.Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {displayList.map((b) => {
                            const isEarned = b.isEarned;
                            const Icon = Icons[b.iconStr] || Icons.Medal;
                            
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
                                        
                                        {/* Hiển thị mục tiêu tiếp theo nếu có */}
                                        {b.nextTarget && (
                                            <div className="mt-3 pt-3 border-t border-white/10 w-full text-center">
                                                <p className="text-[9px] opacity-70 uppercase tracking-widest mb-1">Mục tiêu tiếp theo</p>
                                                <p className="text-[10px] font-medium">{b.nextTarget.desc}</p>
                                            </div>
                                        )}
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
                        {displayList.length === 0 && !loading && (
                            <div className="col-span-full py-16 text-center flex flex-col items-center justify-center opacity-60">
                                <Icons.Ghost className="w-16 h-16 mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-bold text-foreground">Chưa có huy hiệu nào</h3>
                                <p className="text-sm font-medium text-muted-foreground mt-1">Hãy tiếp tục làm bài thi để thu thập huy hiệu đầu tiên nhé!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
