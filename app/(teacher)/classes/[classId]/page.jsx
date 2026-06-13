"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Mail, Phone, Loader2, CheckCircle2, XCircle, Clock, BookOpen, FileText, Trophy, AlertTriangle, BarChart2, Eye, EyeOff, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClassDetails } from "@/hooks/teacher/useClassDetails";
import { classService } from "@/services/classService";
import { toast } from "sonner";

/**
 * Component ClassDetailsPage
 * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.
 *
 * @param {Object}  params  - Tham số đầu vào
 * @returns {JSX.Element}
 */
export default function ClassDetailsPage({ params }) {
    const { classId } = use(params);
    const {
        authLoading, loading,
        classDetails, students, filteredStudents,
        searchQuery, setSearchQuery,
        toggleAttendance
    } = useClassDetails(classId);

    const [activeTab, setActiveTab] = useState("exams");
    const [exams, setExams] = useState([]);
    const [allEligibleExams, setAllEligibleExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [attempts, setAttempts] = useState([]);
    const [selectedExamDetails, setSelectedExamDetails] = useState(null);
    const [isLoadingExamDetails, setIsLoadingExamDetails] = useState(false);

    useEffect(() => {
        if (selectedExamId && selectedExamId !== "none") {
            setIsLoadingExamDetails(true);
            import('@/services/examService').then(m => {
                m.examService.getExamDetails(selectedExamId).then(details => {
                    setSelectedExamDetails(details);
                    setIsLoadingExamDetails(false);
                }).catch(err => {
                    console.error("Lỗi lấy chi tiết đề thi:", err);
                    setIsLoadingExamDetails(false);
                });
            });
        } else {
            setSelectedExamDetails(null);
        }
    }, [selectedExamId]);

    const [isUpdatingExams, setIsUpdatingExams] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev.key === key) {
                return { ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

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



    const toggleShowResults = async () => {
        if (isUpdatingExams) return;
        setIsUpdatingExams(true);
        try {
            const newShowValue = classDetails.showResults === undefined ? false : !classDetails.showResults;
            await classService.updateClass(classId, { showResults: newShowValue });
            classDetails.showResults = newShowValue;
            toast.success(newShowValue ? "Học sinh sẽ được xem kết quả và đáp án" : "Đã ẩn kết quả và đáp án đối với học sinh");
        } catch (error) {
            console.error(error);
            toast.error("Không thể thay đổi cài đặt");
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
                        onClick={() => setActiveTab("exams")}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "exams" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <BookOpen className="w-4 h-4 inline-block mr-2" /> Đề thi
                    </button>
                    <button
                        onClick={() => setActiveTab("results")}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "results" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Trophy className="w-4 h-4 inline-block mr-2" /> Kết quả thi
                    </button>
                    <button
                        onClick={() => setActiveTab("cheatLogs")}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "cheatLogs" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 shadow-sm" : "text-muted-foreground hover:text-red-500"}`}
                    >
                        <AlertTriangle className="w-4 h-4 inline-block mr-2" /> Gian lận
                    </button>
                    <button
                        onClick={() => setActiveTab("stats")}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "stats" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <BarChart2 className="w-4 h-4 inline-block mr-2" /> Thống kê
                    </button>
                </div>
                
                {(activeTab === "results" || activeTab === "stats") && (
                    <Button 
                        variant="outline" 
                        onClick={toggleShowResults}
                        disabled={isUpdatingExams}
                        className={`font-semibold rounded-xl h-10 ${classDetails?.showResults !== false ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-amber-600 border-amber-200 bg-amber-50'}`}
                    >
                        {classDetails?.showResults !== false ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                        {classDetails?.showResults !== false ? "Học sinh đang xem được kết quả" : "Đang ẩn kết quả đối với học sinh"}
                    </Button>
                )}
                
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
                ) : activeTab === "stats" ? (
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-blue-500" /> Thống kê bài thi
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
                                                    <th className="px-4 py-3 text-center">Câu</th>
                                                    <th className="px-4 py-3 text-center">Tỉ lệ Đúng</th>
                                                    <th className="px-4 py-3 text-center">Lượt chọn A</th>
                                                    <th className="px-4 py-3 text-center">Lượt chọn B</th>
                                                    <th className="px-4 py-3 text-center">Lượt chọn C</th>
                                                    <th className="px-4 py-3 text-center">Lượt chọn D</th>
                                                    <th className="px-4 py-3 text-center">Bỏ qua</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/60">
                                                {selectedExam.questions.map((q, idx) => {
                                                    const alphabet = ["A", "B", "C", "D", "E", "F"];
                                                    const actualCorrectIndex = alphabet.indexOf(q.correct_answer);
                                                    
                                                    let correctCount = 0;
                                                    const choiceCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
                                                    let skippedCount = 0;

                                                    completedAttempts.forEach(a => {
                                                        const ansIdx = a.answers?.[q.id];
                                                        if (ansIdx === undefined || ansIdx === null) {
                                                            skippedCount++;
                                                        } else {
                                                            if (choiceCounts[ansIdx] !== undefined) choiceCounts[ansIdx]++;
                                                            if (ansIdx === actualCorrectIndex) correctCount++;
                                                        }
                                                    });

                                                    const correctRate = Math.round((correctCount / completedAttempts.length) * 100) || 0;
                                                    
                                                    return (
                                                        <tr key={q.id} className="hover:bg-muted/20 transition-colors">
                                                            <td className="px-4 py-3 text-center font-bold">Câu {idx + 1}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-1 rounded font-bold text-xs ${correctRate >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {correctRate}%
                                                                </span>
                                                            </td>
                                                            <td className={`px-4 py-3 text-center ${actualCorrectIndex === 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 font-bold text-emerald-600' : ''}`}>{choiceCounts[0]}</td>
                                                            <td className={`px-4 py-3 text-center ${actualCorrectIndex === 1 ? 'bg-emerald-50 dark:bg-emerald-900/10 font-bold text-emerald-600' : ''}`}>{choiceCounts[1]}</td>
                                                            <td className={`px-4 py-3 text-center ${actualCorrectIndex === 2 ? 'bg-emerald-50 dark:bg-emerald-900/10 font-bold text-emerald-600' : ''}`}>{choiceCounts[2]}</td>
                                                            <td className={`px-4 py-3 text-center ${actualCorrectIndex === 3 ? 'bg-emerald-50 dark:bg-emerald-900/10 font-bold text-emerald-600' : ''}`}>{choiceCounts[3]}</td>
                                                            <td className="px-4 py-3 text-center text-muted-foreground">{skippedCount}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
