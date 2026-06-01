"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { flashcardService } from "@/services/flashcardService";
import { Loader2, Brain, CheckCircle2, XCircle, RotateCw, BookOpen, AlertCircle, ArrowRight } from "lucide-react";
import LatexRenderer from "@/components/shared/LatexRenderer";
import { Button } from "@/components/ui/button";

/**
 * Component FlashcardsPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function FlashcardsPage() {
    const { currentUser, loading } = useAuth();
    const [flashcards, setFlashcards] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    
    const [studyMode, setStudyMode] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        const loadCards = async () => {
            const cards = await flashcardService.getUserFlashcards(currentUser.uid);
            
            // Bước 1: Lọc danh sách các thẻ Flashcard đã đến hạn ôn tập dựa trên thuật toán Spaced Repetition
            const now = new Date();
            const dueCards = cards.filter(c => new Date(c.nextReviewDate) <= now);
            
            // Xáo trộn ngẫu nhiên thứ tự các thẻ để tăng hiệu quả ghi nhớ
            setFlashcards(dueCards.sort(() => Math.random() - 0.5));
            setIsFetching(false);
        };
        loadCards();
    }, [currentUser]);

    if (loading || isFetching) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!studyMode) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-violet-100 dark:bg-violet-900/50 rounded-xl">
                        <Brain className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground">Kho Thẻ Ghi Nhớ (Flashcards)</h1>
                        <p className="text-sm text-muted-foreground mt-1">Thuật toán Spaced Repetition giúp bạn không bao giờ quên lỗi sai cũ.</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
                    {flashcards.length > 0 ? (
                        <div className="space-y-6">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mb-2">
                                <span className="text-4xl font-black">{flashcards.length}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Thẻ đến hạn ôn tập!</h3>
                                <p className="text-muted-foreground mt-2 max-w-md mx-auto">Bạn có {flashcards.length} câu hỏi sai trong quá khứ cần được ôn tập lại hôm nay để khắc sâu vào trí nhớ dài hạn.</p>
                            </div>
                            <Button 
                                onClick={() => {
                                    setStudyMode(true);
                                    setCurrentIndex(0);
                                    setIsFlipped(false);
                                }}
                                className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-8 h-12"
                            >
                                <Brain className="w-5 h-5 mr-2" /> Bắt đầu ôn tập ngay
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 py-8">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                            <h3 className="text-xl font-bold text-foreground">Quá tuyệt vời!</h3>
                            <p className="text-muted-foreground">Bạn đã ôn tập xong tất cả thẻ ghi nhớ của ngày hôm nay.<br/>Hãy quay lại vào ngày mai nhé!</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const card = flashcards[currentIndex];
    const qData = card.questionData;
    const alphabet = ["A", "B", "C", "D", "E", "F"];

    const handleRate = async (quality) => {
        // Bước 2: Đồng bộ kết quả đánh giá chất lượng ghi nhớ lên cơ sở dữ liệu (Firestore)
        await flashcardService.updateFlashcardReview(card, quality);
        
        // Cơ chế vòng lặp: Nếu học sinh đánh giá "Khó" (chưa nhớ), thẻ sẽ được nạp lại vào hàng đợi để ôn ngay lập tức
        if (quality === 1) {
            setFlashcards(prev => [...prev, card]);
        }
        
        // Chuyển tiêu điểm sang thẻ Flashcard tiếp theo trong hàng đợi
        if (currentIndex < flashcards.length - 1 || quality === 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        } else {
            // Kết thúc phiên ôn tập khi hàng đợi trống
            setFlashcards([]);
            setStudyMode(false);
        }
    };

    // Tiên đoán số ngày lặp lại tiếp theo của thuật toán SM-2 để hiển thị trực quan cho người dùng
    const getNextIntervalText = (quality) => {
        if (!card) return "";
        let { interval = 1, easeFactor = 2.5, repetitions = 0 } = card;
        
        if (quality >= 3) {
            if (repetitions === 0) interval = 1;
            else if (repetitions === 1) interval = 6;
            else interval = Math.round(interval * easeFactor);
            return `Sau ${interval} ngày`;
        }
        return "Làm lại ngay";
    };

    return (
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
            <div className="w-full flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-muted-foreground">Thẻ {currentIndex + 1} / {flashcards.length}</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted">{card.examTitle}</span>
            </div>

            <div className="w-full relative [perspective:1000px] group">
                <div className={`w-full grid transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateX(180deg)]' : ''}`}>
                    
                    {/* Mặt trước: Câu hỏi */}
                    <div className="col-start-1 row-start-1 w-full min-h-[400px] bg-card border border-border shadow-md rounded-3xl p-6 md:p-10 flex flex-col [backface-visibility:hidden]">
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-4 text-violet-600 dark:text-violet-400">
                                <BookOpen className="w-5 h-5" />
                                <span className="font-bold text-sm uppercase tracking-wider">Câu hỏi</span>
                            </div>
                            <div className="text-lg font-medium text-foreground mb-6 leading-relaxed">
                                <LatexRenderer content={qData.content} />
                            </div>
                            
                            {qData.type === 'multiple_choice' && (
                                <div className="grid gap-3">
                                    {qData.options.map((opt, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/30">
                                            <span className="font-bold shrink-0">{alphabet[idx]}.</span>
                                            <LatexRenderer content={opt} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="mt-8 flex justify-center">
                                <Button 
                                    onClick={() => setIsFlipped(true)}
                                    className="bg-primary/10 hover:bg-primary/20 text-primary font-bold w-full rounded-xl py-6"
                                    variant="ghost"
                                >
                                    <RotateCw className="w-5 h-5 mr-2" /> Nhấn để lật thẻ (Xem đáp án)
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Mặt sau: Đáp án & Tự đánh giá */}
                    <div className="col-start-1 row-start-1 w-full min-h-[400px] bg-card border border-border shadow-md rounded-3xl p-6 md:p-10 flex flex-col [backface-visibility:hidden] [transform:rotateX(180deg)]">
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-bold text-sm uppercase tracking-wider">Đáp án đúng</span>
                            </div>
                            
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-6">
                                {qData.type === 'multiple_choice' ? (
                                    <div className="flex flex-col gap-2">
                                        <span className="font-black text-xl text-emerald-700 dark:text-emerald-400">Phương án {qData.correct_answer}</span>
                                        <LatexRenderer content={qData.options[alphabet.indexOf(qData.correct_answer)] || ""} />
                                    </div>
                                ) : (
                                    <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                                        <LatexRenderer content={qData.final_answer || qData.suggested_solution || "Đã cung cấp trong đề thi."} />
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl mb-auto">
                                <span className="font-bold text-sm text-red-600 dark:text-red-400 block mb-1 flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Lần trước bạn đã chọn:</span>
                                <span className="text-red-700 dark:text-red-300 font-medium">
                                    {qData.type === 'multiple_choice' 
                                        ? alphabet[card.studentAnswer] 
                                        : "Sai (Fill in blank / True False)"}
                                </span>
                            </div>

                            <div className="mt-8">
                                <p className="text-center text-sm font-bold text-muted-foreground mb-4">Bạn có nhớ câu này không?</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleRate(1)}
                                        className="h-auto py-3 flex flex-col gap-1 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/50"
                                    >
                                        <span className="font-black text-lg">Khó</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">{getNextIntervalText(1)}</span>
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleRate(3)}
                                        className="h-auto py-3 flex flex-col gap-1 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-900 dark:hover:bg-amber-950/50"
                                    >
                                        <span className="font-black text-lg">Bình thường</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">{getNextIntervalText(3)}</span>
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleRate(5)}
                                        className="h-auto py-3 flex flex-col gap-1 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900 dark:hover:bg-emerald-950/50"
                                    >
                                        <span className="font-black text-lg">Rất dễ</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">{getNextIntervalText(5)}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
