"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Mail, Phone, Loader2, CheckCircle2, XCircle, Clock, BookOpen, FileText, Trophy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClassDetails } from "@/hooks/useClassDetails";
import { classService } from "@/services/classService";
import { toast } from "sonner";

export default function ClassDetailsPage({ params }) {
    const { classId } = use(params);
    const {
        authLoading, loading,
        classDetails, students, filteredStudents,
        searchQuery, setSearchQuery,
        toggleAttendance
    } = useClassDetails(classId);

    const [activeTab, setActiveTab] = useState("results");
    const [exams, setExams] = useState([]);
    const [allEligibleExams, setAllEligibleExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [attempts, setAttempts] = useState([]);
    const [isUpdatingExams, setIsUpdatingExams] = useState(false);

    useEffect(() => {
        if (classDetails) {
            import('@/services/examService').then(m => {
                m.examService.getUserExams(classDetails.teacherId).then(allExams => {
                    const eligible = allExams.filter(e => e.subject === classDetails.subject && e.grade === classDetails.grade);
                    setAllEligibleExams(eligible);
                    
                    let clsExams = [];
                    if (classDetails.assignedExams !== undefined) {
                        clsExams = eligible.filter(e => classDetails.assignedExams.includes(e.id));
                    } else {
                        clsExams = []; // Mặc định KHÔNG giao đề nào cho đến khi được chọn
                    }
                    setExams(clsExams);
                    if (clsExams.length > 0) setSelectedExamId(clsExams[0].id);
                });
            });
        }
    }, [classDetails]);
    
    useEffect(() => {
        let unsubscribe = null;
        if (selectedExamId) {
            import('firebase/firestore').then(({ collection, query, where, onSnapshot }) => {
                import('@/lib/firebase').then(({ db }) => {
                    const q = query(
                        collection(db, "exam_attempts"), 
                        where("classId", "==", classId),
                        where("examId", "==", selectedExamId)
                    );
                    
                    unsubscribe = onSnapshot(q, (snapshot) => {
                        const data = [];
                        snapshot.forEach((doc) => {
                            data.push({ id: doc.id, ...doc.data() });
                        });
                        setAttempts(data);
                    }, (error) => {
                        console.error("Lỗi onSnapshot attempts:", error);
                    });
                });
            });
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [selectedExamId, classId]);

    const toggleAssignExam = async (examId) => {
        if (isUpdatingExams) return;
        setIsUpdatingExams(true);
        try {
            // Lấy mảng hiện tại, nếu undefined thì coi như mảng rỗng (không có đề nào)
            let currentAssigned = classDetails.assignedExams !== undefined 
                ? classDetails.assignedExams 
                : [];
            
            let newAssigned;
            if (currentAssigned.includes(examId)) {
                newAssigned = currentAssigned.filter(id => id !== examId);
            } else {
                newAssigned = [...currentAssigned, examId];
            }
            
            await classService.updateClass(classId, { assignedExams: newAssigned });
            classDetails.assignedExams = newAssigned; // Cập nhật local state (mutate tạm)
            
            const newClsExams = allEligibleExams.filter(e => newAssigned.includes(e.id));
            setExams(newClsExams);
            toast.success("Đã cập nhật danh sách đề thi của lớp");
        } catch (error) {
            console.error(error);
            toast.error("Không thể cập nhật cấu hình đề thi");
        } finally {
            setIsUpdatingExams(false);
        }
    };

    const toggleSplitExams = async () => {
        if (isUpdatingExams) return;
        setIsUpdatingExams(true);
        try {
            const newSplitValue = !classDetails.splitExams;
            await classService.updateClass(classId, { splitExams: newSplitValue });
            classDetails.splitExams = newSplitValue; // Mutate local state
            toast.success(newSplitValue ? "Đã bật chế độ chia đề chẵn/lẻ" : "Đã tắt chế độ chia đề");
        } catch (error) {
            console.error(error);
            toast.error("Không thể thay đổi cài đặt chia đề");
        } finally {
            setIsUpdatingExams(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 border-b border-border/60 pb-6">
                <Link href="/classes">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        {classDetails?.name || "Danh sách điểm danh"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Quản lý trạng thái tham gia thi của thí sinh trong lớp thi này.
                    </p>
                </div>
            </div>

            {classDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase font-bold text-muted-foreground">Môn thi</p>
                            <p className="font-semibold text-sm text-foreground">{classDetails.subject} • {classDetails.grade}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase font-bold text-muted-foreground">Thời gian thi</p>
                            <p className="font-semibold text-sm text-foreground">
                                {classDetails.startTime && classDetails.endTime ? (
                                    `${new Date(classDetails.startTime).toLocaleDateString('vi-VN')} ${new Date(classDetails.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(classDetails.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${classDetails.duration || 0} phút)`
                                ) : "Chưa cập nhật"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab("results")}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "results" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Trophy className="w-4 h-4 inline-block mr-2" /> Kết quả thi
                    </button>
                    <button
                        onClick={() => setActiveTab("exams")}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "exams" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <BookOpen className="w-4 h-4 inline-block mr-2" /> Đề thi
                    </button>
                    <button
                        onClick={() => setActiveTab("cheatLogs")}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "cheatLogs" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 shadow-sm" : "text-muted-foreground hover:text-red-500"}`}
                    >
                        <AlertTriangle className="w-4 h-4 inline-block mr-2" /> Gian lận
                    </button>
                </div>
                
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {activeTab === "results" ? (
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <h3 className="font-bold text-lg">Bảng điểm thi</h3>
                        <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                            <SelectTrigger className="w-full sm:w-[280px]">
                                <SelectValue placeholder="Chọn đề thi..." />
                            </SelectTrigger>
                            <SelectContent>
                                {exams.length === 0 && <SelectItem value="none" disabled>Chưa có bài kiểm tra nào</SelectItem>}
                                {exams.map(ex => (
                                    <SelectItem key={ex.id} value={ex.id}>{ex.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-x-auto border border-border/60 rounded-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Họ và Tên</th>
                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                    <th className="px-6 py-4 text-center">Điểm số</th>
                                    <th className="px-6 py-4 text-right">Nộp bài lúc</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {(() => {
                                    const mergedStudents = [];
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

                                    return mergedStudents.map((student) => {
                                        const attempt = attempts.find(a => a.studentId === student.id);
                                        return (
                                        <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4 font-bold text-foreground">
                                                {student.name}
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
                                                {attempt && attempt.score !== null ? attempt.score.toFixed(2) : "-"}
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
                ) : activeTab === "exams" ? (
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <h3 className="font-bold text-lg">Đề thi của lớp</h3>
                        <div className="flex gap-2">
                            {(classDetails.assignedExams?.length > 1) && (
                                <Button 
                                    variant={classDetails.splitExams ? "default" : "outline"}
                                    onClick={toggleSplitExams}
                                    disabled={isUpdatingExams}
                                    className="rounded-xl text-xs font-bold px-4 h-9 shadow-sm bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    {classDetails.splitExams ? "Đang chia đề (Trộn)" : "Chia đề chẵn/lẻ"}
                                </Button>
                            )}
                            <Link href={`/create-question?subject=${classDetails.subject}&grade=${classDetails.grade}`}>
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold px-4 h-9 shadow-sm">
                                    <BookOpen className="w-4 h-4 mr-1.5" /> Giao đề thi mới
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allEligibleExams.length === 0 ? (
                            <div className="col-span-full text-center py-12 border-2 border-dashed border-border rounded-xl">
                                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <h3 className="font-bold text-foreground">Bạn chưa tạo đề thi nào cho {classDetails.subject} Lớp {classDetails.grade}</h3>
                                <p className="text-xs text-muted-foreground mt-1">Hãy tạo đề thi mới để giao cho học sinh trong lớp.</p>
                            </div>
                        ) : (
                            allEligibleExams.map(ex => {
                                const isAssigned = classDetails.assignedExams !== undefined 
                                    ? classDetails.assignedExams.includes(ex.id) 
                                    : false; // Mặc định không giao

                                return (
                                <div key={ex.id} className={`p-5 border bg-background rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-sm ${isAssigned ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60 opacity-70'}`}>
                                    <div className="flex-1">
                                        <h4 className="font-bold mb-2 line-clamp-1 text-foreground leading-tight">{ex.title}</h4>
                                        <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-4">
                                            <span className="flex items-center"><Clock className="w-3.5 h-3.5 inline mr-1 text-primary" /> {ex.duration || 90} phút</span>
                                            <span className="flex items-center"><FileText className="w-3.5 h-3.5 inline mr-1 text-primary" /> {ex.questions?.length || ex.total_questions || 0} câu</span>
                                        </div>
                                    </div>
                                    <Button 
                                        variant={isAssigned ? "default" : "outline"}
                                        className={`w-full sm:w-auto shrink-0 rounded-xl font-bold transition-all ${isAssigned ? '' : 'text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => toggleAssignExam(ex.id)}
                                        disabled={isUpdatingExams}
                                    >
                                        {isAssigned ? (
                                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Đã giao</>
                                        ) : (
                                            "Bỏ qua"
                                        )}
                                    </Button>
                                </div>
                                )
                            })
                        )}
                    </div>
                </div>
                ) : activeTab === "cheatLogs" ? (
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <h3 className="font-bold text-lg text-red-500 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Hệ thống giám sát gian lận
                            </h3>
                            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                <SelectTrigger className="w-full sm:w-[280px]">
                                    <SelectValue placeholder="Chọn đề thi..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.length === 0 && <SelectItem value="none" disabled>Chưa có bài kiểm tra nào</SelectItem>}
                                    {exams.map(ex => (
                                        <SelectItem key={ex.id} value={ex.id}>{ex.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="overflow-x-auto border border-border/60 rounded-xl">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Thí sinh</th>
                                        <th className="px-6 py-4 text-center">Chuyển Tab / Mất Focus</th>
                                        <th className="px-6 py-4 text-center">Dùng phím tắt cấm</th>
                                        <th className="px-6 py-4 text-center">Tiện ích (Extension)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {attempts.filter(a => (a.tabSwitchCount > 0) || (a.shortcutCheatCount > 0) || (a.extensionCheatCount > 0) || (a.otherCheatCount > 0) || (a.cheatLogs && a.cheatLogs.length > 0)).length > 0 ? (
                                        attempts.filter(a => (a.tabSwitchCount > 0) || (a.shortcutCheatCount > 0) || (a.extensionCheatCount > 0) || (a.otherCheatCount > 0) || (a.cheatLogs && a.cheatLogs.length > 0)).map(a => (
                                            <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4 font-bold text-foreground">
                                                    {a.studentName}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {a.tabSwitchCount > 0 ? (
                                                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-black text-xs">{a.tabSwitchCount} lần</span>
                                                    ) : <span className="text-muted-foreground/50">-</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {a.shortcutCheatCount > 0 ? (
                                                        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-black text-xs">{a.shortcutCheatCount} lần</span>
                                                    ) : <span className="text-muted-foreground/50">-</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {a.extensionCheatCount > 0 ? (
                                                        <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-black text-xs">{a.extensionCheatCount} lần</span>
                                                    ) : <span className="text-muted-foreground/50">-</span>}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center">
                                                <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
                                                <p className="font-semibold text-foreground">Không phát hiện gian lận nào</p>
                                                <p className="text-xs text-muted-foreground mt-1">Tất cả thí sinh đều đang tuân thủ quy chế thi.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
