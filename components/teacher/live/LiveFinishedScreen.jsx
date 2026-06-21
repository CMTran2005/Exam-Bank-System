import React from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Award } from "lucide-react";

export default function LiveFinishedScreen({ players, router }) {
    return (
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
    );
}
