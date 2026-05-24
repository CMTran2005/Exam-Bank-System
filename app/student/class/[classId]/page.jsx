"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, FileText, ArrowRight, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classService } from "@/services/classService";
import { examService } from "@/services/examService";
import { examAttemptService } from "@/services/examAttemptService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function StudentClassPage({ params }) {
    const { classId } = use(params);
    const { currentUser } = useAuth();
    
    const [classDetails, setClassDetails] = useState(null);
    const [exams, setExams] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser && classId) {
            loadClassData();
        }
    }, [currentUser, classId]);

    const loadClassData = async () => {
        setLoading(true);
        try {
            // 1. Fetch class details
            const details = await classService.getClassDetails(classId);
            if (!details) {
                toast.error("Không tìm thấy thông tin lớp học!");
                return;
            }
            setClassDetails(details);

            // 2. Fetch all exams by this teacher
            const allTeacherExams = await examService.getUserExams(details.teacherId);
            // Lọc đề thi: Nếu giáo viên có chỉ định cụ thể (assignedExams) thì lấy theo danh sách đó.
            // Nếu không có, tự động lọc theo môn và khối của lớp.
            let classExams = [];
            if (details.assignedExams !== undefined) {
                classExams = allTeacherExams.filter(ex => details.assignedExams.includes(ex.id));
                
                // Logic chia đề: Nếu giáo viên bật splitExams và có nhiều hơn 1 đề
                if (details.splitExams && classExams.length > 1) {
                    // Dùng mã UID của học sinh để chia ngẫu nhiên nhưng cố định
                    const charSum = currentUser.uid.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                    const assignedIndex = charSum % classExams.length;
                    classExams = [classExams[assignedIndex]];
                }
            } else {
                classExams = []; // Mặc định không có đề thi nào cho đến khi giáo viên gán
            }
            setExams(classExams);

            // 3. Fetch lịch sử làm bài của học sinh này
            const studentAttempts = await examAttemptService.getStudentAttempts(currentUser.uid);
            // Lọc các attempt thuộc class này
            const classAttempts = studentAttempts.filter(att => att.classId === classId);
            setAttempts(classAttempts);

        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải dữ liệu lớp học");
        } finally {
            setLoading(false);
        }
    };

    const getExamStatus = (examId) => {
        const attempt = attempts.find(a => a.examId === examId);
        if (!attempt) return { status: 'not_started', label: 'Chưa làm', color: 'bg-slate-100 text-slate-600' };
        if (attempt.status === 'in_progress') return { status: 'in_progress', label: 'Đang làm', color: 'bg-amber-100 text-amber-700' };
        if (attempt.status === 'completed') return { status: 'completed', label: `Đã nộp (${attempt.score || 0} điểm)`, color: 'bg-emerald-100 text-emerald-700' };
        return { status: 'not_started', label: 'Chưa làm', color: 'bg-slate-100 text-slate-600' };
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!classDetails) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Không tìm thấy dữ liệu lớp học.</p>
                <Link href="/student">
                    <Button className="mt-4">Quay lại Bảng điều khiển</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
                <Link href="/student">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">{classDetails.name}</h1>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                        {classDetails.grade} • {classDetails.subject}
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-8">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    Danh sách Bài kiểm tra
                </h2>

                {exams.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                        <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <h3 className="font-bold text-foreground">Chưa có bài kiểm tra nào</h3>
                        <p className="text-sm text-muted-foreground mt-1">Giáo viên chưa giao bài tập cho lớp này.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {exams.map((exam) => {
                            const statusInfo = getExamStatus(exam.id);
                            
                            return (
                                <div key={exam.id} className="flex flex-col p-5 rounded-xl border border-border bg-background hover:border-primary/40 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-base leading-tight line-clamp-2">{exam.title || "Bài kiểm tra"}</h3>
                                        <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full whitespace-nowrap ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground mb-5 mt-auto pt-3">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString("vi-VN") : "Đang cập nhật"}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {exam.duration || 45} phút
                                        </div>
                                    </div>

                                    {statusInfo.status === 'completed' ? (
                                        <Link href={`/student/exam/${exam.id}/result`}>
                                            <Button variant="outline" className="w-full text-xs font-bold rounded-xl border-primary text-primary hover:bg-primary hover:text-white">
                                                Xem kết quả
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link href={`/student/exam/${exam.id}?classId=${classId}`}>
                                            <Button className="w-full text-xs font-bold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity">
                                                {statusInfo.status === 'in_progress' ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}
                                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
