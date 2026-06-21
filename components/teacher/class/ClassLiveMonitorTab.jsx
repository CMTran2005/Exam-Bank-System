import React from "react";
import { Users, Clock, MonitorPlay, AlertTriangle, CheckCircle2, Filter, WifiOff, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClassLiveMonitorTab({ classDetails, liveAttempts, liveLoading, liveFilterStatus, setLiveFilterStatus }) {
    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-lg text-rose-500 flex items-center gap-2">
                    <Activity className="w-5 h-5" /> Trạm giám sát thời gian thực
                </h3>
            </div>

            {(() => {
                if (liveLoading) {
                    return (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Activity className="w-8 h-8 animate-pulse text-primary mb-2" />
                            <p className="text-sm font-medium">Đang kết nối trạm giám sát...</p>
                        </div>
                    );
                }

                // Lấy danh sách toàn bộ học sinh trong lớp
                let mergedLiveStudents = [];
                const liveStudentIds = new Set();
                
                if (classDetails?.students) {
                    classDetails.students.forEach(s => {
                        mergedLiveStudents.push({ 
                            studentId: s.id, 
                            studentName: s.name, 
                            isNotStarted: true // Mặc định là chưa thi
                        });
                        liveStudentIds.add(s.id);
                    });
                }

                // Cập nhật/Thêm từ liveAttempts
                liveAttempts.forEach(attempt => {
                    if (liveStudentIds.has(attempt.studentId)) {
                        // Cập nhật thông tin attempt cho học sinh đã có trong danh sách
                        const studentIndex = mergedLiveStudents.findIndex(s => s.studentId === attempt.studentId);
                        if (studentIndex !== -1) {
                            mergedLiveStudents[studentIndex] = { ...attempt, isNotStarted: false };
                        }
                    } else {
                        // Học sinh này có attempt nhưng không có trong danh sách lớp (có thể do lỗi dữ liệu hoặc thi tự do)
                        mergedLiveStudents.push({ ...attempt, isNotStarted: false });
                        liveStudentIds.add(attempt.studentId);
                    }
                });

                // Calculate Stats
                let total = mergedLiveStudents.length;
                let completed = 0;
                let online = 0;
                let warning = 0;
                let notStarted = 0;

                mergedLiveStudents.forEach(attempt => {
                    if (attempt.isNotStarted) notStarted++;
                    else if (attempt.status === "completed") completed++;
                    else if (attempt.isOnline) online++;
                    
                    if ((attempt.tabSwitchCount || 0) > 0) warning++;
                });

                const filteredAttempts = mergedLiveStudents.filter(attempt => {
                    let matchesFilter = true;
                    if (liveFilterStatus === "completed") matchesFilter = attempt.status === "completed" && !attempt.isNotStarted;
                    if (liveFilterStatus === "online") matchesFilter = attempt.status !== "completed" && attempt.isOnline && !attempt.isNotStarted;
                    if (liveFilterStatus === "offline") matchesFilter = attempt.status !== "completed" && !attempt.isOnline && !attempt.isNotStarted;
                    if (liveFilterStatus === "warning") matchesFilter = (attempt.tabSwitchCount || 0) > 0 && !attempt.isNotStarted;
                    if (liveFilterStatus === "not_started") matchesFilter = attempt.isNotStarted;

                    return matchesFilter;
                }).sort((a, b) => {
                    if (a.status === "completed" && b.status !== "completed") return 1;
                    if (a.status !== "completed" && b.status === "completed") return -1;
                    return 0;
                });

                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Tổng tham gia</span>
                                </div>
                                <div className="text-2xl font-black text-foreground">{total}</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Chưa thi</span>
                                </div>
                                <div className="text-2xl font-black text-slate-700 dark:text-slate-300">{notStarted}</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <MonitorPlay className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Đang làm bài</span>
                                </div>
                                <div className="text-2xl font-black text-blue-700 dark:text-blue-300">{online}</div>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Gian lận</span>
                                </div>
                                <div className="text-2xl font-black text-rose-700 dark:text-rose-300">{warning}</div>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Đã nộp bài</span>
                                </div>
                                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{completed}</div>
                            </div>
                        </div>

                        <div className="flex gap-2 bg-muted/40 p-2 rounded-xl border border-border w-full sm:w-fit overflow-x-auto hide-scrollbar">
                            <Button variant={liveFilterStatus === "all" ? "default" : "outline"} size="sm" onClick={() => setLiveFilterStatus("all")} className="rounded-lg h-9">Tất cả</Button>
                            <Button variant={liveFilterStatus === "not_started" ? "default" : "outline"} size="sm" onClick={() => setLiveFilterStatus("not_started")} className="rounded-lg h-9">Chưa thi</Button>
                            <Button variant={liveFilterStatus === "online" ? "default" : "outline"} size="sm" onClick={() => setLiveFilterStatus("online")} className="rounded-lg h-9">Đang thi</Button>
                            <Button variant={liveFilterStatus === "offline" ? "default" : "outline"} size="sm" onClick={() => setLiveFilterStatus("offline")} className="rounded-lg h-9">Mất kết nối</Button>
                            <Button variant={liveFilterStatus === "completed" ? "default" : "outline"} size="sm" onClick={() => setLiveFilterStatus("completed")} className="rounded-lg h-9">Đã nộp</Button>
                            <Button variant={liveFilterStatus === "warning" ? "default" : "outline"} size="sm" onClick={() => setLiveFilterStatus("warning")} className="rounded-lg h-9">Cảnh báo</Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredAttempts.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-muted-foreground flex flex-col items-center">
                                    <Filter className="w-8 h-8 mb-3 opacity-20" />
                                    <p>Không tìm thấy học sinh nào phù hợp.</p>
                                </div>
                            ) : (
                                filteredAttempts.map(attempt => {
                                    const isNotStarted = attempt.isNotStarted;
                                    const isCompleted = attempt.status === "completed";
                                    const isOnline = !isCompleted && attempt.isOnline;
                                    const isOffline = !isCompleted && !attempt.isOnline;
                                    const hasWarning = (attempt.tabSwitchCount || 0) > 0;
                                    
                                    let cardClass = "border-border bg-card";
                                    let statusText = "Chưa rõ";
                                    let statusColor = "text-muted-foreground";

                                    if (isNotStarted) {
                                        cardClass = "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 opacity-70";
                                        statusText = "Chưa vào thi";
                                        statusColor = "text-slate-500 dark:text-slate-400";
                                    } else if (isCompleted) {
                                        cardClass = "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10";
                                        statusText = `Đã nộp bài - Điểm: ${attempt.score?.toFixed(2) || 0}`;
                                        statusColor = "text-emerald-600 dark:text-emerald-400";
                                    } else if (isOffline) {
                                        cardClass = "border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/10";
                                        statusText = "Mất kết nối / Rời trang";
                                        statusColor = "text-amber-600 dark:text-amber-400";
                                    } else if (hasWarning) {
                                        cardClass = "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-400/50";
                                        statusText = "Cảnh báo gian lận!";
                                        statusColor = "text-rose-600 dark:text-rose-400 font-bold";
                                    } else if (isOnline) {
                                        cardClass = "border-blue-200 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/10";
                                        statusText = "Đang làm bài...";
                                        statusColor = "text-blue-600 dark:text-blue-400";
                                    }

                                    return (
                                        <div key={attempt.id || attempt.studentId} className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 ${cardClass}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="font-bold text-foreground truncate pr-2">
                                                    {attempt.studentName || "Học sinh ẩn danh"}
                                                </div>
                                                {!isNotStarted && !isCompleted && isOnline && !hasWarning && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse mt-1 shrink-0" />
                                                )}
                                                {!isNotStarted && !isCompleted && isOffline && (
                                                    <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
                                                )}
                                                {isCompleted && (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                )}
                                                {!isNotStarted && !isCompleted && hasWarning && (
                                                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
                                                )}
                                                {isNotStarted && (
                                                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                            </div>
                                            <div className={`text-xs ${statusColor}`}>{statusText}</div>
                                            {!isNotStarted && !isCompleted && (
                                                <div className="space-y-1.5 mt-auto">
                                                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                                        <span>Tiến độ</span>
                                                        <span>{attempt.progress || 0}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${hasWarning ? 'bg-rose-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${attempt.progress || 0}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-2">
                                                        Vị trí: Câu {attempt.currentQuestionIndex !== undefined ? attempt.currentQuestionIndex + 1 : "?"}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
