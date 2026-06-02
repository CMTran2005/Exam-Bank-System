import { Award, HelpCircle, TrendingUp, BarChart3, PieChart, Calendar, ArrowUpRight } from "lucide-react";

/**
 * Component OverviewCards
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  subjectCount - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function OverviewCards({ subjectCount, subjectsListStr, totalQuestions, growthPercent, ocrRate, avgLatency }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Độ phủ môn học</span>
                    <Award className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1">
                    <p className="text-3xl font-black text-foreground tracking-tight">{subjectCount} Môn học</p>
                    <p className="text-xs text-muted-foreground truncate" title={subjectsListStr}>{subjectsListStr}</p>
                </div>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng số câu hỏi</span>
                    <HelpCircle className="w-4 h-4 text-violet-500" />
                </div>
                <div className="space-y-1">
                    <p className="text-3xl font-black text-foreground tracking-tight">{totalQuestions.toLocaleString()}</p>
                    <p className={`text-xs flex items-center font-semibold ${growthPercent > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                        <TrendingUp className="w-3.5 h-3.5 mr-1" /> {growthPercent >= 0 ? "+" : ""}{growthPercent}% tăng trưởng tháng này
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tỷ lệ chính xác OCR</span>
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-1">
                    <p className="text-3xl font-black text-foreground tracking-tight">{ocrRate}%</p>
                    <p className="text-xs text-muted-foreground">Phản hồi trung bình &lt; {avgLatency} giây</p>
                </div>
            </div>
        </div>
    );
}

/**
 * Component SubjectCoverageCard
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  subjectStats  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function SubjectCoverageCard({ subjectStats }) {
    return (
        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-base font-bold text-foreground">Độ phủ ngân hàng Môn học</h2>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Cập nhật thời gian thực
                </span>
            </div>
            {subjectStats.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Chưa có môn học nào được tạo.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {subjectStats.map((sub) => (
                        <div key={sub.name} className="p-4 rounded-xl border border-border/80 bg-background/50 hover:bg-background/80 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-3 group">
                            <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors truncate">{sub.name}</span>
                            <div className="space-y-1">
                                <p className="text-2xl font-black text-foreground tracking-tight">{sub.count} câu</p>
                                <p className="text-[10px] text-muted-foreground">Chiếm {sub.pct}% tổng số đề</p>
                            </div>
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${sub.pct}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Component DifficultyChartCard
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  totalQuestions - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function DifficultyChartCard({ totalQuestions, difficultyStats, donutSegments }) {
    return (
        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                <PieChart className="w-4 h-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Phân bổ theo Mức độ nhận thức</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {totalQuestions === 0 && (
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" className="text-muted-foreground/20" strokeWidth="10" />
                        )}
                        {donutSegments.map((seg) => {
                            if (seg.percent === 0) return null;
                            if (seg.percent === 100) {
                                return <circle key={seg.name} cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" className={seg.color.replace("bg-", "text-")} strokeWidth="10" style={{ transition: "all 0.5s ease" }} />;
                            }
                            return (
                                <circle key={seg.name} cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" className={seg.color.replace("bg-", "text-")} strokeWidth="10" strokeDasharray={seg.dashArray} style={{ transform: `rotate(${seg.startAngle}deg)`, transformOrigin: "50px 50px", transition: "all 0.5s ease" }} />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-foreground">{totalQuestions}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">câu hỏi</span>
                    </div>
                </div>

                <div className="space-y-2 flex-1 w-full">
                    {difficultyStats.map((item) => (
                        <div key={item.name} className="flex flex-col space-y-0.5">
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                                    {item.name}
                                </span>
                                <span className="font-extrabold text-foreground">{item.count} câu ({item.percentage}%)</span>
                            </div>
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Component QuestionTypeCard
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  typeStats  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function QuestionTypeCard({ typeStats }) {
    return (
        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                <BarChart3 className="w-4 h-4 text-violet-500" />
                <h2 className="text-base font-bold text-foreground">Phân bổ Dạng câu hỏi</h2>
            </div>

            <div className="space-y-3.5">
                {typeStats.map((item) => (
                    <div key={item.type} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-muted-foreground">{item.type}</span>
                            <span className="text-foreground">{item.count} câu ({item.pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.pct}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Component GrowthChartCard
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any}  monthlyGrowth - Tham số đầu vào
 * @returns {JSX.Element}
 */
export function GrowthChartCard({ monthlyGrowth, totalQuestions }) {
    return (
        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 sm:p-6 space-y-6 lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-foreground">Tăng trưởng Ngân hàng Câu hỏi</h2>
            </div>

            <div className="relative h-56 w-full mt-4">
                <div className="absolute top-4 bottom-8 left-0 right-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-border/30 w-full" />
                    <div className="border-b border-border/30 w-full" />
                    <div className="border-b border-border/30 w-full" />
                    <div className="border-b border-border/60 w-full" />
                </div>

                <div className="absolute inset-0 flex justify-between px-2 sm:px-6">
                    {monthlyGrowth.map((g) => {
                        const maxCount = Math.max(...monthlyGrowth.map(item => item.count)) || 1;
                        const pctHeight = (g.count / maxCount) * 100;
                        return (
                            <div key={g.month} className="flex flex-col items-center h-full flex-1 group mx-1">
                                <div className="w-full relative mt-4 flex-1">
                                    <div
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 sm:w-8 bg-gradient-to-t from-primary/70 to-primary rounded-t-md transition-all duration-500 group-hover:from-violet-500 group-hover:to-violet-600 shadow-sm"
                                        style={{ height: `${pctHeight}%`, minHeight: "4px" }}
                                    >
                                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded transition-all duration-300 transform group-hover:scale-125 opacity-80 group-hover:opacity-100 sm:opacity-100">
                                            {g.count}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-8 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-muted-foreground">{g.month}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                <span className="flex items-center font-medium">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                    Đạt cột mốc {totalQuestions.toLocaleString()} câu hỏi tích lũy
                </span>
                <span className="font-semibold text-emerald-500">Đã đồng bộ</span>
            </div>
        </div>
    );
}
