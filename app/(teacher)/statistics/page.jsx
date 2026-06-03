"use client";

import { TrendingUp } from "lucide-react";

import { useStatistics } from "@/hooks/teacher/useStatistics";
import { 
    OverviewCards, 
    SubjectCoverageCard, 
    DifficultyChartCard, 
    QuestionTypeCard, 
    GrowthChartCard 
} from "./_components/ChartCards";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Component StatisticsPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function StatisticsPage() {
    const {
        currentUser, loading,
        totalQuestions, totalExams, subjectCount, subjectsListStr,
        growthPercent, ocrRate, avgLatency, isLive,
        difficultyStats, typeStats, subjectStats, monthlyGrowth, donutSegments
    } = useStatistics();

    const isPageLoading = loading || !currentUser;

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-primary rounded-full" />
                        Báo Cáo & Thống Kê
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">Phân tích chuyên sâu số liệu ngân hàng đề thi</p>
                </div>
                {!isPageLoading && isLive && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" /> Dữ liệu thời gian thực
                    </span>
                )}
            </div>

            {isPageLoading ? (
                <div className="space-y-8">
                    {/* Overview Cards Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                        ))}
                    </div>
                    {/* Subject Coverage Skeleton */}
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    {/* Grid charts Skeletons */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Skeleton className="h-64 w-full rounded-2xl" />
                        <Skeleton className="h-64 w-full rounded-2xl" />
                        <Skeleton className="h-80 w-full rounded-2xl lg:col-span-2" />
                    </div>
                </div>
            ) : (
                <>
                    <OverviewCards 
                        subjectCount={subjectCount} 
                        subjectsListStr={subjectsListStr} 
                        totalQuestions={totalQuestions} 
                        growthPercent={growthPercent} 
                        ocrRate={ocrRate} 
                        avgLatency={avgLatency} 
                    />

                    <SubjectCoverageCard subjectStats={subjectStats} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <DifficultyChartCard 
                            totalQuestions={totalQuestions} 
                            difficultyStats={difficultyStats} 
                            donutSegments={donutSegments} 
                        />

                        <QuestionTypeCard typeStats={typeStats} />

                        <GrowthChartCard 
                            monthlyGrowth={monthlyGrowth} 
                            totalQuestions={totalQuestions} 
                        />
                    </div>
                </>
            )}
        </div>
    );
}
