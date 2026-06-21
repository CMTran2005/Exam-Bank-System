import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { CustomSelect, Switch } from "./LiveSharedComponents";

export default function LiveSettingsScreen({
    duration, setDuration,
    maxPoints, setMaxPoints,
    scoringMethod, setScoringMethod,
    shuffleQuestions, setShuffleQuestions,
    shuffleAnswers, setShuffleAnswers,
    revealAnswers, setRevealAnswers,
    router,
    handleInitSession
}) {
    return (
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
    );
}
