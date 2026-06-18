"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { leagueService } from "@/services/leagueService";
import { badgeService } from "@/services/badgeService";
import { LEAGUE_TIERS, LEAGUE_GROUP_SIZE, getPromotionStatus } from "@/lib/leagueConstants";
import { Trophy, Shield, Gem, Crown, Rocket, Sparkles, TrendingUp, TrendingDown, Minus, Info, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import Image from "next/image";

const RankIcon = ({ tierId, className = "w-6 h-6" }) => {
    if (tierId <= 4) return <Shield className={className} />;
    if (tierId <= 9) return <Gem className={className} />;
    if (tierId <= 13) return <Sparkles className={className} />;
    if (tierId === 14) return <Rocket className={className} />;
    return <Crown className={className} />;
};

export default function LeaguesPage() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [leagueInfo, setLeagueInfo] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [allBadges, setAllBadges] = useState([]);
    const [focusedTierId, setFocusedTierId] = useState(1);

    useEffect(() => {
        const fetchLeague = async () => {
            if (!currentUser?.uid) return;
            try {
                // Đảm bảo user có dữ liệu league cơ bản
                await leagueService.initUserLeague(currentUser.uid);
                const info = await leagueService.getUserLeagueInfo(currentUser.uid);
                setLeagueInfo(info);
                if (info?.leagueRank) {
                    setFocusedTierId(info.leagueRank);
                }

                if (info?.leagueGroupId) {
                    const [board, badges] = await Promise.all([
                        leagueService.getGroupLeaderboard(info.leagueGroupId),
                        badgeService.getBadges()
                    ]);
                    setLeaderboard(board);
                    setAllBadges(badges);
                } else {
                    const badges = await badgeService.getBadges();
                    setAllBadges(badges);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeague();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[80vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    const currentTier = LEAGUE_TIERS[leagueInfo.leagueRank || 1];
    const focusedTier = LEAGUE_TIERS[focusedTierId] || currentTier;

    const myRankIndex = leaderboard.findIndex(m => m.userId === currentUser?.uid);
    const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;
    const myExp = leagueInfo.weeklyExp || 0;

    const isCurrent = focusedTier.id === currentTier.id;
    const isPassed = focusedTier.id < currentTier.id;

    // Xác định thông điệp trạng thái cho hạng đang focus
    let focusMessage = "";
    if (isCurrent) focusMessage = "CẤP BẬC HIỆN TẠI";
    else if (isPassed) focusMessage = "ĐÃ VƯỢT QUA";
    else focusMessage = "CHƯA ĐẠT ĐƯỢC";

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* HERO SECTION - TỔNG QUAN HẠNG & HÀNH TRÌNH CAROUSEL */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl flex flex-col items-center justify-center select-none">
                {/* Lớp nền phát sáng mờ ảo theo rank đang xem */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
                <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full ${focusedTier.color.replace('text-', 'bg-')}/10 blur-3xl pointer-events-none transition-colors duration-500`}></div>

                {/* Phần thông tin chính */}
                <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8 sm:gap-12 w-full">
                    {/* Badge Carousel */}
                    <div className="flex items-center justify-between sm:justify-center w-full sm:w-auto gap-2 sm:gap-4">
                        <button
                            onClick={() => setFocusedTierId(Math.max(1, focusedTierId - 1))}
                            disabled={focusedTierId === 1}
                            className="p-2 sm:p-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white disabled:opacity-30 disabled:hover:bg-slate-100 dark:disabled:hover:bg-white/5 transition-all active:scale-95 flex-shrink-0"
                        >
                            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>

                        <div className="flex flex-col items-center relative">
                            <div className={`w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center rounded-[2rem] border-2 shadow-2xl backdrop-blur-xl transition-all duration-500 transform
                                ${focusedTier.color.replace('text-', 'border-')} 
                                ${isCurrent ? 'bg-slate-50/80 dark:bg-slate-800/80 scale-105' : isPassed ? 'bg-slate-100/50 dark:bg-slate-800/50 grayscale-[30%]' : 'bg-slate-100/50 dark:bg-slate-900/50 grayscale opacity-70 scale-95'}`}
                            >
                                <RankIcon tierId={focusedTier.id} className={`w-16 h-16 sm:w-24 sm:h-24 transition-colors duration-500 ${isCurrent || isPassed ? focusedTier.color : 'text-slate-600'}`} />
                            </div>
                        </div>

                        <button
                            onClick={() => setFocusedTierId(Math.min(15, focusedTierId + 1))}
                            disabled={focusedTierId === 15}
                            className="p-2 sm:p-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white disabled:opacity-30 disabled:hover:bg-slate-100 dark:disabled:hover:bg-white/5 transition-all active:scale-95 flex-shrink-0"
                        >
                            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>
                    </div>

                    {/* Thông tin Text */}
                    <div className="flex-1 text-center sm:text-left space-y-4">
                        <div>
                            <h2 className={`text-xs font-bold tracking-[0.2em] uppercase mb-2 transition-colors ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isPassed ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {focusMessage}
                            </h2>
                            <h1 className={`text-4xl sm:text-5xl font-black tracking-tight drop-shadow-sm transition-colors duration-500 ${isCurrent || isPassed ? focusedTier.color : 'text-slate-400 dark:text-slate-500'}`}>
                                {focusedTier.nameVi} <span className="text-xl sm:text-2xl font-bold opacity-60">({focusedTier.nameEn})</span>
                            </h1>
                        </div>

                        {/* Chỉ hiện chi tiết EXP & Thông điệp cho rank hiện tại */}
                        <div className={`transition-all duration-500 overflow-hidden ${isCurrent ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0'}`}>
                            <p className="text-slate-600 dark:text-slate-300 text-lg mb-4">
                                Tuần này bạn đã kiếm được <span className="font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-lg ml-1 border border-slate-200 dark:border-white/10">{myExp} EXP</span>
                            </p>

                            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-medium text-left">
                                {myRank
                                    ? (getPromotionStatus(myRank, currentTier.id) === 'promoted' ? "Tuyệt vời! Đang nằm trong nhóm Thăng hạng." :
                                        getPromotionStatus(myRank, currentTier.id) === 'demoted' ? "Cố gắng lên! Bạn đang ở nhóm có nguy cơ Giáng hạng." : "Cố gắng lên! Hãy kiếm thêm EXP để leo lên nhóm Thăng hạng.")
                                    : "Bắt đầu làm bài để được xếp Bảng đấu tuần này!"
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BẢNG XẾP HẠNG KHỐC LIỆT */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" /> Đấu Trường Tuần
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">Reset vào mỗi 00:00 Thứ Hai.</p>
                    </div>
                    {/* Bỏ chú giải cũ vì giờ đã phân chia thành các Box rõ ràng */}
                </div>

                {!leagueInfo?.leagueGroupId ? (
                    <div className="text-center p-12 bg-card rounded-3xl border border-border border-dashed">
                        <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                            <Zap className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h4 className="text-xl font-semibold text-foreground mb-2">Bạn chưa được phân bảng</h4>
                        <p className="text-muted-foreground">Hãy kiếm EXP đầu tiên trong tuần này để tham chiến!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(() => {
                            const promotedRanks = [];
                            const stayRanks = [];
                            const demotedRanks = [];

                            const actualLength = Math.max(leaderboard.length, 1);
                            for (let i = 1; i <= actualLength; i++) {
                                const status = getPromotionStatus(i, currentTier.id);
                                if (status === 'promoted') promotedRanks.push(i);
                                else if (status === 'demoted') demotedRanks.push(i);
                                else stayRanks.push(i);
                            }

                            const renderRow = (rank, member, isMe, borderLeftClass, textStyle, icon, isLast) => {
                                const borderBottomClass = !isLast ? "border-b border-slate-100 dark:border-slate-700/50" : "";
                                const rowBgClass = isMe ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50';

                                return (
                                    <div key={rank} className={`flex items-center px-4 sm:px-6 py-4 transition-all ${borderBottomClass} ${borderLeftClass} ${rowBgClass}`}>
                                        <div className="w-12 text-center flex flex-col items-center">
                                            <span className={`text-lg font-black ${rank <= 3 ? 'text-yellow-500' : 'text-slate-400'}`}>{rank}</span>
                                            {icon}
                                        </div>

                                        <div className="flex-1 flex items-center gap-4 ml-2">
                                            {member ? (
                                                <>
                                                    <div className="relative">
                                                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isMe ? 'border-indigo-500 shadow-md' : 'border-slate-200 dark:border-slate-700'}`}>
                                                            {member.photoURL ? (
                                                                <Image src={member.photoURL} alt="Avatar" width={48} height={48} className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold uppercase text-lg">
                                                                    {member.displayName?.charAt(0) || "U"}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isMe && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></div>}
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold text-base flex items-center gap-2 ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                            {member.displayName} {isMe && <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-md uppercase">Bạn</span>}

                                                            {/* Hiển thị huy hiệu (Showcase) */}
                                                            {member.showcasedBadges && member.showcasedBadges.length > 0 && (
                                                                <div className="flex items-center gap-1 ml-1">
                                                                    {member.showcasedBadges.map(bId => {
                                                                        const badgeObj = allBadges.find(b => b.id === bId);
                                                                        if (!badgeObj) return null;
                                                                        const BadgeIcon = Icons[badgeObj.iconStr] || Icons.Medal;
                                                                        return (
                                                                            <div key={bId} title={badgeObj.name} className={`flex items-center justify-center w-6 h-6 rounded-full border bg-white dark:bg-slate-800 shadow-sm overflow-hidden ${badgeObj.tier?.color.split(' ')[0]} ${badgeObj.tier?.color.match(/border-\S+/)?.[0] || 'border-slate-200'}`}>
                                                                                <BadgeIcon className="w-3.5 h-3.5" />
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-slate-500 mt-0.5">Top {Math.ceil(rank / LEAGUE_GROUP_SIZE * 100)}%</div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-slate-400 dark:text-slate-500 italic font-medium">Vị trí trống</div>
                                            )}
                                        </div>

                                        {member && (
                                            <div className={`text-right flex flex-col items-end`}>
                                                <span className={`text-xl ${textStyle}`}>{member.exp}</span>
                                                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">EXP</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            };

                            const renderGroup = (ranks, title, headerIcon, headerBg, headerText, borderLeft, textStyle, rowIcon, borderColor) => {
                                if (ranks.length === 0) return null;
                                return (
                                    <div className={`rounded-3xl border ${borderColor} bg-white dark:bg-slate-800/60 backdrop-blur-md overflow-hidden shadow-sm`}>
                                        <div className={`px-6 py-3 flex items-center gap-2 font-bold ${headerBg} ${headerText} border-b ${borderColor}`}>
                                            {headerIcon}
                                            {title}
                                        </div>
                                        <div className="flex flex-col">
                                            {ranks.map((rank, index) => {
                                                const member = leaderboard[rank - 1];
                                                const isMe = member?.userId === currentUser?.uid;
                                                return renderRow(rank, member, isMe, borderLeft, textStyle, rowIcon, index === ranks.length - 1);
                                            })}
                                        </div>
                                    </div>
                                );
                            };

                            return (
                                <>
                                    {renderGroup(
                                        promotedRanks,
                                        "Vùng Thăng Hạng",
                                        <TrendingUp className="w-5 h-5" />,
                                        "bg-emerald-500/10",
                                        "text-emerald-600 dark:text-emerald-400",
                                        "border-l-4 border-emerald-500",
                                        "text-emerald-600 dark:text-emerald-400 font-bold",
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />,
                                        "border-emerald-500/20"
                                    )}

                                    {renderGroup(
                                        stayRanks,
                                        "Vùng An Toàn (Trụ Hạng)",
                                        <Minus className="w-5 h-5" />,
                                        "bg-slate-50 dark:bg-slate-800/50",
                                        "text-slate-700 dark:text-slate-300",
                                        "border-l-4 border-slate-200 dark:border-slate-700/50",
                                        "text-slate-600 dark:text-slate-400",
                                        <Minus className="w-4 h-4 text-slate-400" />,
                                        "border-slate-200 dark:border-slate-700/50"
                                    )}

                                    {renderGroup(
                                        demotedRanks,
                                        "Vùng Nguy Hiểm (Rớt Hạng)",
                                        <TrendingDown className="w-5 h-5" />,
                                        "bg-rose-500/10",
                                        "text-rose-600 dark:text-rose-400",
                                        "border-l-4 border-rose-500",
                                        "text-rose-600 dark:text-rose-400 font-bold",
                                        <TrendingDown className="w-4 h-4 text-rose-500" />,
                                        "border-rose-500/20"
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

        </div>
    );
}
