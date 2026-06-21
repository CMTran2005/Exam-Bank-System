import React from "react";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";

export default function LiveLobbyScreen({ session, players, router, handleStartGame }) {
    return (
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
    );
}
