"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Mail, Phone, Loader2, CheckCircle2, XCircle, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClassDetails } from "@/hooks/useClassDetails";

export default function ClassDetailsPage({ params }) {
    const { classId } = use(params);
    const {
        authLoading, loading,
        classDetails, students, filteredStudents,
        searchQuery, setSearchQuery,
        toggleAttendance
    } = useClassDetails(classId);

    if (authLoading || loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
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
                <div className="relative flex-1 w-full sm:max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Tìm kiếm thí sinh theo tên, email..." 
                        className="pl-9 h-10 rounded-xl border-border bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{students.filter(s => s.attendance === "present").length} Có mặt</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span>{students.filter(s => s.attendance === "absent").length} Vắng</span>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Họ và Tên</th>
                                <th className="px-6 py-4">Liên lạc</th>
                                <th className="px-6 py-4 text-center">Trạng thái Điểm danh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 font-bold text-foreground flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-black">
                                                {student.name.charAt(0)}
                                            </div>
                                            {student.name}
                                        </td>
                                        <td className="px-6 py-4 space-y-1">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span className="text-xs">{student.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="w-3.5 h-3.5" />
                                                <span className="text-xs">{student.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Button 
                                                variant="outline" 
                                                className={`h-8 rounded-full text-xs font-bold gap-1.5 border-transparent w-32 justify-center transition-all ${
                                                    student.attendance === "present" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                    student.attendance === "absent" ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" :
                                                    "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                                                }`}
                                                onClick={() => toggleAttendance(student.id)}
                                            >
                                                {student.attendance === "present" && <><CheckCircle2 className="w-3.5 h-3.5" /> Có mặt</>}
                                                {student.attendance === "absent" && <><XCircle className="w-3.5 h-3.5" /> Vắng mặt</>}
                                                {student.attendance === "pending" && <><Clock className="w-3.5 h-3.5" /> Chờ...</>}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center">
                                        <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                        <p className="font-semibold text-foreground">Chưa có thí sinh nào tham gia</p>
                                        <p className="text-xs text-muted-foreground mt-1">Thí sinh sẽ xuất hiện ở đây khi họ dùng mã lớp tham gia thi qua cổng học sinh.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
