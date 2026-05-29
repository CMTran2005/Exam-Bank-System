"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import StudentStatistics from "@/components/student/StudentStatistics";
import { studentService } from "@/services/studentService";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
    const { currentUser } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadClasses();
        }
    }, [currentUser]);

    const loadClasses = async () => {
        try {
            const data = await studentService.getJoinedClasses(currentUser.uid);
            setClasses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-6 rounded-3xl shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UserCircle className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            Hồ sơ của {currentUser.name}
                        </h1>
                        <p className="text-muted-foreground mt-1 font-medium">
                            Theo dõi quá trình rèn luyện và thành tích của bạn
                        </p>
                    </div>
                </div>
            </div>

            {!loading && <StudentStatistics studentUid={currentUser.uid} classes={classes} />}
        </div>
    );
}
