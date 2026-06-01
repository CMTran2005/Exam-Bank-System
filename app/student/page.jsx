"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { studentService } from "@/services/studentService";
import { toast } from "sonner";
import JoinClassForm from "@/components/student/JoinClassForm";
import ClassGrid from "@/components/student/ClassGrid";

export default function StudentDashboard() {
    const { currentUser } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadClasses();
        }
    }, [currentUser]);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const data = await studentService.getJoinedClasses(currentUser.uid);
            setClasses(data);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải danh sách lớp học.");
        } finally {
            setLoading(false);
        }
    };

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
