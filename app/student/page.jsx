"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useClasses } from "@/hooks/student/useClasses";
import JoinClassForm from "@/components/student/JoinClassForm";
import ClassGrid from "@/components/student/ClassGrid";

/**
 * Component StudentDashboard
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @returns {JSX.Element}
 */
export default function StudentDashboard() {
    const { currentUser } = useAuth();
    const { classes, loading, loadClasses } = useClasses(currentUser);

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                        Xin chào, {currentUser?.name}!
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Sẵn sàng cho các bài kiểm tra sắp tới chưa?
                    </p>
                </div>

                <JoinClassForm onJoinSuccess={loadClasses} />
            </div>

            {/* Classes Grid */}
            <ClassGrid classes={classes} loading={loading} />
        </div>
    );
}
