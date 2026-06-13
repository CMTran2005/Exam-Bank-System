"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { errorNotebookService } from "@/services/errorNotebookService";
import { 
    Loader2, 
    BookMarked, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Sparkles, 
    Award, 
    ChevronRight, 
    RefreshCw,
    Search,
    BookOpen,
    ArrowLeft
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});

const alphabet = ["A", "B", "C", "D", "E", "F"];

export default function ErrorNotebookPage() {
    const { currentUser, loading } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("All");

    // Practice State
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null); // For multiple choice
    const [tfAnswers, setTfAnswers] = useState({}); // For true/false
    const [fbAnswers, setFbAnswers] = useState({}); // For fill in the blanks
    const [essayAnswer, setEssayAnswer] = useState(""); // For essay
    const [isGraded, setIsGraded] = useState(false);
    const [wasCorrect, setWasCorrect] = useState(false);
    const [gradingLoading, setGradingLoading] = useState(false);

    const loadQuestions = async () => {
        if (!currentUser) return;
        setIsFetching(true);
        const data = await errorNotebookService.getWrongQuestions(currentUser.uid);
        setQuestions(data);
        setFilteredQuestions(data);
        setIsFetching(false);
    };

    useEffect(() => {
        loadQuestions();
    }, [currentUser]);

    // Apply filtering and search
    useEffect(() => {
        let result = [...questions];

        if (selectedSubject !== "All") {
            result = result.filter(q => q.subject === selectedSubject);
        }

        if (searchQuery.trim()) {
            const queryText = searchQuery.toLowerCase();
            result = result.filter(q => {
                const contentText = (q.questionData?.content || "").toLowerCase();
                const examTitleText = (q.examTitle || "").toLowerCase();
                return contentText.includes(queryText) || examTitleText.includes(queryText);
            });
        }

        setFilteredQuestions(result);
    }, [searchQuery, selectedSubject, questions]);

    // Subjects list
    const subjects = ["All", ...new Set(questions.map(q => q.subject).filter(Boolean))];

    const cleanAndNormalize = (text) => {
        if (text === undefined || text === null) return "";
        return text
            .toString()
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\$/g, "")
            .trim()
            .toLowerCase()
            .replace(/,/g, ".")
            .replace(/\s+/g, "");
    };

    const handleStartPractice = (item) => {
        setActiveQuestion(item);
        setSelectedOption(null);
        setTfAnswers({});
        setFbAnswers({});
        setEssayAnswer("");
        setIsGraded(false);
        setWasCorrect(false);
    };

    const handleCheckAnswer = async () => {
        if (!activeQuestion) return;
        const qData = activeQuestion.questionData;
        let isCorrect = false;

        if (qData.type === "multiple_choice" || qData.type === "group_multiple_choice") {
            if (selectedOption === null) {
                toast.error("Vui lòng chọn một đáp án!");
                return;
            }
            const studentLetter = alphabet[selectedOption];
            isCorrect = studentLetter === qData.correct_answer;
        } else if (qData.type === "true_false" || qData.type === "group_true_false") {
            const stmts = qData.statements || [];
            const answeredCount = Object.keys(tfAnswers).length;
            if (answeredCount < stmts.length) {
                toast.error("Vui lòng chọn Đúng/Sai cho tất cả các ý!");
                return;
            }
            isCorrect = stmts.every((stmt, idx) => tfAnswers[idx] === stmt.correct);
        } else if (qData.type === "fill_blank" || qData.type === "group_fill_blank") {
            const regex = /\[\[(.*?)\]\]/g;
            const correctAnswers = [];
            let match;
            while ((match = regex.exec(qData.content || "")) !== null) {
                correctAnswers.push(cleanAndNormalize(match[1]));
            }
            const answeredCount = Object.keys(fbAnswers).length;
            if (answeredCount < correctAnswers.length) {
                toast.error("Vui lòng điền đầy đủ đáp án vào các ô trống!");
                return;
            }
            isCorrect = correctAnswers.every((correct, idx) => {
                const ans = cleanAndNormalize(fbAnswers[idx]);
                return ans === correct;
            });
        } else if (qData.type === "essay" || qData.type === "group_essay") {
            if (!essayAnswer.trim()) {
                toast.error("Vui lòng nhập câu trả lời của bạn!");
                return;
            }
            isCorrect = cleanAndNormalize(essayAnswer) === cleanAndNormalize(qData.final_answer);
        }

        setGradingLoading(true);
        try {
            const result = await errorNotebookService.updateQuestionReview(
                currentUser.uid,
                activeQuestion.id,
                isCorrect
            );

            setIsGraded(true);
            setWasCorrect(isCorrect);

            if (isCorrect) {
                if (result.deleted) {
                    // Trigger confetti!
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 }
                    });
                    toast.success("Tuyệt vời! Bạn đã thành thạo câu hỏi này 3 lần và loại bỏ nó khỏi sổ tay!");
                } else {
                    toast.success(`Đúng rồi! Độ thành thạo hiện tại: ${result.correctAttempts}/3`);
                }
            } else {
                toast.error("Rất tiếc, câu trả lời chưa chính xác. Độ thành thạo đã bị đặt lại về 0/3.");
            }
            
            // Reload list silently
            const updated = await errorNotebookService.getWrongQuestions(currentUser.uid);
            setQuestions(updated);
        } catch (error) {
            toast.error(error.message || "Có lỗi xảy ra khi cập nhật kết quả.");
        } finally {
            setGradingLoading(false);
        }
    };

    if (loading || isFetching) {
        return (
            <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">Đang tải sổ tay câu sai...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 dark:bg-red-950/40 rounded-2xl text-red-600 dark:text-red-400">
                        <BookMarked className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
                            Sổ Tay Câu Sai
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">
                            Luyện tập lại các câu hỏi đã trả lời sai để ghi nhớ lâu hơn
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm border border-red-200 dark:border-red-900 bg-red-500/5 text-red-600 dark:text-red-400 font-bold">
                        Đang lưu giữ: {questions.length} câu
                    </span>
                    <Button variant="ghost" size="icon" onClick={loadQuestions} className="rounded-xl">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* If Practice Mode is Active */}
            {activeQuestion ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            onClick={() => setActiveQuestion(null)}
                            className="rounded-xl font-bold flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                        </Button>
                    </div>

                    <Card className="p-6 md:p-8 rounded-3xl border-border bg-card/60 backdrop-blur-sm shadow-md space-y-6">
                        {/* Context info */}
                        <div className="flex items-center justify-between border-b border-border/60 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-xs">
                                    {activeQuestion.subject}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">Độ thành thạo:</span>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3].map((step) => (
                                        <div 
                                            key={step} 
                                            className={`w-3.5 h-3.5 rounded-full border border-border/80 transition-all ${
                                                step <= (activeQuestion.correctAttempts || 0) 
                                                ? "bg-emerald-500 border-emerald-600 shadow-sm" 
                                                : "bg-muted"
                                            }`} 
                                        />
                                    ))}
                                    <span className="text-xs font-bold ml-1 text-foreground">
                                        {(activeQuestion.correctAttempts || 0)}/3
                                    </span>
                                </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                                ID: {activeQuestion.id.substring(0, 8)}
                            </span>
                        </div>

                        {/* Passage for sub-question if applicable */}
                        {activeQuestion.questionData.parentContent && (
                            <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl max-h-48 overflow-y-auto text-sm leading-relaxed">
                                <span className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wider">Bối cảnh / Đọc hiểu:</span>
                                <LatexRenderer content={activeQuestion.questionData.parentContent} />
                            </div>
                        )}

                        {/* Question body */}
                        <div className="space-y-4">
                            <div className="text-lg font-bold text-foreground leading-relaxed">
                                <LatexRenderer content={activeQuestion.questionData.content} />
                            </div>

                            {/* Render answer inputs based on question type */}
                            {/* MULTIPLE CHOICE */}
                            {(activeQuestion.questionData.type === "multiple_choice" || activeQuestion.questionData.type === "group_multiple_choice") && (
                                <div className="grid gap-3 pt-2">
                                    {(activeQuestion.questionData.options || []).map((opt, idx) => {
                                        const isSelected = selectedOption === idx;
                                        const isCorrectOpt = alphabet[idx] === activeQuestion.questionData.correct_answer;
                                        
                                        let borderClass = "border-border hover:bg-muted/30";
                                        let bgClass = "bg-background/50";

                                        if (isGraded) {
                                            if (isCorrectOpt) {
                                                borderClass = "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20";
                                                bgClass = "text-emerald-700 dark:text-emerald-400";
                                            } else if (isSelected) {
                                                borderClass = "border-red-500 bg-red-50/40 dark:bg-red-950/20";
                                                bgClass = "text-red-700 dark:text-red-400";
                                            }
                                        } else if (isSelected) {
                                            borderClass = "border-primary bg-primary/5 ring-1 ring-primary/30";
                                        }

                                        return (
                                            <button 
                                                key={idx}
                                                onClick={() => !isGraded && setSelectedOption(idx)}
                                                disabled={isGraded}
                                                className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${borderClass} ${bgClass}`}
                                            >
                                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm shrink-0 border ${
                                                    isSelected 
                                                    ? "bg-primary text-primary-foreground border-primary" 
                                                    : "bg-muted/80 text-muted-foreground border-border/80"
                                                }`}>
                                                    {alphabet[idx]}
                                                </span>
                                                <div className="font-semibold text-sm leading-relaxed pt-0.5">
                                                    <LatexRenderer content={opt} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* TRUE / FALSE */}
                            {(activeQuestion.questionData.type === "true_false" || activeQuestion.questionData.type === "group_true_false") && (
                                <div className="space-y-4 pt-2">
                                    {(activeQuestion.questionData.statements || []).map((stmt, idx) => {
                                        const currentAns = tfAnswers[idx];
                                        const isCorrectStatement = currentAns === stmt.correct;

                                        return (
                                            <div key={idx} className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-3">
                                                <div className="text-sm font-semibold leading-relaxed">
                                                    <span className="text-xs font-bold text-muted-foreground mr-1">Ý {idx + 1}:</span>
                                                    <LatexRenderer content={stmt.content} />
                                                </div>
                                                <div className="flex gap-2">
                                                    {[true, false].map((val) => {
                                                        const isSelected = currentAns === val;
                                                        let btnVariant = isSelected ? "default" : "outline";
                                                        
                                                        if (isGraded) {
                                                            if (stmt.correct === val) {
                                                                btnVariant = "emerald"; // Highlight correct answer
                                                            } else if (isSelected) {
                                                                btnVariant = "destructive"; // Highlight student wrong answer
                                                            }
                                                        }

                                                        return (
                                                            <Button
                                                                key={val.toString()}
                                                                size="sm"
                                                                variant={btnVariant === "emerald" ? "default" : btnVariant}
                                                                disabled={isGraded}
                                                                onClick={() => setTfAnswers(prev => ({ ...prev, [idx]: val }))}
                                                                className={`rounded-xl font-bold px-4 ${
                                                                    btnVariant === "emerald" 
                                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                                                                    : btnVariant === "destructive" 
                                                                    ? "bg-red-500 hover:bg-red-600 text-white" 
                                                                    : ""
                                                                }`}
                                                            >
                                                                {val ? "Đúng" : "Sai"}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* FILL IN THE BLANKS */}
                            {(activeQuestion.questionData.type === "fill_blank" || activeQuestion.questionData.type === "group_fill_blank") && (
                                <div className="space-y-4 pt-2">
                                    <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-3">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Điền câu trả lời vào các ô trống dưới đây:</p>
                                        
                                        {(() => {
                                            const regex = /\[\[(.*?)\]\]/g;
                                            const blanks = [];
                                            let match;
                                            while ((match = regex.exec(activeQuestion.questionData.content || "")) !== null) {
                                                blanks.push(match[1]);
                                            }

                                            return blanks.map((correctVal, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                    <span className="text-xs font-bold text-muted-foreground shrink-0 w-16">Ô trống {idx + 1}:</span>
                                                    <div className="relative flex-1">
                                                        <Input
                                                            disabled={isGraded}
                                                            value={fbAnswers[idx] || ""}
                                                            onChange={(e) => setFbAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                                            placeholder="Nhập đáp án..."
                                                            className={`rounded-xl border-border bg-background focus:ring-1 focus:ring-primary ${
                                                                isGraded 
                                                                ? cleanAndNormalize(fbAnswers[idx]) === cleanAndNormalize(correctVal)
                                                                    ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 font-bold"
                                                                    : "border-red-500 bg-red-500/5 text-red-600 font-bold"
                                                                : ""
                                                            }`}
                                                        />
                                                        {isGraded && cleanAndNormalize(fbAnswers[idx]) !== cleanAndNormalize(correctVal) && (
                                                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Đáp án đúng: {correctVal}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* ESSAY */}
                            {(activeQuestion.questionData.type === "essay" || activeQuestion.questionData.type === "group_essay") && (
                                <div className="space-y-3 pt-2">
                                    <Textarea
                                        disabled={isGraded}
                                        value={essayAnswer}
                                        onChange={(e) => setEssayAnswer(e.target.value)}
                                        placeholder="Nhập câu trả lời chi tiết của bạn..."
                                        rows={4}
                                        className={`rounded-2xl border-border bg-background focus:ring-1 focus:ring-primary ${
                                            isGraded 
                                            ? cleanAndNormalize(essayAnswer) === cleanAndNormalize(activeQuestion.questionData.final_answer)
                                                ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 font-bold"
                                                : "border-red-500 bg-red-500/5 text-red-600 font-bold"
                                            : ""
                                        }`}
                                    />
                                    {isGraded && (
                                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400">Đáp án chuẩn:</p>
                                            <LatexRenderer content={activeQuestion.questionData.final_answer || "Chưa thiết lập đáp án văn bản."} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Grading Feedback Panel */}
                        {isGraded && (
                            <div className={`p-5 rounded-2xl border flex items-start gap-3 animate-in slide-in-from-bottom-2 ${
                                wasCorrect 
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                : "bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400"
                            }`}>
                                {wasCorrect ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-sm">Câu trả lời chính xác!</h4>
                                            <p className="text-xs mt-1 opacity-90 leading-relaxed">
                                                Cố gắng duy trì phong độ và tiếp tục ôn tập để nâng cao trình độ.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-sm">Câu trả lời chưa chính xác!</h4>
                                            <p className="text-xs mt-1 opacity-90 leading-relaxed">
                                                Hãy ghi nhớ đáp án đúng và tiếp tục rèn luyện ở lần sau.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                            {isGraded ? (
                                <>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setActiveQuestion(null)}
                                        className="rounded-xl font-bold h-11"
                                    >
                                        Đóng & Quay lại
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                            // Find next wrong question in list or refresh same question
                                            const currentIndex = questions.findIndex(q => q.id === activeQuestion.id);
                                            if (currentIndex !== -1 && currentIndex < questions.length - 1) {
                                                handleStartPractice(questions[currentIndex + 1]);
                                            } else if (questions.length > 0) {
                                                handleStartPractice(questions[0]);
                                            } else {
                                                setActiveQuestion(null);
                                            }
                                        }}
                                        className="rounded-xl font-bold h-11 bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5"
                                    >
                                        Luyện tập câu tiếp theo <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button 
                                    onClick={handleCheckAnswer}
                                    disabled={gradingLoading}
                                    className="rounded-xl font-bold h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5"
                                >
                                    {gradingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Nộp bài kiểm tra
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            ) : (
                <>
                    {/* Filters bar */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/80">
                        {/* Search input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm câu hỏi hoặc đề thi..."
                                className="pl-9 bg-background border-border rounded-xl focus:ring-1 focus:ring-primary h-11"
                            />
                        </div>

                        {/* Subject filters */}
                        <div className="flex flex-wrap gap-1.5">
                            {subjects.map((subj) => (
                                <button
                                    key={subj}
                                    onClick={() => setSelectedSubject(subj)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        selectedSubject === subj 
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                        : "bg-background text-muted-foreground border-border hover:bg-muted/40"
                                    }`}
                                >
                                    {subj === "All" ? "Tất cả môn" : subj}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question Lists */}
                    {filteredQuestions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredQuestions.map((item) => (
                                <Card 
                                    key={item.id} 
                                    className="p-5 md:p-6 rounded-3xl border-border bg-card/65 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                                >
                                    <div className="space-y-3">
                                        {/* Card Top Meta */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center rounded-lg bg-primary/10 text-primary font-bold text-[10px] px-2 py-0.5">
                                                    {item.subject}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {new Date(item.addedAt).toLocaleDateString("vi-VN")}
                                                </span>
                                            </div>
                                            
                                            {/* Mastery indicator */}
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3].map((step) => (
                                                    <div 
                                                        key={step} 
                                                        className={`w-2.5 h-2.5 rounded-full border border-border/80 ${
                                                            step <= (item.correctAttempts || 0) 
                                                            ? "bg-emerald-500 border-emerald-600" 
                                                            : "bg-muted"
                                                        }`} 
                                                    />
                                                ))}
                                                <span className="text-[10px] font-bold text-muted-foreground ml-1">
                                                    {(item.correctAttempts || 0)}/3
                                                </span>
                                            </div>
                                        </div>

                                        {/* Question Content Snippet */}
                                        <div className="text-sm font-semibold text-foreground leading-relaxed line-clamp-3 overflow-hidden text-ellipsis">
                                            <LatexRenderer content={item.questionData?.content || ""} />
                                        </div>

                                        <p className="text-[10px] text-muted-foreground font-medium italic">
                                            Nguồn: {item.examTitle || "Tự luyện tập"}
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-2 border-t border-border/40 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Loại: {item.questionData?.type === "multiple_choice" ? "Trắc nghiệm" : item.questionData?.type === "true_false" ? "Đúng/Sai" : item.questionData?.type === "fill_blank" ? "Điền khuyết" : "Tự luận"}
                                        </span>
                                        <Button 
                                            size="sm"
                                            onClick={() => handleStartPractice(item)}
                                            className="rounded-xl font-bold bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all flex items-center gap-1"
                                        >
                                            Luyện tập <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-card/40 border border-border rounded-3xl p-12 text-center shadow-sm space-y-4 max-w-lg mx-auto">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                                <Award className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Bạn không có câu hỏi sai nào!</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                Thật ấn tượng! Không tìm thấy câu hỏi sai nào trong bộ lọc này. Hãy tiếp tục làm bài kiểm tra để duy trì kết quả tuyệt vời nhé!
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
