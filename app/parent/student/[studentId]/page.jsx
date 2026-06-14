"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStudentReport } from "@/hooks/parent/useStudentReport";
import { db } from "@/lib/firebase";
import { ChevronLeft, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { studentService } from "@/services/studentService";
import StudentSummaryCards from "@/components/parent/student-detail/StudentSummaryCards";
import StudentCharts from "@/components/parent/student-detail/StudentCharts";
import StudentExamHistory from "@/components/parent/student-detail/StudentExamHistory";

/**
 * Component ParentStudentDetail
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function ParentStudentDetail() {
    const params = useParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    const studentId = params?.studentId;
    
    const { studentData, classes, attempts, officialRadarData, practiceRadarData, trendData, avgScore, loading } = useStudentReport(currentUser, studentId, router);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="flex flex-col h-[60vh] items-center justify-center space-y-4">
                <p className="text-lg font-bold text-muted-foreground">Không tìm thấy thông tin học sinh.</p>
                <Button onClick={() => router.push("/parent")} variant="outline">
                    Quay lại
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => router.push("/parent")} className="rounded-xl shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-border shadow-sm overflow-hidden bg-muted flex items-center justify-center text-xl font-black text-muted-foreground shrink-0">
                        {studentData.photoURL ? (
                            <img src={studentData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            studentData.name?.charAt(0) || "H"
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-foreground leading-none">
                            Báo cáo của {studentData.name}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4" />
                            {studentData.grade ? `Học sinh lớp ${studentData.grade}` : "Thông tin học sinh"}
                        </p>
                    </div>
                </div>
            </div>

            {/* BẢNG TÓM TẮT ĐỘC QUYỀN CHO PHỤ HUYNH */}
            <StudentSummaryCards avgScore={avgScore} attempts={attempts} />

            {/* KHU VỰC BIỂU ĐỒ TRỰC QUAN */}
            <StudentCharts officialRadarData={officialRadarData} practiceRadarData={practiceRadarData} trendData={trendData} />

            {/* Chi tiết Bài Thi và Bài Luyện */}
            <StudentExamHistory attempts={attempts} classes={classes} />
        </div>
    );
}
