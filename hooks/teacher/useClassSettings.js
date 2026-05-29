import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { classService } from "@/services/classService";
import useSubjects from "@/hooks/shared/useSubjects";
import { useConfirm } from "@/context/ConfirmContext";
import { toast } from "sonner";

export function useClassSettings(classId) {
    const confirmDialog = useConfirm();
    const { gradeSubjectsMap, loading: subjectsLoading } = useSubjects();
    const GRADES = Object.keys(gradeSubjectsMap);
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [className, setClassName] = useState("");
    const [schoolYear, setSchoolYear] = useState("");
    const [grade, setGrade] = useState("");
    const [subject, setSubject] = useState("");
    const [examDate, setExamDate] = useState("");
    const [examTime, setExamTime] = useState("");
    const [examDuration, setExamDuration] = useState(45);
    
    const [isSaving, setIsSaving] = useState(false);
    
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
    
    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    const currentYear = new Date().getFullYear();
    const yearsList = Array.from({ length: 21 }, (_, i) => {
        const startYear = currentYear - 10 + i;
        return `${startYear}-${startYear + 1}`;
    });

    useEffect(() => {
        if (!authLoading && !currentUser) {
            router.push("/login");
            return;
        }
        
        const fetchClassData = async () => {
            if (currentUser && classId) {
                try {
                    const clsData = await classService.getClassDetails(classId);
                    if (clsData) {
                        setClassName(clsData.name);
                        setSchoolYear(clsData.schoolYear);
                        setGrade(clsData.grade || "12");
                        setSubject(clsData.subject || "Toán học");
                        if (clsData.startTime) {
                            const st = new Date(clsData.startTime);
                            setExamDate(st.toISOString().split('T')[0]);
                            setExamTime(st.toTimeString().substring(0, 5));
                        }
                        setExamDuration(clsData.duration || 45);
                    } else {
                        router.push("/classes");
                    }
                } catch (error) {
                    console.error("Lỗi tải lớp học:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchClassData();
    }, [currentUser, authLoading, router, classId, gradeSubjectsMap]);

    const handleSave = async () => {
        if (!className.trim()) return;
        setIsSaving(true);
        try {
            let computedStartTime = null;
            let computedEndTime = null;
            
            if (examDate && examTime) {
                computedStartTime = new Date(`${examDate}T${examTime}`).toISOString();
                const end = new Date(new Date(computedStartTime).getTime() + examDuration * 60000);
                computedEndTime = end.toISOString();
            }

            await classService.updateClass(classId, {
                name: className,
                schoolYear: schoolYear,
                grade: grade,
                subject: subject,
                startTime: computedStartTime,
                endTime: computedEndTime,
                duration: examDuration
            });
            toast.success("Đã lưu cấu hình thành công!");
        } catch (error) {
            toast.error("Có lỗi xảy ra khi lưu!");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (await confirmDialog("Hành động này KHÔNG THỂ HOÀN TÁC. Bạn có chắc chắn muốn xóa lớp học này và toàn bộ dữ liệu học sinh bên trong?", "Xóa lớp học")) {
            try {
                await classService.deleteClass(classId);
                router.push("/classes");
                toast.success("Đã xóa lớp học!");
            } catch (error) {
                toast.error("Lỗi khi xóa lớp học!");
            }
        }
    };

    return {
        authLoading, loading: loading || subjectsLoading,
        gradeSubjectsMap,
        className, setClassName,
        schoolYear, setSchoolYear,
        grade, setGrade,
        subject, setSubject,
        examDate, setExamDate,
        examTime, setExamTime,
        examDuration, setExamDuration,
        isSaving,
        activeDropdown, toggleDropdown,
        isYearDropdownOpen, setIsYearDropdownOpen,
        yearsList, GRADES,
        handleSave, handleDelete
    };
}
