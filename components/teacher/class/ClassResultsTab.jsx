import React from "react";
import { Users, ArrowUpDown } from "lucide-react";

export function ClassResultsTab({ classDetails, attempts, sortConfig, handleSort }) {
    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-lg">Bảng điểm thi</h3>
            </div>

            <div className="overflow-x-auto border border-border/60 rounded-xl">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => handleSort('name')}>
                                Họ và Tên <ArrowUpDown className="w-3 h-3 inline-block ml-1 opacity-50" />
                            </th>
                            <th className="px-6 py-4 text-center">Trạng thái</th>
                            <th className="px-6 py-4 text-center cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => handleSort('score')}>
                                Điểm số <ArrowUpDown className="w-3 h-3 inline-block ml-1 opacity-50" />
                            </th>
                            <th className="px-6 py-4 text-right cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => handleSort('submitTime')}>
                                Nộp bài lúc <ArrowUpDown className="w-3 h-3 inline-block ml-1 opacity-50" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {(() => {
                            let mergedStudents = [];
                            const studentIds = new Set();
                            
                            if (classDetails.students) {
                                classDetails.students.forEach(s => {
                                    mergedStudents.push({ id: s.id, name: s.name });
                                    studentIds.add(s.id);
                                });
                            }
                            
                            if (attempts) {
                                attempts.forEach(a => {
                                    if (!studentIds.has(a.studentId)) {
                                        mergedStudents.push({ id: a.studentId, name: a.studentName || "Học sinh ẩn danh" });
                                        studentIds.add(a.studentId);
                                    }
                                });
                            }

                            if (mergedStudents.length === 0) {
                                return (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                            <p className="font-semibold text-foreground">Lớp chưa có học sinh nào</p>
                                        </td>
                                    </tr>
                                );
                            }

                            mergedStudents = mergedStudents.map((student) => {
                                const attempt = attempts.find(a => a.studentId === student.id);
                                return { ...student, attempt };
                            });

                            mergedStudents.sort((a, b) => {
                                let valA, valB;
                                if (sortConfig.key === 'name') {
                                    valA = a.name.toLowerCase();
                                    valB = b.name.toLowerCase();
                                } else if (sortConfig.key === 'score') {
                                    valA = a.attempt ? (a.attempt.score || 0) : -1;
                                    valB = b.attempt ? (b.attempt.score || 0) : -1;
                                } else if (sortConfig.key === 'submitTime') {
                                    valA = a.attempt?.submitTime ? new Date(a.attempt.submitTime).getTime() : 0;
                                    valB = b.attempt?.submitTime ? new Date(b.attempt.submitTime).getTime() : 0;
                                }
                                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                                return 0;
                            });

                            return mergedStudents.map(({ id, name, attempt }) => {
                                return (
                                <tr key={id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4 font-bold text-foreground">
                                        {name}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {attempt ? (
                                            attempt.status === 'completed' ? (
                                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black text-[11px] uppercase tracking-wider">Đã nộp</span>
                                            ) : (
                                                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-black text-[11px] uppercase tracking-wider">Đang thi</span>
                                            )
                                        ) : (
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-black text-[11px] uppercase tracking-wider">Chưa làm</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center font-black text-lg text-primary">
                                        {attempt && attempt.score !== null 
                                            ? `${attempt.score.toFixed(2)}${attempt.maxScore ? ` / ${attempt.maxScore.toFixed(2)}` : ''}` 
                                            : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right text-muted-foreground text-xs font-medium">
                                        {attempt && attempt.submitTime ? new Date(attempt.submitTime).toLocaleString('vi-VN') : "--"}
                                    </td>
                                </tr>
                                );
                            });
                        })()}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
