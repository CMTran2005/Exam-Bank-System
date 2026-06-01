import React from "react";
import { Clock, UserCheck } from "lucide-react";

export default function TeacherRecentActivities({ activities }) {
    return (
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-5 bg-violet-600 rounded-full" />
                Hoạt Động Gần Đây
            </h2>
            <div className="bg-card border border-border shadow-sm rounded-2xl p-5 divide-y divide-border/60">
                {activities.length > 0 ? (
                    activities.map((act, index) => (
                        <div key={index} className={`flex items-start justify-between gap-4 py-3.5 ${index === 0 ? "pt-0" : ""} ${index === activities.length - 1 ? "pb-0" : ""}`}>
                            <div className="flex gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">{act.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center">
                                        <UserCheck className="w-3.5 h-3.5 mr-1 text-primary shrink-0" />
                                        {act.user}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-accent text-accent-foreground">
                                    {act.type}
                                </span>
                                <p className="text-[10px] text-muted-foreground mt-1">{act.date}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-8 text-center space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground">Chưa có hoạt động biên soạn đề thi nào gần đây.</p>
                        <p className="text-[10px] text-muted-foreground">Hãy bắt đầu tạo đề thi mới hoặc nhập câu hỏi để hiển thị hoạt động!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
