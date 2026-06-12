"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { liveQuizService } from "@/services/liveQuizService";
import { 
    Gamepad2, Users, Timer, CheckCircle, XCircle, Award, Trophy, Loader2, ArrowRight, Home
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function StudentLivePlayroom() {
    const { sessionId } = useParams();
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const [session, setSession] = useState(null);
    const [players, setPlayers] = useState([]);
    const [myPlayerState, setMyPlayerState] = useState(null);
    const [loading, setLoading] = useState(true);

    // Gameplay States
    const [selectedAnswer, setSelectedAnswer] = useState(null); // null or option index string
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [pointsEarned, setPointsEarned] = useState(null);
    const [questionStartTime, setQuestionStartTime] = useState(null);

    // 1. Đồng bộ thời gian thực phiên chơi
    useEffect(() => {
        if (authLoading) return;
        if (!currentUser) {
            router.push("/login");
            return;
        }

        const sessionRef = doc(db, "live_sessions", sessionId);
        const unsubscribeSession = onSnapshot(sessionRef, (snapshot) => {
            if (snapshot.exists()) {
                const sessionData = { id: snapshot.id, ...snapshot.data() };
                setSession(sessionData);
                setLoading(false);
            } else {
                toast.error("Không tìm thấy phòng chơi này hoặc phòng đã bị xóa.");
                router.push("/student/live");
            }
        }, (err) => {
            console.error("Lỗi onSnapshot session:", err);
            setLoading(false);
        });

        // Lắng nghe thông tin người chơi hiện tại
        const playerRef = doc(db, "live_sessions", sessionId, "players", currentUser.uid);
        const unsubscribePlayer = onSnapshot(playerRef, (snapshot) => {
            if (snapshot.exists()) {
                setMyPlayerState(snapshot.data());
            }
        });

        // Lắng nghe tất cả người chơi để hiển thị trong lobby
        const playersRef = collection(db, "live_sessions", sessionId, "players");
        const unsubscribePlayers = onSnapshot(playersRef, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setPlayers(list);
        });

        return () => {
            unsubscribeSession();
            unsubscribePlayer();
            unsubscribePlayers();
        };
    }, [sessionId, currentUser, authLoading]);

    // 2. Reset trạng thái khi chuyển câu hỏi mới
    useEffect(() => {
        if (!session || session.status !== "playing") return;
        
        setSelectedAnswer(null);
        setHasSubmitted(false);
        setPointsEarned(null);
        setQuestionStartTime(Date.now()); // Lưu mốc thời gian bắt đầu câu hỏi tại client
    }, [session?.currentQuestionIndex, session?.status]);

    const handleSelectOption = async (optionIdx) => {
        if (hasSubmitted || !session) return;
        
        setSelectedAnswer(optionIdx);
        setHasSubmitted(true);

        const currentQIndex = session.currentQuestionIndex;
        const currentQuestion = session.questions[currentQIndex];
        const isCorrect = optionIdx.toString() === currentQuestion.correctAnswer;
        
        // Tính thời gian làm bài từ lúc câu hỏi xuất hiện
        const timeLimit = session.settings?.durationPerQuestion || 30;
        const timeTaken = Math.min(timeLimit, (Date.now() - questionStartTime) / 1000);

        try {
            const points = await liveQuizService.submitAnswer(
                session.id,
                currentUser.uid,
                currentQIndex,
                optionIdx.toString(),
                isCorrect,
                timeTaken,
                session.settings
            );

            setPointsEarned(points);
            
            if (isCorrect) {
                toast.success(`Chính xác! +${points} điểm`);
                // Bắn pháo hoa nhẹ cho học sinh trả lời đúng
                confetti({
                    particleCount: 20,
                    spread: 60,
                    origin: { y: 0.8 }
                });
            } else {
                toast.error("Rất tiếc, câu trả lời chưa đúng!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Không thể nộp đáp án.");
            setHasSubmitted(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[80vh] flex-col justify-center items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Đang kết nối tới phòng thi đấu...</p>
            </div>
        );
    }

    const currentQIndex = session?.currentQuestionIndex;
    const currentQuestion = session?.questions[currentQIndex];
    const myRank = [...players].sort((a, b) => b.score - a.score).findIndex(p => p.uid === currentUser.uid) + 1;

    return (
        <div className="max-w-md mx-auto space-y-4 py-4 px-3 animate-in fade-in duration-300">
            
            {/* LOBBY STATE (WAITING ROOM) */}
            {session.status === "waiting" && (
                <div className="text-center space-y-6 py-6">
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary animate-bounce">
                            <Gamepad2 className="w-6 h-6" />
                        </div>
                        <h1 className="text-lg font-black text-foreground">Bạn đã vào phòng chờ!</h1>
                        <p className="text-xs text-muted-foreground font-semibold line-clamp-2 leading-relaxed">
                            Đề thi: {session.examTitle}
                        </p>
                    </div>

                    <Card className="p-4 bg-card/60 border-border/80 shadow-md rounded-2xl space-y-3">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1">
                            <Users className="w-3.5 h-3.5 text-primary" />
                            Đồng đội cùng chơi ({players.length})
                        </h3>

                        <div className="flex flex-wrap gap-1.5 justify-center max-h-[140px] overflow-y-auto p-1">
                            {players.map((p) => (
                                <span 
                                    key={p.uid}
                                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors ${
                                        p.uid === currentUser.uid 
                                            ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                                            : "bg-muted/70 border-border text-foreground"
                                    }`}
                                >
                                    {p.name} {p.uid === currentUser.uid && "(Bạn)"}
                                </span>
                            ))}
                        </div>
                    </Card>

                    <div className="space-y-1">
                        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-1" />
                        <p className="text-[10px] text-muted-foreground font-medium animate-pulse">
                            Đang đợi giáo viên bắt đầu trận đấu...
                        </p>
                    </div>
                </div>
            )}

            {/* PLAYING STATE */}
            {session.status === "playing" && currentQuestion && (
                <div className="space-y-4">
                    {/* Top status bar */}
                    <div className="flex justify-between items-center bg-card border border-border px-3 py-2 rounded-xl text-[10px] font-bold shadow-sm">
                        <span className="text-primary uppercase tracking-wider">
                            Câu {currentQIndex + 1} / {session.questions.length}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-lg">
                            Hạng #{myRank} • {myPlayerState?.score || 0} Điểm
                        </span>
                    </div>

                    {/* Question Content */}
                    <Card className="p-4 border-border shadow-sm rounded-xl space-y-2">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Câu hỏi:</h3>
                        <p className="text-sm font-bold text-foreground leading-relaxed">
                            {currentQuestion.questionText}
                        </p>
                    </Card>

                    {/* Options / Action State */}
                    {!hasSubmitted ? (
                        <div className="space-y-2">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                                Chọn một câu trả lời chính xác:
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                {Array.isArray(currentQuestion.options) && currentQuestion.options.map((opt, idx) => {
                                    const letter = idx === 0 ? "A" : idx === 1 ? "B" : idx === 2 ? "C" : "D";
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectOption(idx)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/40 text-left transition-all active:scale-[0.99] group shadow-sm"
                                        >
                                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white font-black text-[11px] group-hover:scale-105 transition-transform ${
                                                idx === 0 ? "bg-red-500" : idx === 1 ? "bg-blue-500" : idx === 2 ? "bg-amber-500" : "bg-emerald-500"
                                            }`}>
                                                {letter}
                                            </span>
                                            <span className="text-xs font-bold text-foreground leading-snug truncate">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        // SUBMITTED STATE / WAITING FOR REVEAL
                        <div className="text-center py-6 space-y-3">
                            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                            <h3 className="text-sm font-black text-foreground">Đã ghi nhận câu trả lời!</h3>
                            
                            {selectedAnswer !== null && (
                                <div className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-xl border border-border text-[10px] font-bold">
                                    Bạn chọn: 
                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-white font-black text-[9px] ${
                                        selectedAnswer === 0 ? "bg-red-500" : selectedAnswer === 1 ? "bg-blue-500" : selectedAnswer === 2 ? "bg-amber-500" : "bg-emerald-500"
                                    }`}>
                                        {selectedAnswer === 0 ? "A" : selectedAnswer === 1 ? "B" : selectedAnswer === 2 ? "C" : "D"}
                                    </span>
                                </div>
                            )}

                            <p className="text-[10px] text-muted-foreground animate-pulse font-medium pt-1">
                                Đang chờ giáo viên công bố đáp án và xếp hạng...
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* FINISHED STATE */}
            {session.status === "finished" && (
                <div className="text-center space-y-6 py-6 animate-in zoom-in-95 duration-300">
                    <div className="space-y-2">
                        <Trophy className="w-12 h-12 text-yellow-500 mx-auto animate-bounce" />
                        <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Hoàn Thành!</h1>
                        <p className="text-xs text-muted-foreground font-semibold">
                            Cảm ơn bạn đã tham gia trận đấu.
                        </p>
                    </div>

                    <Card className="p-5 border-border shadow-lg bg-card/60 rounded-2xl max-w-xs mx-auto space-y-4">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">Thứ hạng chung cuộc</span>
                            <span className="text-4xl font-black text-primary block">#{myRank}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">Tổng điểm</span>
                                <span className="text-base font-bold text-foreground">{myPlayerState?.score || 0}</span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">Streak lớn nhất</span>
                                <span className="text-base font-bold text-foreground">🔥 {myPlayerState?.streak || 0}</span>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-center">
                        <Button
                            onClick={() => router.push("/student")}
                            className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-10 px-6 rounded-xl shadow-md text-xs"
                        >
                            Trở về Lớp thi
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
