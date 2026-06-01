import React from "react";

/**
 * Component StudentSummaryCards
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  avgScore - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function StudentSummaryCards({ avgScore, attempts }) {
    const officialAttempts = attempts.filter(a => a.classId !== "practice").length;
    const practiceAttempts = attempts.filter(a => a.classId === "practice").length;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-sky-50 dark:bg-sky-950/30 p-4 rounded-2xl border border-sky-100 dark:border-sky-900">
                <p className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase mb-1">Điểm Trung Bình</p>
                <p className="text-3xl font-black text-sky-700 dark:text-sky-300">{avgScore}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Tổng Bài Đã Làm</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{attempts.length}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-100 dark:border-amber-900">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">Bài Thi Chính Thức</p>
                <p className="text-3xl font-black text-amber-700 dark:text-amber-300">{officialAttempts}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100 dark:border-purple-900">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-1">Bài Tự Luyện</p>
                <p className="text-3xl font-black text-purple-700 dark:text-purple-300">{practiceAttempts}</p>
            </div>
        </div>
    );
}
