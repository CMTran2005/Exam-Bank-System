"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { studentService } from "@/services/studentService";
import { BookOpen, Search, Plus, Loader2, ArrowRight, BookMarked, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function StudentDashboard() {
    const { currentUser } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [codeValues, setCodeValues] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const joinCode = codeValues.join("");
    
    const [joining, setJoining] = useState(false);

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

    const handleJoinClass = async (e) => {
        e.preventDefault();
        if (joinCode.length < 6) {
            toast.error("Vui lòng nhập đủ 6 ký tự mã lớp");
            return;
        }
        
        const code = joinCode.trim().toUpperCase();

        setJoining(true);
        try {
            const result = await studentService.joinClassByCode(currentUser.uid, currentUser.name, code);
            if (result.success) {
                toast.success(`Tham gia lớp "${result.classData.name}" thành công!`);
                setCodeValues(["", "", "", "", "", ""]);
                loadClasses(); // Refresh danh sách
            }
        } catch (error) {
            toast.error(error.message || "Có lỗi xảy ra khi tham gia lớp.");
        } finally {
            setJoining(false);
        }
    };

    const handleCodeChange = (index, value) => {
        const val = value.slice(-1).toUpperCase();
        const newVals = [...codeValues];
        newVals[index] = val;
        setCodeValues(newVals);
        
        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !codeValues[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim().toUpperCase();
        if (!pastedData) return;
        
        // Chỉ lấy tối đa 6 ký tự chữ/số
        const cleanData = pastedData.replace(/[^A-Z0-9]/g, '').slice(0, 6);
        if (!cleanData) return;
        
        const newVals = [...codeValues];
        for (let i = 0; i < cleanData.length; i++) {
            newVals[i] = cleanData[i];
        }
        setCodeValues(newVals);
        
        // Focus vào ô tiếp theo hoặc ô cuối cùng nếu đã đủ
        const nextIndex = Math.min(cleanData.length, 5);
        inputRefs.current[nextIndex]?.focus();
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

                <form onSubmit={handleJoinClass} className="w-full lg:w-auto bg-muted/30 p-2 sm:p-3 rounded-2xl border border-border flex flex-col sm:flex-row items-center gap-3 mt-4 md:mt-0 transition-colors hover:bg-muted/50">
                    <div className="flex gap-1.5 sm:gap-2">
                        {codeValues.map((v, i) => (
                            <Input 
                                key={i}
                                ref={el => inputRefs.current[i] = el}
                                value={v}
                                onChange={(e) => handleCodeChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                onPaste={handlePaste}
                                className="w-10 h-11 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-black rounded-xl bg-background border-border shadow-sm focus-visible:ring-primary focus-visible:ring-offset-1 uppercase transition-all"
                                maxLength={1}
                                disabled={joining}
                                placeholder="-"
                            />
                        ))}
                    </div>
                    <Button
                        type="submit"
                        disabled={joining || joinCode.length < 6}
                        className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 transition-all text-sm shadow-sm shrink-0"
                    >
                        {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tham Gia"}
                    </Button>
                </form>
            </div>

            {/* Classes Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-primary" />
                        Lớp thi của tôi ({classes.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-card rounded-2xl animate-pulse border border-border"></div>
                        ))}
                    </div>
                ) : classes.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Chưa tham gia lớp nào</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Hãy xin mã lớp từ giáo viên của bạn và nhập vào ô tìm kiếm phía trên để bắt đầu nhé!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {classes.map((cls) => (
                            <div key={cls.id} className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                                <div className={`h-2.5 w-full ${cls.color || "bg-blue-500"}`}></div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{cls.name}</h3>
                                            <p className="text-xs font-semibold text-muted-foreground mt-1">{cls.grade} • {cls.subject}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5 mr-1" />
                                            Đã tham gia: {new Date(cls.joinedAt).toLocaleDateString("vi-VN")}
                                        </div>
                                        <Link href={`/student/class/${cls.id}`}>
                                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-primary hover:bg-primary/10 font-semibold px-3">
                                                Vào lớp <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
