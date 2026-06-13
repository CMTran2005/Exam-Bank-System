"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { liveQuizService } from "@/services/liveQuizService";
import {
    Play, Users, Timer, Trophy, ArrowRight, Home, Settings,
    Volume2, VolumeX, CheckCircle, XCircle, Award, RefreshCw, BarChart2,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import confetti from "canvas-confetti";

function Switch({ checked, onCheckedChange, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange?.(!checked)}
            className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${checked ? 'bg-purple-600' : 'bg-slate-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <span
                className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    );
}

function CustomSelect({ value, onChange, options, label }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="space-y-1.5 relative text-left" ref={containerRef}>
            <label className="text-xs font-bold text-slate-400">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold flex items-center justify-between focus:outline-none focus:border-purple-500 h-9 transition-all cursor-pointer"
            >
                <span className="truncate pr-1">{selectedOption ? selectedOption.label : "Chọn..."}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors block cursor-pointer
                                ${opt.value === value
                                    ? 'bg-purple-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }
                            `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

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
                    <div className="max-w-2xl w-full space-y-4 animate-in fade-in duration-350">
                        <div className="text-center space-y-1">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">Thiết lập trận đấu</span>
                            <h2 className="text-lg font-black text-white">Cấu hình Đấu Trường Live Quiz</h2>
                        </div>

                        <Card className="bg-slate-900 border-slate-850 p-4 rounded-2xl space-y-4 shadow-xl">
                            <div className="space-y-4">
                                {/* Grid of 3 Dropdowns */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <CustomSelect
                                        label="Thời gian mỗi câu"
                                        value={duration}
                                        onChange={setDuration}
                                        options={[
                                            { value: 15, label: "15 giây" },
                                            { value: 30, label: "30 giây" },
                                            { value: 60, label: "60 giây" },
                                            { value: 90, label: "90 giây" },
                                            { value: 120, label: "120 giây" }
                                        ]}
                                    />

                                    <CustomSelect
                                        label="Điểm tối đa mỗi câu"
                                        value={maxPoints}
                                        onChange={setMaxPoints}
                                        options={[
                                            { value: 500, label: "500 điểm" },
                                            { value: 1000, label: "1000 điểm" },
                                            { value: 2000, label: "2000 điểm" }
                                        ]}
                                    />

                                    <CustomSelect
                                        label="Cách tính điểm"
                                        value={scoringMethod}
                                        onChange={setScoringMethod}
                                        options={[
                                            { value: "time-decay", label: "Theo thời gian" },
                                            { value: "flat", label: "Điểm cố định" }
                                        ]}
                                    />
                                </div>

                                <div className="h-px bg-slate-800/60" />

                                {/* Grid of 3 Switches */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="flex items-center justify-between bg-slate-850/40 p-2.5 rounded-xl border border-slate-800/60">
                                        <div className="space-y-0.5">
                                            <h4 className="text-xs font-bold text-slate-200">Tráo đổi câu hỏi</h4>
                                            <p className="text-[9px] text-slate-400">Xáo trộn thứ tự các câu.</p>
                                        </div>
                                        <Switch checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} className="scale-80" />
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-850/40 p-2.5 rounded-xl border border-slate-800/60">
                                        <div className="space-y-0.5">
                                            <h4 className="text-xs font-bold text-slate-200">Tráo đổi đáp án</h4>
                                            <p className="text-[9px] text-slate-400">Xáo trộn các phương án.</p>
                                        </div>
                                        <Switch checked={shuffleAnswers} onCheckedChange={setShuffleAnswers} className="scale-80" />
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-850/40 p-2.5 rounded-xl border border-slate-800/60">
                                        <div className="space-y-0.5">
                                            <h4 className="text-xs font-bold text-slate-200">Hiện đáp án</h4>
                                            <p className="text-[9px] text-slate-400">Hiện giải thích sau câu.</p>
                                        </div>
                                        <Switch checked={revealAnswers} onCheckedChange={setRevealAnswers} className="scale-80" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-1">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/my-exams")}
                                    className="flex-1 border-slate-800 hover:bg-slate-900 bg-transparent text-slate-355 font-bold h-9 rounded-xl text-xs hover:text-white"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleInitSession}
                                    className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 rounded-xl text-xs"
                                >
                                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                                    Khởi tạo phòng đấu
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* 2. LOBBY SCREEN (WAITING FOR PLAYERS) */}
                {gameState === "lobby" && (
                    <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in duration-300">
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest animate-pulse">Đang mở phòng thi đấu</p>
                            <h2 className="text-lg font-medium text-slate-300">Truy cập Cổng học sinh và nhập mã PIN để tham gia:</h2>

                            <div className="flex justify-center items-center gap-4 py-4">
                                <div className="bg-slate-900 border border-slate-850 px-8 py-5 rounded-3xl shadow-2xl">
                                    <span className="text-6xl font-black text-white tracking-widest font-mono select-all">
                                        {session?.pinCode}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Players count */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-400 flex items-center justify-center gap-2">
                                <Users className="w-4 h-4 text-emerald-400" />
                                Học sinh đã tham gia ({players.length})
                            </h3>

                            {players.length === 0 ? (
                                <div className="bg-slate-900/40 border border-dashed border-slate-800 py-16 rounded-2xl max-w-md mx-auto space-y-2">
                                    <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-transparent animate-spin mx-auto" />
                                    <p className="text-xs text-slate-500 font-medium animate-pulse">Đang đợi những chú rồng chiến đấu đầu tiên...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-3xl mx-auto max-h-[300px] overflow-y-auto p-2">
                                    {players.map((p) => (
                                        <div
                                            key={p.uid}
                                            className="bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm animate-in scale-in duration-200 flex items-center gap-1.5 justify-center"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="truncate">{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-6 flex justify-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/my-exams")}
                                className="border-slate-800 hover:bg-slate-900 bg-transparent text-slate-300 font-bold h-12 px-6 rounded-xl text-xs hover:text-white"
                            >
                                Hủy phòng
                            </Button>
                            <Button
                                onClick={handleStartGame}
                                disabled={players.length === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 rounded-xl text-xs disabled:opacity-50"
                            >
                                Bắt đầu trận đấu <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* 3. PLAYING SCREEN (QUESTION SCENE) */}
                {gameState === "playing" && currentQuestion && (
                    <div className="max-w-4xl w-full space-y-6 animate-in fade-in duration-300">
                        {/* Status bar */}
                        <div className="flex justify-between items-center bg-slate-900/50 border border-slate-850 px-4 py-2.5 rounded-xl text-xs font-bold">
                            <span className="text-purple-400 uppercase tracking-wider">
                                Câu hỏi {currentQIndex + 1} / {session.questions.length}
                            </span>
                            <span className="text-slate-400">
                                Mức độ: <span className="capitalize text-slate-200">{currentQuestion.difficulty?.replace("_", " ") || "Nhận biết"}</span>
                            </span>
                        </div>

                        {/* Question Text */}
                        <Card className="bg-slate-900 border-slate-800 p-8 rounded-2xl text-center space-y-4 shadow-xl">
                            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                                {currentQuestion.questionText}
                            </h3>
                        </Card>

                        {/* Middle Controls (Timer & Answer counters) */}
                        <div className="grid grid-cols-3 items-center">
                            {/* Answer Progress */}
                            <div className="text-left">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Đã trả lời</span>
                                <span className="text-2xl font-black text-white">{answeredCount}</span>
                                <span className="text-xs font-bold text-slate-400"> / {players.length}</span>
                            </div>

                            {/* Circular Timer */}
                            <div className="flex justify-center">
                                <div className="relative w-24 h-24 flex items-center justify-center bg-slate-900 rounded-full border border-slate-800 shadow-lg">
                                    <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                                    {/* SVG Ring for Countdown animation */}
                                    <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="46"
                                            fill="transparent"
                                            stroke="rgb(147, 51, 234)"
                                            strokeWidth="4"
                                            strokeDasharray="289"
                                            strokeDashoffset={289 - (timer / (session.settings?.durationPerQuestion || 30)) * 289}
                                            style={{ transition: "stroke-dashoffset 1s linear" }}
                                        />
                                    </svg>
                                    <span className="text-3xl font-black text-white font-mono">{timer}</span>
                                </div>
                            </div>

                            {/* Skip / Next Step Button */}
                            <div className="text-right">
                                <Button
                                    onClick={handleTimeUp}
                                    disabled={showAnswerStats}
                                    variant="outline"
                                    className="border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
                                >
                                    Bỏ qua / Hết giờ
                                </Button>
                            </div>
                        </div>

                        {/* 4 Answers Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.isArray(currentQuestion.options) ? (
                                currentQuestion.options.map((opt, idx) => {
                                    const optionLetter = idx === 0 ? "A" : idx === 1 ? "B" : idx === 2 ? "C" : "D";
                                    const isCorrect = idx.toString() === currentQuestion.correctAnswer;

                                    let btnColor = "bg-slate-900 border-slate-800 text-slate-200";
                                    if (showAnswerStats) {
                                        if (isCorrect) btnColor = "bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/20";
                                        else btnColor = "bg-rose-950/20 border-rose-950 text-slate-500 opacity-60";
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border text-sm font-bold transition-all relative ${btnColor}`}
                                        >
                                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-black ${idx === 0 ? "bg-red-600" : idx === 1 ? "bg-blue-600" : idx === 2 ? "bg-amber-600" : "bg-emerald-600"
                                                }`}>
                                                {optionLetter}
                                            </span>
                                            <span className="flex-1 leading-snug">{opt}</span>

                                            {showAnswerStats && isCorrect && (
                                                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 ml-auto" />
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-slate-500">Không có các tùy chọn đáp án.</p>
                            )}
                        </div>

                        {/* Answer Statistics Chart */}
                        {showAnswerStats && (
                            <Card className="bg-slate-900 border-slate-800 p-6 rounded-2xl animate-in slide-in-from-bottom-5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-purple-400" />
                                    Phân phối đáp án của cả lớp
                                </h4>
                                <div className="grid grid-cols-4 gap-4 items-end h-[120px] pt-4">
                                    {["A", "B", "C", "D"].map((letter) => {
                                        const count = dist[letter];
                                        const total = players.length || 1;
                                        const pct = (count / total) * 100;
                                        const isCorrect = dist.correctOption === letter;

                                        return (
                                            <div key={letter} className="flex flex-col items-center gap-2 h-full justify-end">
                                                <span className="text-xs font-bold text-white">{count}</span>
                                                <div
                                                    className={`w-full rounded-t-lg transition-all duration-500 ${isCorrect ? "bg-emerald-500" : "bg-slate-700"
                                                        }`}
                                                    style={{ height: `${Math.max(10, pct)}%` }}
                                                />
                                                <span className="text-xs font-bold text-slate-400">{letter}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-end pt-6">
                                    <Button
                                        onClick={handleNextStep}
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 px-6 rounded-xl"
                                    >
                                        Tiếp tục <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* 4. LEADERBOARD SCREEN */}
                {gameState === "leaderboard" && (
                    <div className="max-w-xl w-full space-y-6 animate-in fade-in duration-300">
                        <div className="text-center space-y-2">
                            <span className="text-xs font-bold tracking-widest uppercase text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full">Bảng Xếp Hạng</span>
                            <h2 className="text-2xl font-black text-white">Điểm Số Hiện Tại</h2>
                        </div>

                        <Card className="bg-slate-900 border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                            <div className="divide-y divide-slate-800">
                                {players.slice(0, 5).map((player, idx) => (
                                    <div
                                        key={player.uid}
                                        className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white ${idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-amber-600" : "bg-slate-800"
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{player.name}</p>
                                            {player.streak > 1 && (
                                                <p className="text-[10px] font-bold text-amber-500 animate-pulse flex items-center gap-1">
                                                    🔥 Chuỗi {player.streak} câu đúng!
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-white">{player.score}</p>
                                            <p className="text-[10px] text-slate-500">điểm</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <div className="flex justify-center">
                            <Button
                                onClick={async () => {
                                    // Chuyển sang câu hỏi kế tiếp
                                    const nextIdx = currentQIndex + 1;
                                    const questionsCount = session.questions.length;

                                    if (nextIdx < questionsCount) {
                                        await liveQuizService.nextQuestion(session.id, nextIdx);
                                        setGameState("playing");
                                    } else {
                                        // Hết câu hỏi -> Kết thúc game
                                        await liveQuizService.endSession(session.id);
                                        setGameState("finished");
                                        triggerConfetti();
                                    }
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 px-8 rounded-xl text-sm"
                            >
                                Câu Hỏi Kế Tiếp <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* 5. FINISHED PODIUM SCREEN */}
                {gameState === "finished" && (
                    <div className="max-w-xl w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="space-y-2">
                            <Trophy className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
                            <h2 className="text-3xl font-black text-white tracking-tight">KẾT THÚC TRẬN ĐẤU</h2>
                            <p className="text-xs text-slate-400">Trận đấu đã khép lại. Chúc mừng tất cả các chiến binh!</p>
                        </div>

                        {/* Podium Top 3 */}
                        <div className="flex items-end justify-center gap-4 py-8 h-[240px]">
                            {/* 2nd Place */}
                            {players[1] && (
                                <div className="flex flex-col items-center w-24">
                                    <span className="text-xs font-bold text-slate-300 truncate w-full">{players[1].name}</span>
                                    <span className="text-[10px] text-slate-500 mb-2">{players[1].score} pts</span>
                                    <div className="bg-slate-700 w-full h-[80px] rounded-t-2xl flex items-center justify-center border-t border-slate-500 shadow-md">
                                        <Award className="w-8 h-8 text-slate-300" />
                                    </div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {players[0] && (
                                <div className="flex flex-col items-center w-28">
                                    <span className="text-sm font-black text-yellow-400 truncate w-full">{players[0].name}</span>
                                    <span className="text-[10px] text-slate-400 mb-2">{players[0].score} pts</span>
                                    <div className="bg-yellow-600 w-full h-[120px] rounded-t-2xl flex items-center justify-center border-t border-yellow-400 shadow-2xl relative">
                                        <Trophy className="w-10 h-10 text-yellow-200" />
                                        <span className="absolute -top-6 text-2xl">👑</span>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {players[2] && (
                                <div className="flex flex-col items-center w-24">
                                    <span className="text-xs font-bold text-amber-500 truncate w-full">{players[2].name}</span>
                                    <span className="text-[10px] text-slate-500 mb-2">{players[2].score} pts</span>
                                    <div className="bg-amber-800 w-full h-[60px] rounded-t-2xl flex items-center justify-center border-t border-amber-600 shadow-md">
                                        <Award className="w-8 h-8 text-amber-600" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4">
                            <Button
                                onClick={() => router.push("/my-exams")}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold h-11 px-6 rounded-xl"
                            >
                                Trở về Danh sách Đề
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
