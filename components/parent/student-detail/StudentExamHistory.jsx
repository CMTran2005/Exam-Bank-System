import React from "react";
import { Target, BookOpen, Calendar } from "lucide-react";

export default function StudentExamHistory({ attempts, classes }) {
    const officialAttempts = attempts.filter(a => a.classId !== "practice");
    const practiceAttempts = attempts.filter(a => a.classId === "practice");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* BÀI THI CHÍNH THỨC */}
            <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden flex flex-col">
                <div className="bg-primary/5 p-4 border-b border-border flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h2 className="font-black text-lg text-foreground">Bài Thi (Lớp học)</h2>
                    <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {officialAttempts.length} bài
                    </span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto max-h-[400px] space-y-3">
                    {officialAttempts.length > 0 ? (
                        officialAttempts.map(attempt => {
                            const matchedClass = classes.find(c => c.id === attempt.classId);
                            const subjectName = matchedClass ? matchedClass.subject : "Khác";
                            return (
                                <div key={attempt.id} className="p-3 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-foreground truncate">{attempt.examTitle || "Bài thi không tên"}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">{subjectName}</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(attempt.startTime).toLocaleDateString("vi-VN")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-4 text-right shrink-0">
                                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{attempt.score || 0}</p>
                                        <p className="text-[10px] text-muted-foreground">Điểm</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">Chưa có dữ liệu bài thi.</div>
                    )}
                </div>
            </div>

            {/* BÀI LUYỆN TẬP */}
            <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden flex flex-col">
                <div className="bg-emerald-500/5 p-4 border-b border-border flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    <h2 className="font-black text-lg text-foreground">Bài Luyện Tập Tự Do</h2>
                    <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {practiceAttempts.length} bài
                    </span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto max-h-[400px] space-y-3">
                    {practiceAttempts.length > 0 ? (
                        practiceAttempts.map(attempt => {
                            return (
                                <div key={attempt.id} className="p-3 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-foreground truncate">{attempt.examTitle || "Bài luyện tập"}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold">Tự do</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(attempt.startTime).toLocaleDateString("vi-VN")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-4 text-right shrink-0">
                                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{attempt.score || 0}</p>
                                        <p className="text-[10px] text-muted-foreground">Điểm</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">Chưa có dữ liệu bài luyện tập.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
