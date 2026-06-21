import { useState } from "react";

export function useExamAnswers(exam, saveAnswers) {
    const [answers, setAnswers] = useState({});
    const [reviewMarks, setReviewMarks] = useState({});
    const [practiceResults, setPracticeResults] = useState({});

    const handleSelectAnswer = (questionId, optionIndex) => {
        setAnswers(prev => {
            const updated = { ...prev, [questionId]: optionIndex };
            saveAnswers(updated);
            return updated;
        });
    };

    const handleSelectTrueFalse = (questionId, statementIdx, value) => {
        setAnswers(prev => {
            const currentAns = prev[questionId] || {};
            const updatedAns = { ...currentAns, [statementIdx]: value };
            const updated = { ...prev, [questionId]: updatedAns };
            saveAnswers(updated);
            return updated;
        });
    };

    const handleTextAnswer = (questionId, text) => {
        setAnswers(prev => {
            const updated = { ...prev, [questionId]: text };
            saveAnswers(updated);
            return updated;
        });
    };

    const handleFillBlankAnswer = (questionId, blankIdx, value) => {
        setAnswers(prev => {
            const currentAns = prev[questionId] || {};
            const updatedAns = { ...currentAns, [blankIdx]: value };
            const updated = { ...prev, [questionId]: updatedAns };
            saveAnswers(updated);
            return updated;
        });
    };

    const handleGroupAnswer = (questionId, subQId, subType, value, extraIdx = null) => {
        setAnswers(prev => {
            const currentQAns = prev[questionId] || {};
            let subAns = currentQAns[subQId];
            
            if (subType === 'multiple_choice' || subType === 'essay' || subType === 'matching' || subType === 'ordering') {
                subAns = value;
            } else if (subType === 'true_false' || subType === 'fill_blank') {
                subAns = subAns || {};
                subAns = { ...subAns, [extraIdx]: value };
            }
            
            const updated = { ...prev, [questionId]: { ...currentQAns, [subQId]: subAns } };
            saveAnswers(updated);
            return updated;
        });
    };

    const handleToggleReview = (questionId) => {
        setReviewMarks(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const handleCheckAnswer = (qId, subQId = null) => {
        if (!exam || !exam.questions) return;
        const q = exam.questions.find(x => x.id === qId);
        if (!q) return;

        const cleanAndNormalize = (text) => {
            if (text === undefined || text === null) return "";
            let cleaned = text
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
                .replace(/,/g, ".");

            if (/[\d\+\-\*\/=]/.test(cleaned)) {
                cleaned = cleaned.replace(/\s+/g, "");
            } else {
                cleaned = cleaned.replace(/\s+/g, " ");
            }
            return cleaned;
        };

        const checkSingleQ = (qObj, sAns) => {
            if (qObj.type === 'true_false') {
                const stmts = qObj.statements || [];
                let stmtCorrectCount = 0;
                stmts.forEach((stmt, idx) => {
                    if (sAns && sAns[idx] === stmt.correct) stmtCorrectCount++;
                });
                return (stmtCorrectCount === stmts.length && stmts.length > 0);
            } else if (qObj.type === 'fill_blank') {
                const regex = /\[\[(.*?)\]\]/g;
                const correctAnswers = [];
                let match;
                while ((match = regex.exec(qObj.content || "")) !== null) {
                    correctAnswers.push(cleanAndNormalize(match[1]));
                }
                let blankCorrectCount = 0;
                correctAnswers.forEach((correct, idx) => {
                    const ansStr = cleanAndNormalize(sAns && sAns[idx] || "");
                    if (ansStr === correct) blankCorrectCount++;
                });
                return (blankCorrectCount === correctAnswers.length && correctAnswers.length > 0);
            } else if (qObj.type === 'essay') {
                const finalAns = cleanAndNormalize(qObj.final_answer || "");
                const ansStr = cleanAndNormalize(sAns || "");
                return (finalAns && ansStr === finalAns);
            } else if (qObj.type === 'matching') {
                if (!sAns || !Array.isArray(sAns)) return false;
                let correctCount = 0;
                qObj.pairs?.forEach((pair, idx) => {
                    if (sAns[idx] === pair.id) correctCount++;
                });
                return (correctCount === qObj.pairs?.length && qObj.pairs?.length > 0);
            } else if (qObj.type === 'ordering') {
                if (!sAns || !Array.isArray(sAns)) return false;
                let correctCount = 0;
                qObj.items?.forEach((item, idx) => {
                    if (sAns[idx] === item.id) correctCount++;
                });
                return (correctCount === qObj.items?.length && qObj.items?.length > 0);
            } else {
                const alphabet = ["A", "B", "C", "D", "E", "F"];
                const actualCorrectIndex = alphabet.indexOf(qObj.correct_answer);
                return (sAns === actualCorrectIndex);
            }
        };

        if (subQId) {
            const sub = q.subQuestions?.find(x => x.id === subQId);
            if (!sub) return;
            const studentAns = answers[qId] ? answers[qId][subQId] : undefined;
            const isCorrect = checkSingleQ(sub, studentAns);
            setPracticeResults(prev => ({
                ...prev,
                [`${qId}_${subQId}`]: { checked: true, isCorrect }
            }));
            return;
        }

        const studentAns = answers[qId];
        let isCorrect = false;

        if (q.type?.startsWith('group_')) {
            const subQs = q.subQuestions || [];
            let allSubCorrect = true;
            if (subQs.length === 0) allSubCorrect = false;
            subQs.forEach(sub => {
                const sAns = studentAns ? studentAns[sub.id] : undefined;
                if (!checkSingleQ(sub, sAns)) allSubCorrect = false;
            });
            isCorrect = allSubCorrect;
        } else {
            isCorrect = checkSingleQ(q, studentAns);
        }

        setPracticeResults(prev => ({
            ...prev,
            [qId]: { checked: true, isCorrect }
        }));
    };

    return {
        answers, setAnswers,
        reviewMarks, setReviewMarks,
        practiceResults, setPracticeResults,
        handleSelectAnswer, handleSelectTrueFalse, handleTextAnswer, handleFillBlankAnswer, handleGroupAnswer,
        handleToggleReview, handleCheckAnswer
    };
}
