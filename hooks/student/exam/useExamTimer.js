import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export function useExamTimer(attempt, exam, answers, isPracticeMode, handleAutoSubmit) {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isTimerEnabled, setIsTimerEnabled] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const timerRef = useRef(null);
    const autoSaveTimerRef = useRef(null);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && !isSubmitting && isTimerEnabled) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        if (attempt && exam) {
                            if (!isPracticeMode) {
                                handleAutoSubmit(attempt.id, answers, exam);
                            } else {
                                toast.info("Đã hết thời gian chuẩn của đề thi, nhưng bạn vẫn có thể làm tiếp trong chế độ Luyện Tập!");
                            }
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timeLeft, isSubmitting, attempt, answers, exam, isTimerEnabled, isPracticeMode, handleAutoSubmit]);

    return { 
        timeLeft, 
        setTimeLeft, 
        isTimerEnabled, 
        setIsTimerEnabled, 
        isSubmitting, 
        setIsSubmitting, 
        timerRef,
        autoSaveTimerRef
    };
}
