import React from "react";
import { BarChart2, Loader2, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { cleanAndNormalize } from "@/lib/textUtils";

const LatexRenderer = dynamic(() => import("@/components/shared/LatexRenderer"), {
    ssr: false,
    loading: () => <span className="text-muted-foreground animate-pulse text-xs">đang tải...</span>
});

export function ClassStatsTab({ isLoadingExamDetails, selectedExamDetails, attempts, expandedQuestionId, setExpandedQuestionId }) {
    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-blue-500" /> Thống kê bài thi
                </h3>
            </div>
            
            {(() => {
                if (isLoadingExamDetails) {
                    return (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground font-medium animate-pulse">Đang tải câu hỏi và phân tích dữ liệu...</p>
                        </div>
                    );
                }

                const selectedExam = selectedExamDetails;
                if (!selectedExam || !selectedExam.questions || selectedExam.questions.length === 0) {
                    return (
                        <div className="text-center py-12 text-muted-foreground">
                            Không đủ dữ liệu thống kê cho đề thi này. Đề thi không có câu hỏi hoặc chưa tải đủ dữ liệu.
                        </div>
                    );
                }

                const completedAttempts = attempts.filter(a => a.status === 'completed');
                if (completedAttempts.length === 0) {
                    return (
                        <div className="text-center py-12 text-muted-foreground">
                            Chưa có học sinh nào nộp bài để thống kê.
                        </div>
                    );
                }

                // Helper function to check if a student's answer is correct
                const checkIsCorrect = (item, studentAns) => {
                    if (studentAns === undefined || studentAns === null) return false;

                    if (item.type === 'true_false') {
                        const stmts = item.statements || [];
                        let stmtCorrectCount = 0;
                        stmts.forEach((stmt, idx) => {
                            if (studentAns[idx] === stmt.correct) stmtCorrectCount++;
                        });
                        return stmtCorrectCount === stmts.length && stmts.length > 0;
                    } else if (item.type === 'fill_blank') {
                        const regex = /\[\[(.*?)\]\]/g;
                        const correctAnswers = [];
                        let match;
                        while ((match = regex.exec(item.content || "")) !== null) {
                            correctAnswers.push(cleanAndNormalize(match[1]));
                        }
                        let blankCorrectCount = 0;
                        correctAnswers.forEach((correct, idx) => {
                            const ansStr = cleanAndNormalize(studentAns[idx]);
                            if (ansStr === correct) blankCorrectCount++;
                        });
                        return blankCorrectCount === correctAnswers.length && correctAnswers.length > 0;
                    } else if (item.type === 'essay') {
                        const finalAns = cleanAndNormalize(item.final_answer || "");
                        const ansStr = cleanAndNormalize(studentAns || "");
                        return finalAns && ansStr === finalAns;
                    } else {
                        const alphabet = ["A", "B", "C", "D", "E", "F"];
                        const actualCorrectIndex = alphabet.indexOf(item.correct_answer);
                        return studentAns === actualCorrectIndex;
                    }
                };

                // Flatten the exam questions list, splitting grouped questions into sub-questions
                const flatQuestions = [];
                selectedExam.questions.forEach((q, qIdx) => {
                    if (q.type && q.type.startsWith('group_') && q.subQuestions && q.subQuestions.length > 0) {
                        q.subQuestions.forEach((subQ, subIdx) => {
                            flatQuestions.push({
                                id: subQ.id,
                                label: `Câu ${qIdx + 1}.${subIdx + 1}`,
                                type: subQ.type || 'multiple_choice',
                                correct_answer: subQ.correct_answer,
                                points: subQ.points,
                                parentId: q.id,
                                statements: subQ.statements,
                                content: subQ.content,
                                final_answer: subQ.final_answer,
                                options: subQ.options
                            });
                        });
                    } else {
                        flatQuestions.push({
                            id: q.id,
                            label: `Câu ${qIdx + 1}`,
                            type: q.type || 'multiple_choice',
                            correct_answer: q.correct_answer,
                            points: q.points,
                            parentId: null,
                            statements: q.statements,
                            content: q.content,
                            final_answer: q.final_answer,
                            options: q.options
                        });
                    }
                });

                // 1. Chuẩn hóa tất cả điểm số về hệ 10 để vẽ phổ điểm chung
                const scoresNormalized = completedAttempts.map(a => {
                    const scoreVal = a.score !== undefined ? a.score : 0;
                    const maxScoreVal = a.maxScore !== undefined && a.maxScore > 0 ? a.maxScore : 10;
                    return (scoreVal / maxScoreVal) * 10;
                });

                const totalCount = completedAttempts.length;
                const maxScoreInExam = completedAttempts[0]?.maxScore || 10;

                const rawScores = completedAttempts.map(a => a.score || 0);
                const highestScoreRaw = Math.max(...rawScores);
                const lowestScoreRaw = Math.min(...rawScores);
                const avgScoreRaw = rawScores.reduce((acc, s) => acc + s, 0) / totalCount;

                // 2. Tính tỉ lệ đạt (Điểm quy chuẩn >= 5.0)
                const passedCount = scoresNormalized.filter(s => s >= 5).length;
                const passRate = Math.round((passedCount / totalCount) * 100);

                // 3. Phân chia phổ điểm thang 10 (10 cột: 0-1, 1-2, ..., 9-10)
                const bins = Array(10).fill(0);
                scoresNormalized.forEach(s => {
                    let binIdx = Math.floor(s);
                    if (binIdx >= 10) binIdx = 9; // Xử lý điểm 10 tuyệt đối
                    if (binIdx < 0) binIdx = 0;
                    bins[binIdx]++;
                });

                const maxBinCount = Math.max(...bins) || 1;

                return (
                    <div className="space-y-8">
                        {/* Thẻ thống kê tổng quan */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/30 shadow-sm">
                                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">Số lượt nộp</p>
                                <p className="text-3xl font-black text-foreground">{totalCount}</p>
                            </div>
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wider">Điểm trung bình</p>
                                <p className="text-3xl font-black text-foreground">
                                    {avgScoreRaw.toFixed(2)}
                                    <span className="text-xs font-semibold text-muted-foreground ml-1">/ {maxScoreInExam}</span>
                                </p>
                            </div>
                            <div className="bg-violet-50/50 dark:bg-violet-900/10 p-5 rounded-2xl border border-violet-100 dark:border-violet-800/30 shadow-sm">
                                <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 mb-1 uppercase tracking-wider">Điểm cao nhất</p>
                                <p className="text-3xl font-black text-foreground">
                                    {highestScoreRaw.toFixed(2)}
                                    <span className="text-xs font-semibold text-muted-foreground ml-1">/ {maxScoreInExam}</span>
                                </p>
                            </div>
                            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-800/30 shadow-sm">
                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider">Điểm thấp nhất</p>
                                <p className="text-3xl font-black text-foreground">
                                    {lowestScoreRaw.toFixed(2)}
                                    <span className="text-xs font-semibold text-muted-foreground ml-1">/ {maxScoreInExam}</span>
                                </p>
                            </div>
                            <div className={`${passRate >= 50 ? 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800/30' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30'} p-5 rounded-2xl border shadow-sm`}>
                                <p className={`text-[10px] font-bold ${passRate >= 50 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'} mb-1 uppercase tracking-wider`}>Tỉ lệ đạt</p>
                                <p className="text-3xl font-black text-foreground">{passRate}%</p>
                            </div>
                        </div>

                        {/* Biểu đồ Phổ điểm */}
                        <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm">
                            <h4 className="font-bold text-sm mb-6 flex items-center gap-2">
                                <span className="w-2.5 h-4 bg-primary rounded-full" />
                                Biểu đồ phổ điểm lớp học (Quy chuẩn hệ điểm 10)
                            </h4>
                            <div className="relative h-64 w-full mt-4">
                                {/* Đường kẻ phụ */}
                                <div className="absolute top-4 bottom-8 left-0 right-0 flex flex-col justify-between pointer-events-none">
                                    <div className="border-b border-border/30 w-full" />
                                    <div className="border-b border-border/30 w-full" />
                                    <div className="border-b border-border/30 w-full" />
                                    <div className="border-b border-border/60 w-full" />
                                </div>

                                {/* Cột dữ liệu */}
                                <div className="absolute inset-0 flex justify-between px-2 sm:px-6">
                                    {bins.map((count, binIdx) => {
                                        const pctHeight = (count / maxBinCount) * 100;
                                        const binLabel = binIdx === 9 ? "9-10" : `${binIdx}-${binIdx+1}`;
                                        return (
                                            <div key={binIdx} className="flex flex-col items-center h-full flex-1 group mx-0.5 sm:mx-1">
                                                <div className="w-full relative mt-4 flex-1">
                                                    <div
                                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 sm:w-10 bg-gradient-to-t from-primary/70 to-primary rounded-t-lg transition-all duration-500 group-hover:from-violet-500 group-hover:to-violet-600 shadow-sm"
                                                        style={{ height: `${pctHeight}%`, minHeight: count > 0 ? "4px" : "0px" }}
                                                    >
                                                        {count > 0 && (
                                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded transition-all duration-300 transform group-hover:scale-105 opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 shadow-sm">
                                                                {count} HS
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-8 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">{binLabel}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        
                        <h4 className="font-bold text-md mt-8 mb-4">Chi tiết từng câu hỏi</h4>
                        <div className="overflow-x-auto border border-border/60 rounded-xl">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Câu hỏi</th>
                                        <th className="px-4 py-3 text-center">Tỉ lệ Đúng</th>
                                        <th className="px-4 py-3 text-center">Chưa trả lời</th>
                                        <th className="px-4 py-3 text-center w-24">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {flatQuestions.map((q) => {
                                        const alphabet = ["A", "B", "C", "D", "E", "F"];
                                        const actualCorrectIndex = alphabet.indexOf(q.correct_answer);
                                        
                                        let correctCount = 0;
                                        const choiceCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
                                        let skippedCount = 0;

                                        completedAttempts.forEach(a => {
                                            const studentAns = q.parentId 
                                                ? a.answers?.[q.parentId]?.[q.id]
                                                : a.answers?.[q.id];

                                            if (studentAns === undefined || studentAns === null || (typeof studentAns === 'string' && studentAns.trim() === "")) {
                                                skippedCount++;
                                            } else {
                                                if (q.type === 'multiple_choice' || !q.type) {
                                                    if (choiceCounts[studentAns] !== undefined) choiceCounts[studentAns]++;
                                                }
                                                if (checkIsCorrect(q, studentAns)) {
                                                    correctCount++;
                                                }
                                            }
                                        });

                                        const correctRate = Math.round((correctCount / completedAttempts.length) * 100) || 0;
                                        const isMultipleChoice = q.type === 'multiple_choice' || !q.type;
                                        const isExpanded = expandedQuestionId === q.id;

                                        const getTypeBadge = (type) => {
                                            switch (type) {
                                                case 'true_false': 
                                                    return <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 ml-2">Đúng/Sai</span>;
                                                case 'fill_blank': 
                                                    return <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 ml-2">Điền từ</span>;
                                                case 'essay': 
                                                    return <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 ml-2">Tự luận</span>;
                                                case 'matching': 
                                                    return <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 ml-2">Nối từ</span>;
                                                case 'ordering': 
                                                    return <span className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 px-1.5 py-0.5 rounded border border-fuchsia-500/20 ml-2">Sắp xếp</span>;
                                                default: 
                                                    return <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 ml-2">Trắc nghiệm</span>;
                                            }
                                        };
                                        
                                        return (
                                            <React.Fragment key={q.id}>
                                                <tr 
                                                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/20' : ''}`}
                                                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                                >
                                                    <td className="px-6 py-3 font-semibold text-foreground">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{q.label}</span>
                                                            {getTypeBadge(q.type)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded font-bold text-xs ${correctRate >= 50 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                                                            {correctRate}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-muted-foreground">{skippedCount}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-all duration-200">
                                                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                                                        </div>
                                                    </td>
                                                </tr>
                                                 {isExpanded && (
                                                     <tr className="bg-muted/5">
                                                         <td colSpan={4} className="px-6 py-4 border-t border-b border-border/50">
                                                             <div className="py-2 space-y-4 text-left max-w-4xl mx-auto">
                                                                 
                                                                 {/* Case 1: Multiple choice */}
                                                                 {isMultipleChoice && q.options && (
                                                                     <div className="space-y-3">
                                                                         <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tỉ lệ lựa chọn các đáp án:</div>
                                                                         {q.options.map((_, optIdx) => {
                                                                             const count = choiceCounts[optIdx] || 0;
                                                                             const pct = Math.round((count / completedAttempts.length) * 100) || 0;
                                                                             const isCorrectOpt = optIdx === actualCorrectIndex;
                                                                             return (
                                                                                 <div key={optIdx} className="flex items-center gap-4 text-xs sm:text-sm">
                                                                                     <span className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg font-bold text-xs ${isCorrectOpt ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground'}`}>
                                                                                         {alphabet[optIdx]}
                                                                                     </span>
                                                                                     <div className="flex-1">
                                                                                         <div className="flex justify-between mb-1 font-semibold text-xs">
                                                                                             <span className={isCorrectOpt ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                                                                                                 Lựa chọn {alphabet[optIdx]} {isCorrectOpt && "(Đáp án đúng)"}
                                                                                             </span>
                                                                                             <span className="text-muted-foreground font-mono">{count} lượt ({pct}%)</span>
                                                                                         </div>
                                                                                         <div className="w-full bg-muted dark:bg-muted/40 rounded-full h-1.5 overflow-hidden">
                                                                                             <div className={`h-full rounded-full ${isCorrectOpt ? 'bg-emerald-500' : 'bg-primary/60'}`} style={{ width: `${pct}%` }} />
                                                                                         </div>
                                                                                     </div>
                                                                                 </div>
                                                                             );
                                                                         })}
                                                                     </div>
                                                                 )}

                                                                 {/* Case 2: True/False */}
                                                                 {q.type === 'true_false' && q.statements && (
                                                                     <div className="space-y-4">
                                                                         <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Phân tích mệnh đề Đúng/Sai:</div>
                                                                         {q.statements.map((stmt, stmtIdx) => {
                                                                             let trueCount = 0;
                                                                             let falseCount = 0;
                                                                             completedAttempts.forEach(a => {
                                                                                 const ans = q.parentId ? a.answers?.[q.parentId]?.[q.id] : a.answers?.[q.id];
                                                                                 if (ans && ans[stmtIdx] === true) trueCount++;
                                                                                 else if (ans && ans[stmtIdx] === false) falseCount++;
                                                                             });
                                                                             const totalAnswers = trueCount + falseCount;
                                                                             const truePct = totalAnswers > 0 ? Math.round((trueCount / totalAnswers) * 100) : 0;
                                                                             const falsePct = totalAnswers > 0 ? Math.round((falseCount / totalAnswers) * 100) : 0;
                                                                             
                                                                             return (
                                                                                 <div key={stmtIdx} className="border border-border/40 p-3.5 rounded-xl bg-muted/20">
                                                                                     <div className="mb-3 flex items-start justify-between gap-4">
                                                                                         <LatexRenderer text={stmt.text} className="prose prose-sm dark:prose-invert max-w-none text-foreground font-medium flex-1" />
                                                                                         <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-1">Đáp án đúng: <strong className="text-emerald-600">{stmt.correct ? 'Đúng' : 'Sai'}</strong></span>
                                                                                     </div>
                                                                                     <div className="grid grid-cols-2 gap-3 text-xs">
                                                                                         <div className="bg-muted/30 p-2 rounded flex flex-col justify-between">
                                                                                             <div className="flex justify-between font-bold mb-1 text-emerald-600">
                                                                                                 <span>Đúng</span>
                                                                                                 <span className="font-mono">{trueCount} ({truePct}%)</span>
                                                                                             </div>
                                                                                             <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                                                                                                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${truePct}%` }} />
                                                                                             </div>
                                                                                         </div>
                                                                                         <div className="bg-muted/30 p-2 rounded flex flex-col justify-between">
                                                                                             <div className="flex justify-between font-bold mb-1 text-rose-600">
                                                                                                 <span>Sai</span>
                                                                                                 <span className="font-mono">{falseCount} ({falsePct}%)</span>
                                                                                             </div>
                                                                                             <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                                                                                                 <div className="h-full bg-rose-500 rounded-full" style={{ width: `${falsePct}%` }} />
                                                                                             </div>
                                                                                         </div>
                                                                                     </div>
                                                                                 </div>
                                                                             );
                                                                         })}
                                                                     </div>
                                                                 )}

                                                                 {/* Case 3: Fill blank */}
                                                                 {q.type === 'fill_blank' && (
                                                                     <div className="space-y-4">
                                                                         <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Thống kê tỷ lệ hoàn thành điền từ:</div>
                                                                         <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                                                                             <div className="flex items-center justify-between text-xs sm:text-sm">
                                                                                 <span className="font-semibold text-muted-foreground">Tỉ lệ trả lời chính xác:</span>
                                                                                 <span className={`px-2 py-0.5 rounded font-bold text-xs ${correctRate >= 50 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                                                                                     {correctRate}%
                                                                                 </span>
                                                                             </div>
                                                                             <div className="w-full bg-muted dark:bg-muted/40 rounded-full h-2 overflow-hidden">
                                                                                 <div className={`h-full rounded-full ${correctRate >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${correctRate}%` }} />
                                                                             </div>
                                                                             {(() => {
                                                                                 const regex = /\[\[(.*?)\]\]/g;
                                                                                 const correctAnswers = [];
                                                                                 let match;
                                                                                 while ((match = regex.exec(q.content || "")) !== null) {
                                                                                     correctAnswers.push(match[1]);
                                                                                 }
                                                                                 if (correctAnswers.length > 0) {
                                                                                     return (
                                                                                         <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground space-y-1">
                                                                                             <span className="font-bold">Đáp án chính xác:</span>
                                                                                             <div className="flex flex-wrap gap-2 mt-1">
                                                                                                 {correctAnswers.map((ans, aIdx) => (
                                                                                                     <span key={aIdx} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono inline-flex items-center gap-1">
                                                                                                         <span>[{aIdx + 1}]</span>
                                                                                                         <LatexRenderer text={ans} className="inline" />
                                                                                                     </span>
                                                                                                 ))}
                                                                                             </div>
                                                                                         </div>
                                                                                     );
                                                                                 }
                                                                                 return null;
                                                                             })()}
                                                                         </div>
                                                                     </div>
                                                                 )}

                                                                 {/* Case 4: Essay */}
                                                                 {q.type === 'essay' && (
                                                                     <div className="space-y-4">
                                                                         <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Thống kê tỷ lệ hoàn thành tự luận:</div>
                                                                         <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                                                                             <div className="flex items-center justify-between text-xs sm:text-sm">
                                                                                 <span className="font-semibold text-muted-foreground">Tỉ lệ đạt yêu cầu:</span>
                                                                                 <span className={`px-2 py-0.5 rounded font-bold text-xs ${correctRate >= 50 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                                                                                     {correctRate}%
                                                                                 </span>
                                                                             </div>
                                                                             <div className="w-full bg-muted dark:bg-muted/40 rounded-full h-2 overflow-hidden">
                                                                                 <div className={`h-full rounded-full ${correctRate >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${correctRate}%` }} />
                                                                             </div>
                                                                             {q.final_answer && (
                                                                                 <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground">
                                                                                     <span className="font-bold">Đáp án tham khảo:</span>
                                                                                     <LatexRenderer text={q.final_answer} className="mt-2 prose prose-sm dark:prose-invert max-w-none text-muted-foreground font-medium" />
                                                                                 </div>
                                                                             )}
                                                                         </div>
                                                                     </div>
                                                                 )}

                                                             </div>
                                                         </td>
                                                     </tr>
                                                 )}

                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
