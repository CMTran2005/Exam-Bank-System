import { BookOpen, MapPin, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { getDynamicAcademicYears } from "@/lib/constants";
import useProvinces from "@/hooks/shared/useProvinces";
import useSubjects from "@/hooks/shared/useSubjects";
import { useExamDataStore } from "@/store/useExamDataStore";

const ACADEMIC_YEARS = getDynamicAcademicYears();

export function ExamInfoCard({ handleTitleChange, handleCodeChange, handleGradeChange }) {
    const { provinces } = useProvinces();
    const { gradeSubjectsMap } = useSubjects();
    const GRADES = Object.keys(gradeSubjectsMap);
    const { examInfo, setExamInfo, questionsList } = useExamDataStore();
    const questionsCount = questionsList.length;

    return (
        <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
                <CardTitle className="text-lg sm:text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 shrink-0" />
                    Cấu Hình Thông Tin Đề Thi
                </CardTitle>
                <div className="flex items-center gap-3">
                    <div 
                        className="flex items-center gap-2 bg-background/50 hover:bg-background/80 transition-colors px-3 py-1 rounded-full border border-blue-200/60 dark:border-blue-800 cursor-pointer"
                        title="Cho phép giáo viên khác tìm kiếm và nhân bản đề thi này"
                    >
                        <Checkbox 
                            id="isPublic" 
                            checked={examInfo.isPublic || false} 
                            onCheckedChange={(checked) => setExamInfo({ ...examInfo, isPublic: checked })}
                            className="w-3.5 h-3.5"
                        />
                        <label htmlFor="isPublic" className="text-[11px] font-extrabold uppercase text-blue-700 dark:text-blue-400 cursor-pointer flex items-center gap-1 select-none">
                            <Globe className="w-3 h-3" /> Chia sẻ Công khai
                        </label>
                    </div>
                    <div className="text-[11px] font-extrabold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200/60 dark:border-blue-900/40 select-none shrink-0">
                        Tổng số: {questionsCount} câu hỏi
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2 lg:col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tiêu đề đề thi</label>
                        <Input
                            placeholder="Ví dụ: Đề thi thử THPT Quốc Gia môn Toán..."
                            value={examInfo.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                        />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="text-xs font-bold text-blue-700 dark:text-blue-400 block mb-1.5 flex items-center gap-1">
                            Mã đề thi (Slug ID)
                        </label>
                        <Input
                            placeholder="vi-du-ma-de-thi"
                            value={examInfo.code}
                            onChange={handleCodeChange}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Thời gian (phút)</label>
                        <Input
                            type="number"
                            placeholder="Ví dụ: 90"
                            value={examInfo.duration}
                            onChange={(e) => setExamInfo({ ...examInfo, duration: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tỉnh thành</label>
                        <Combobox
                            value={examInfo.province}
                            onValueChange={(val) => setExamInfo({ ...examInfo, province: val })}
                            options={provinces.map(p => ({ value: p, label: p }))}
                            placeholder="Chọn tỉnh thành"
                            icon={MapPin}
                            className=""
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Năm học</label>
                        <Select value={examInfo.year} onValueChange={(val) => setExamInfo({ ...examInfo, year: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn năm học" />
                            </SelectTrigger>
                            <SelectContent>
                                {ACADEMIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Cấp học / Lớp</label>
                        <Select value={examInfo.grade} onValueChange={handleGradeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn cấp học" />
                            </SelectTrigger>
                            <SelectContent>
                                {GRADES.map((g) => (
                                    <SelectItem key={g} value={g}>
                                        {g === "Đại học" ? "Đại học" : `Khối ${g}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="text-xs font-semibold text-blue-700 dark:text-blue-400 block mb-1.5">Môn học</label>
                        <Combobox
                            value={examInfo.subject}
                            onValueChange={(val) => setExamInfo({ ...examInfo, subject: val })}
                            options={(gradeSubjectsMap[examInfo.grade] || []).map(sub => ({ value: sub, label: sub }))}
                            placeholder={examInfo.grade ? "Chọn môn học" : "Chọn lớp trước"}
                            disabled={!examInfo.grade}
                            icon={BookOpen}
                            className={!examInfo.grade ? "text-muted-foreground" : "border-blue-300 text-blue-900 dark:border-blue-700 dark:text-blue-300 font-medium"}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
