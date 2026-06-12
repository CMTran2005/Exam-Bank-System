"use client";

import Link from "next/link";
import { Plus, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useQuestions } from "@/hooks/teacher/useQuestions";
import { QuestionFilter } from "./_components/QuestionFilter";
import { QuestionCard } from "./_components/QuestionCard";
import VirtualizedItem from "@/components/shared/VirtualizedItem";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Component QuestionsPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function QuestionsPage() {
    const {
        currentUser, loading,
        uniqueTags, uniqueExamTitles, filteredQuestions,
        toggleCollapse, handleDelete
    } = useQuestions();

    const isPageLoading = loading || !currentUser;

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-primary rounded-full animate-pulse" />
                        Ngân Hàng Câu Hỏi
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">Tra cứu, sắp xếp và phân loại ngân hàng câu hỏi đề thi</p>
                </div>
                <Link href="/create-question">
                    <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md shadow-primary/10 rounded-xl flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Soạn câu hỏi mới
                    </Button>
                </Link>
            </div>

            {isPageLoading ? (
                <>
                    <Skeleton className="h-[200px] w-full rounded-2xl" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <QuestionFilter 
                        uniqueExamTitles={uniqueExamTitles}
                        uniqueTags={uniqueTags}
                    />

                    <div className="space-y-4">
                        {filteredQuestions.length > 0 ? (
                            filteredQuestions.map((q) => (
                                <VirtualizedItem key={q.id}>
                                    <QuestionCard q={q} toggleCollapse={toggleCollapse} handleDelete={handleDelete} />
                                </VirtualizedItem>
                            ))
                        ) : (
                            <div className="bg-card border border-dashed border-border p-12 rounded-2xl text-center space-y-3">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                                    <HelpCircle className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-bold text-foreground">Không tìm thấy câu hỏi nào phù hợp!</p>
                                <p className="text-xs text-muted-foreground">Vui lòng điều chỉnh lại bộ lọc hoặc nhập nội dung tìm kiếm khác.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
