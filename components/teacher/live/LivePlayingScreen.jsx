import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, BarChart2 } from "lucide-react";

export default function LivePlayingScreen({
    session, currentQuestion, currentQIndex, players, timer, showAnswerStats, dist, answeredCount, handleTimeUp, handleNextStep
}) {
    if (!currentQuestion) return null;

    return (
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
    );
}
