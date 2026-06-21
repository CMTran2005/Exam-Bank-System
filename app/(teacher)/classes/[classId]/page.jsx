"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Mail, Phone, Loader2, CheckCircle2, XCircle, Clock, BookOpen, FileText, Trophy, AlertTriangle, BarChart2, Eye, EyeOff, ArrowUpDown, ChevronDown, Activity, WifiOff, MonitorPlay, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClassDetails } from "@/hooks/teacher/useClassDetails";
import { useLiveExamMonitor } from "@/hooks/teacher/useLiveExamMonitor";
import { classService } from "@/services/classService";
import { toast } from "sonner";
import { ClassResultsTab } from "@/components/teacher/class/ClassResultsTab";
import { ClassExamsTab } from "@/components/teacher/class/ClassExamsTab";
import { ClassLiveMonitorTab } from "@/components/teacher/class/ClassLiveMonitorTab";
import { ClassCheatLogsTab } from "@/components/teacher/class/ClassCheatLogsTab";
import { ClassStatsTab } from "@/components/teacher/class/ClassStatsTab";
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
    const [attempts, setAttempts] = useState([]);
    const [selectedExamDetails, setSelectedExamDetails] = useState(null);
    const [isLoadingExamDetails, setIsLoadingExamDetails] = useState(false);
    const [expandedQuestionId, setExpandedQuestionId] = useState(null);
    const [liveFilterStatus, setLiveFilterStatus] = useState("all");

    const { liveAttempts, loading: liveLoading } = useLiveExamMonitor(null, classId);

    useEffect(() => {
        if (exams && exams.length > 0) {
            // Lấy chi tiết đề thi của đề thi ĐẦU TIÊN (để dùng cho tab Thống kê)
            setIsLoadingExamDetails(true);
            import('@/services/examService').then(m => {
                m.examService.getExamDetails(exams[0].id).then(details => {
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
        setExpandedQuestionId(null);
    }, [exams]);

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
                });
            });
        }
    }, [classDetails]);
    
    useEffect(() => {
        let unsubscribe = null;
        if (classId) {
            import('firebase/firestore').then(({ collection, query, where, onSnapshot }) => {
                import('@/lib/firebase').then(({ db }) => {
                    const q = query(
                        collection(db, "exam_attempts"), 
                        where("classId", "==", classId)
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
    }, [classId]);

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
                        onClick={() => setActiveTab("liveMonitor")}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "liveMonitor" ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 shadow-sm" : "text-muted-foreground hover:text-rose-500"}`}
                    >
                        <Activity className="w-4 h-4 inline-block mr-2" /> Giám sát Live
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
                    <ClassResultsTab classDetails={classDetails} attempts={attempts} sortConfig={sortConfig} handleSort={handleSort} />
                ) : activeTab === "exams" ? (
                    <ClassExamsTab classDetails={classDetails} allEligibleExams={allEligibleExams} isUpdatingExams={isUpdatingExams} toggleAssignExam={toggleAssignExam} toggleSplitExams={toggleSplitExams} />
                ) : activeTab === "liveMonitor" ? (
                    <ClassLiveMonitorTab classDetails={classDetails} liveAttempts={liveAttempts} liveLoading={liveLoading} liveFilterStatus={liveFilterStatus} setLiveFilterStatus={setLiveFilterStatus} />
                ) : activeTab === "cheatLogs" ? (
                    <ClassCheatLogsTab attempts={attempts} />
                ) : activeTab === "stats" ? (
                    <ClassStatsTab isLoadingExamDetails={isLoadingExamDetails} selectedExamDetails={selectedExamDetails} attempts={attempts} expandedQuestionId={expandedQuestionId} setExpandedQuestionId={setExpandedQuestionId} />
                ) : null}
            </div>
        </div>
    );
}
