"use client";

import Link from "next/link";
import { Plus, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useQuestions } from "@/hooks/useQuestions";
import { QuestionFilter } from "./_components/QuestionFilter";
import { QuestionCard } from "./_components/QuestionCard";

import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionsPage() {
    const {
        currentUser, loading,
        searchTerm, setSearchTerm,
        tagSearch, setTagSearch, examTitleSearch, setExamTitleSearch,
        selectedGrade, setSelectedGrade, selectedSubject, setSelectedSubject,
        selectedType, setSelectedType, selectedProvince, setSelectedProvince,
        selectedDifficulty, setSelectedDifficulty,
        uniqueTags, uniqueExamTitles, filteredQuestions,
        toggleCollapse, handleDelete
    } = useQuestions();

    if (loading || !currentUser) {
        return (
            <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-40 rounded-xl" />
                </div>
                <Skeleton className="h-[200px] w-full rounded-2xl" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

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

            <QuestionFilter 
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                examTitleSearch={examTitleSearch} setExamTitleSearch={setExamTitleSearch} uniqueExamTitles={uniqueExamTitles}
                tagSearch={tagSearch} setTagSearch={setTagSearch} uniqueTags={uniqueTags}
                selectedProvince={selectedProvince} setSelectedProvince={setSelectedProvince}
                selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade}
                selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
                selectedType={selectedType} setSelectedType={setSelectedType}
                selectedDifficulty={selectedDifficulty} setSelectedDifficulty={setSelectedDifficulty}
            />

            <div className="space-y-4">
                {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q) => (
                        <QuestionCard key={q.id} q={q} toggleCollapse={toggleCollapse} handleDelete={handleDelete} />
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
        </div>
    );
}
