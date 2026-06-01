import { useState, useEffect } from "react";
import { Trophy, Medal, Award, Crown, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { examAttemptService } from "@/services/examAttemptService";

/**
 * Component ClassLeaderboard
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  classId - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function ClassLeaderboard({ classId, currentUserUid }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (classId) {
            loadLeaderboard();
        }
    }, [classId]);

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await examAttemptService.getClassLeaderboard(classId);
            setLeaderboard(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 bg-card border border-border rounded-2xl shadow-sm h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground font-medium">Đang tải bảng xếp hạng...</p>
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-card border border-border rounded-2xl shadow-sm text-center h-full px-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-bold text-lg mb-1">Chưa có dữ liệu thi đua</h3>
                <p className="text-sm text-muted-foreground">Bảng xếp hạng sẽ xuất hiện sau khi có học sinh hoàn thành bài kiểm tra.</p>
            </div>
        );
    }

    const top3 = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3, 10); // Show top 10 max

    const getMedalColor = (index) => {
        if (index === 0) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
        if (index === 1) return "text-slate-400 bg-slate-400/10 border-slate-400/20";
        if (index === 2) return "text-amber-600 bg-amber-600/10 border-amber-600/20";
        return "text-muted-foreground bg-muted border-transparent";
    };

    const getMedalIcon = (index) => {
        if (index === 0) return <Crown className="w-5 h-5 text-yellow-500 mb-1" />;
        if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
        if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
        return null;
    };

    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none" />
            
            <div className="p-5 border-b border-border/50 bg-background/50 flex items-center justify-between z-10 relative">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="font-bold text-foreground leading-tight">Bảng Vàng Thi Đua</h2>
                        <p className="text-[11px] font-medium text-muted-foreground">Top 10 học sinh xuất sắc nhất</p>
                    </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>

            <div className="p-5 flex-1 flex flex-col">
                {/* Top 3 Podium */}
                {top3.length > 0 && (
                    <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 mt-4">
                        {/* Hạng 2 */}
                        {top3[1] && (
                            <div className="flex flex-col items-center w-1/3">
                                {getMedalIcon(1)}
                                <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-sm font-bold text-slate-600 shadow-sm z-10 relative">
                                    {top3[1].studentName.charAt(0).toUpperCase()}
                                    {top3[1].studentId === currentUserUid && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />}
                                </div>
                                <div className="w-full h-16 bg-gradient-to-t from-slate-200/50 to-slate-100/30 border border-slate-200 rounded-t-lg mt-2 flex flex-col items-center pt-2">
                                    <span className="font-black text-slate-500">2</span>
                                </div>
                                <div className="text-center mt-2 w-full">
                                    <p className="text-xs font-bold truncate px-1 text-foreground" title={top3[1].studentName}>
                                        {top3[1].studentId === currentUserUid ? "Bạn" : top3[1].studentName}
                                    </p>
                                    <p className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 mx-auto mt-1 w-max">
                                        {top3[1].totalScore.toFixed(1)} đ
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Hạng 1 */}
                        <div className="flex flex-col items-center w-1/3 -mt-6">
                            {getMedalIcon(0)}
                            <div className="w-16 h-16 rounded-full bg-yellow-100 border-2 border-yellow-400 flex items-center justify-center text-lg font-black text-yellow-600 shadow-md z-10 relative ring-4 ring-yellow-400/20">
                                {top3[0].studentName.charAt(0).toUpperCase()}
                                {top3[0].studentId === currentUserUid && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
                            </div>
                            <div className="w-full h-24 bg-gradient-to-t from-yellow-200/40 to-yellow-100/20 border border-yellow-200 rounded-t-lg mt-2 flex flex-col items-center pt-2">
                                <span className="font-black text-yellow-600 text-lg">1</span>
                            </div>
                            <div className="text-center mt-2 w-full">
                                <p className="text-sm font-black truncate px-1 text-foreground" title={top3[0].studentName}>
                                    {top3[0].studentId === currentUserUid ? "Bạn" : top3[0].studentName}
                                </p>
                                <p className="text-[11px] font-black text-amber-600 bg-amber-500/10 rounded-full px-2.5 py-0.5 mx-auto mt-1 w-max">
                                    {top3[0].totalScore.toFixed(1)} đ
                                </p>
                            </div>
                        </div>

                        {/* Hạng 3 */}
                        {top3[2] && (
                            <div className="flex flex-col items-center w-1/3">
                                {getMedalIcon(2)}
                                <div className="w-12 h-12 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center text-sm font-bold text-orange-600 shadow-sm z-10 relative">
                                    {top3[2].studentName.charAt(0).toUpperCase()}
                                    {top3[2].studentId === currentUserUid && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />}
                                </div>
                                <div className="w-full h-12 bg-gradient-to-t from-orange-200/40 to-orange-100/20 border border-orange-200 rounded-t-lg mt-2 flex flex-col items-center pt-1.5">
                                    <span className="font-black text-orange-500">3</span>
                                </div>
                                <div className="text-center mt-2 w-full">
                                    <p className="text-xs font-bold truncate px-1 text-foreground" title={top3[2].studentName}>
                                        {top3[2].studentId === currentUserUid ? "Bạn" : top3[2].studentName}
                                    </p>
                                    <p className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 mx-auto mt-1 w-max">
                                        {top3[2].totalScore.toFixed(1)} đ
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Others */}
                <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
                    {others.map((student, idx) => {
                        const rank = idx + 4;
                        const isMe = student.studentId === currentUserUid;
                        
                        return (
                            <div 
                                key={student.studentId} 
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isMe ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-background border-border/50 hover:bg-muted/50'}`}
                            >
                                <div className="w-6 text-center font-black text-xs text-muted-foreground/70">
                                    #{rank}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                                    {student.studentName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                                        {isMe ? "Bạn" : student.studentName}
                                    </p>
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        Đã làm {student.examCount} bài
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 font-black text-sm">
                                    {student.totalScore.toFixed(1)}
                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
