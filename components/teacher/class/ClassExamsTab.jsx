import React from "react";
import Link from "next/link";
import { BookOpen, FileText, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClassExamsTab({ classDetails, allEligibleExams, isUpdatingExams, toggleAssignExam, toggleSplitExams }) {
    return (
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
    );
}
