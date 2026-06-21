"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { liveQuizService } from "@/services/liveQuizService";
import { Users, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import LiveSettingsScreen from "@/components/teacher/live/LiveSettingsScreen";
import LiveLobbyScreen from "@/components/teacher/live/LiveLobbyScreen";
import LivePlayingScreen from "@/components/teacher/live/LivePlayingScreen";
import LiveLeaderboardScreen from "@/components/teacher/live/LiveLeaderboardScreen";
import LiveFinishedScreen from "@/components/teacher/live/LiveFinishedScreen";

// Inline components moved to LiveSharedComponents.jsx

export default function LiveQuizHostPage() {
    const { examId } = useParams();
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const [exam, setExam] = useState(null);
    const [loadingExam, setLoadingExam] = useState(true);

    // States
    const [gameState, setGameState] = useState("settings"); // settings | lobby | playing | leaderboard | finished
    const [session, setSession] = useState(null);
    const [players, setPlayers] = useState([]);

    // Setting form
    const [duration, setDuration] = useState(30);
    const [maxPoints, setMaxPoints] = useState(1000);
    const [scoringMethod, setScoringMethod] = useState("time-decay");
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [shuffleAnswers, setShuffleAnswers] = useState(false);
    const [revealAnswers, setRevealAnswers] = useState(true);

    // Playing State
    const [currentQIndex, setCurrentQIndex] = useState(-1);
    const [timer, setTimer] = useState(30);
    const [showAnswerStats, setShowAnswerStats] = useState(false);

    // Audio / Sound FX
    const [mute, setMute] = useState(true);

    const timerIntervalRef = useRef(null);

    // 1. Tải đề thi
    useEffect(() => {
        if (authLoading) return;
        if (!currentUser) {
            router.push("/login");
            return;
        }

        const fetchExam = async () => {
            try {
                const docRef = doc(db, "exams", examId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setExam(docSnap.data());
                } else {
                    toast.error("Không tìm thấy đề thi!");
                    router.push("/my-exams/live");
                }
            } catch (err) {
                console.error("Lỗi fetchExam:", err);
                toast.error("Không thể tải đề thi");
            } finally {
                setLoadingExam(false);
            }
        };

        fetchExam();
    }, [examId, currentUser, authLoading]);

    // 2. Đồng bộ thời gian thực trạng thái phiên chơi (khi đã khởi tạo lobby)
    useEffect(() => {
        if (!session?.id) return;

        const sessionRef = doc(db, "live_sessions", session.id);
        const unsubscribeSession = onSnapshot(sessionRef, (snapshot) => {
            if (snapshot.exists()) {
                const updatedSession = { id: snapshot.id, ...snapshot.data() };
                setSession(updatedSession);

                // Đồng bộ hóa câu hỏi hiện tại từ Firestore
                if (updatedSession.status === "playing" && updatedSession.currentQuestionIndex !== currentQIndex) {
                    setCurrentQIndex(updatedSession.currentQuestionIndex);
                    setShowAnswerStats(false);
                    setTimer(updatedSession.settings?.durationPerQuestion || 30);
                } else if (updatedSession.status === "finished") {
                    setGameState("finished");
                }
            }
        });

        // Lắng nghe danh sách người chơi tham gia phòng chờ
        const playersRef = collection(db, "live_sessions", session.id, "players");
        const unsubscribePlayers = onSnapshot(playersRef, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setPlayers(list.sort((a, b) => b.score - a.score));
        });

        return () => {
            unsubscribeSession();
            unsubscribePlayers();
        };
    }, [session?.id, currentQIndex]);

    // 3. Xử lý bộ đếm ngược thời gian câu hỏi
    useEffect(() => {
        if (gameState !== "playing" || currentQIndex === -1 || showAnswerStats) return;

        if (timer <= 0) {
            handleTimeUp();
            return;
        }

        // Kiểm tra xem tất cả người chơi hoạt động đã trả lời câu hỏi hiện tại chưa
        const activePlayersCount = players.length;
        const answeredCount = players.filter(p => p.lastAnsweredIndex === currentQIndex).length;

        if (activePlayersCount > 0 && answeredCount === activePlayersCount) {
            handleTimeUp();
            return;
        }

        timerIntervalRef.current = setInterval(() => {
            setTimer(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerIntervalRef.current);
    }, [timer, gameState, currentQIndex, showAnswerStats, players]);

    const handleTimeUp = () => {
        clearInterval(timerIntervalRef.current);
        setShowAnswerStats(true);
        if (revealAnswers) {
            // Hiển thị kết quả đúng sai và chuyển sang bảng xếp hạng sau đó
        }
    };

    // Khởi tạo Live Session
    const handleInitSession = async () => {
        try {
            if (!exam?.questions || exam.questions.length === 0) {
                toast.error("Đề thi này không có câu hỏi nào!");
                return;
            }

            const newSession = await liveQuizService.createSession(
                examId,
                currentUser.uid,
                exam,
                {
                    durationPerQuestion: duration,
                    maxPoints,
                    scoringMethod,
                    shuffleQuestions,
                    shuffleAnswers,
                    revealAnswers
                }
            );

            setSession(newSession);
            setGameState("lobby");
            toast.success("Khởi tạo phòng chơi thành công!");
        } catch (err) {
            console.error(err);
            toast.error("Không thể tạo phòng chơi.");
        }
    };

    // Bắt đầu chơi
    const handleStartGame = async () => {
        if (players.length === 0) {
            toast.error("Cần ít nhất 1 người chơi để bắt đầu!");
            return;
        }
        await liveQuizService.startSession(session.id);
        setGameState("playing");
    };

    // Đi tiếp (Hiện bảng xếp hạng hoặc chuyển câu tiếp theo)
    const handleNextStep = async () => {
        const questionsCount = session.questions.length;

        if (showAnswerStats) {
            // Chuyển sang bảng xếp hạng câu hiện tại
            setGameState("leaderboard");
        } else {
            // Chuyển sang câu tiếp theo
            if (currentQIndex + 1 < questionsCount) {
                await liveQuizService.nextQuestion(session.id, currentQIndex + 1);
                setGameState("playing");
            } else {
                // Hết câu hỏi -> Kết thúc game
                await liveQuizService.endSession(session.id);
                setGameState("finished");
                triggerConfetti();
            }
        }
    };

    const triggerConfetti = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    };

    if (loadingExam || authLoading) {
        return (
            <div className="flex h-[80vh] flex-col justify-center items-center gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải cấu hình Live Quiz...</p>
            </div>
        );
    }

    const currentQuestion = session?.questions[currentQIndex];
    const answeredCount = players.filter(p => p.lastAnsweredIndex === currentQIndex).length;

    // Tính thống kê lựa chọn của học sinh cho câu hỏi hiện tại
    const getAnswerDistribution = () => {
        if (!currentQuestion) return { A: 0, B: 0, C: 0, D: 0, correctOption: "" };
        const counts = { A: 0, B: 0, C: 0, D: 0 };
        players.forEach(p => {
            const ansObj = p.answers?.[currentQIndex];
            if (ansObj) {
                const answerText = ansObj.answer;
                // Ánh xạ đáp án được chọn vào index
                if (answerText === "0") counts.A++;
                else if (answerText === "1") counts.B++;
                else if (answerText === "2") counts.C++;
                else if (answerText === "3") counts.D++;
            }
        });
        return {
            ...counts,
            correctOption: currentQuestion.correctAnswer === "0" ? "A" : currentQuestion.correctAnswer === "1" ? "B" : currentQuestion.correctAnswer === "2" ? "C" : "D"
        };
    };

    const dist = getAnswerDistribution();

    return (
        <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500/30">
            {/* Main Area */}
            <main className="flex-1 flex flex-col p-6 items-center justify-center relative overflow-hidden">
                {/* Floating controls in top-right */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                    {gameState !== "settings" && gameState !== "finished" && (
                        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-slate-200">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span>{players.length} Học sinh</span>
                        </div>
                    )}
                    <button
                        onClick={() => setMute(!mute)}
                        className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 bg-slate-950/60 border border-slate-800 rounded-xl transition-colors"
                        title={mute ? "Bật âm thanh" : "Tắt âm thanh"}
                    >
                        {mute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                </div>

                {/* 1. SETUP GAME SETTINGS SCREEN */}
                {gameState === "settings" && (
                    <LiveSettingsScreen
                        duration={duration} setDuration={setDuration}
                        maxPoints={maxPoints} setMaxPoints={setMaxPoints}
                        scoringMethod={scoringMethod} setScoringMethod={setScoringMethod}
                        shuffleQuestions={shuffleQuestions} setShuffleQuestions={setShuffleQuestions}
                        shuffleAnswers={shuffleAnswers} setShuffleAnswers={setShuffleAnswers}
                        revealAnswers={revealAnswers} setRevealAnswers={setRevealAnswers}
                        router={router}
                        handleInitSession={handleInitSession}
                    />
                )}

                {/* 2. LOBBY SCREEN (WAITING FOR PLAYERS) */}
                {gameState === "lobby" && (
                    <LiveLobbyScreen 
                        session={session} 
                        players={players} 
                        router={router} 
                        handleStartGame={handleStartGame} 
                    />
                )}

                {/* 3. PLAYING SCREEN (QUESTION SCENE) */}
                {gameState === "playing" && currentQuestion && (
                    <LivePlayingScreen
                        session={session}
                        currentQuestion={currentQuestion}
                        currentQIndex={currentQIndex}
                        players={players}
                        timer={timer}
                        showAnswerStats={showAnswerStats}
                        dist={dist}
                        answeredCount={answeredCount}
                        handleTimeUp={handleTimeUp}
                        handleNextStep={handleNextStep}
                    />
                )}

                {/* 4. LEADERBOARD SCREEN */}
                {gameState === "leaderboard" && (
                    <LiveLeaderboardScreen
                        players={players}
                        handleNextQuestion={async () => {
                            const nextIdx = currentQIndex + 1;
                            const questionsCount = session.questions.length;

                            if (nextIdx < questionsCount) {
                                await liveQuizService.nextQuestion(session.id, nextIdx);
                                setGameState("playing");
                            } else {
                                await liveQuizService.endSession(session.id);
                                setGameState("finished");
                                triggerConfetti();
                            }
                        }}
                    />
                )}

                {/* 5. FINISHED PODIUM SCREEN */}
                {gameState === "finished" && (
                    <LiveFinishedScreen players={players} router={router} />
                )}
            </main>
        </div>
    );
}
