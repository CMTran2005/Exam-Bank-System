import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LiveLeaderboardScreen({ players, handleNextQuestion }) {
    return (
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
                    onClick={handleNextQuestion}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 px-8 rounded-xl text-sm"
                >
                    Câu Hỏi Kế Tiếp <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
